# Hướng dẫn hệ thống RAG tư vấn mỹ phẩm

## 1. Giới thiệu

`RAG_LANGCHAIN_V4` là chatbot tư vấn mỹ phẩm tiếng Việt. Hệ thống dùng:

- FastAPI + Uvicorn để cung cấp API.
- MongoDB để lưu sản phẩm và lịch sử chat theo `user_id` + `session_id`.
- Qdrant để lưu vector sản phẩm.
- LangChain để chuẩn hóa document và tích hợp vector store.
- Hugging Face Embeddings với `dangvantuan/vietnamese-embedding`.
- PyVi `from pyvi.ViTokenizer import tokenize` để tokenize tiếng Việt trước khi embedding.
- CrossEncoder `AITeamVN/Vietnamese_Reranker` để rerank candidate.
- Ollama `qwen2.5:3b` hoặc Gemini để sinh câu trả lời.

Nguồn dữ liệu sản phẩm duy nhất là:

```text
../backend/data/Hasaki_Data_Final.xlsx
```

File có 6.673 sản phẩm và 19 cột. Backend import file này vào
`smart_cosmetics_crm.products`; RAG chỉ đọc collection dùng chung và không seed
một bản MongoDB thứ hai.

Schema category trong MongoDB dùng chung:

```text
category_level_1
category_level_2
benefits             <- category_level_3 trong Excel
product_type         <- category_level_4 trong Excel
ingredients
usage_instructions
```

Frontend gọi `POST http://localhost:8000/chat`. Response `products` chứa
`product_id` để thêm giỏ hàng và `product_url=/products/{product_id}` để mở trang
chi tiết sản phẩm của frontend.

## 2. Kiến trúc tổng quan

```text
Frontend `useChatbot`
  -> lấy user_id từ user đăng nhập, fallback "guest"
  -> lấy hoặc tạo session_id trong localStorage key "chatbotSession"
  -> POST /chat { user_id, session_id, query }

FastAPI POST /chat
  -> InferenceEngine.chat(query, user_id, session_id)
     -> load history MongoDB theo user_id + session_id
        -> summary cũ nếu có
        -> 8 turn gần nhất
     -> Router: chitchat | product_rag
        -> chitchat:
           LLM trả lời từ query + summary + recent turns
           -> products = []
           -> citations = {}
        -> product_rag:
           rewrite query dựa trên history
           -> extract metadata filter và sort preference
           -> Qdrant vector search có payload filter nếu extract được filter
           -> nếu query nêu rõ loại sản phẩm: lọc candidate đúng loại
           -> nếu chưa có candidate đúng loại: retry với tối thiểu 100 candidate
           -> boost nhẹ theo yêu cầu giá rẻ, rating cao hoặc nhiều review
           -> giữ chunk có thứ hạng cao nhất của mỗi sản phẩm
           -> Vietnamese_Reranker
           -> lấy tối đa TOP_K document
           -> build citations và product cards từ document đã rerank
           -> LLM chỉ sinh một câu mở đầu tự nhiên
           -> code dựng header + danh sách sản phẩm + footer
     -> tính confidence
     -> lưu user turn và assistant turn vào MongoDB
     -> trả kết quả cho FastAPI

FastAPI response
  -> answer + route + rewrite_question + confidence
  -> citations + sources + products + debug=null

Frontend
  -> render answer dưới dạng text
  -> đọc mảng products riêng trong response
  -> render tối đa 4 product cards từ products[]
  -> mỗi card dùng products[].product_id để tạo link /products/{product_id}
  -> nút "+" dùng products[].product_id để thêm sản phẩm vào giỏ
```

Router chỉ có hai route: `chitchat` và `product_rag`.

### 2.1 Nguồn dữ liệu runtime

Luồng chat không đọc Excel trực tiếp. Dữ liệu đi theo pipeline:

```text
../backend/data/Hasaki_Data_Final.xlsx
  -> backend: npm run seed:products
  -> MongoDB smart_cosmetics_crm.products
  -> RAG: POST /reindex hoặc scripts/build_embeddings.py
  -> Qdrant products_rag
  -> POST /chat thực hiện vector search trên Qdrant
```

MongoDB là nguồn dữ liệu sản phẩm dùng chung giữa backend thương mại và RAG.
Qdrant là index tìm kiếm vector được tạo lại từ MongoDB.
File `data/Hasaki_Data_Final.xlsx` bên trong `RAG_LANGCHAIN_V4` hiện vẫn tồn tại
nhưng không được source runtime tham chiếu.

History được lưu trong `chat_history`. Mỗi lần chat, hệ thống đọc theo cặp
`user_id` + `session_id`, đưa 8 turn gần nhất vào context và cập nhật summary
trong `chat_history_summary` khi session có từ 20 turn.

### 2.2 Fallback runtime

Các lỗi cục bộ được xử lý để luồng chat vẫn trả response:

- Không đọc được history: dùng history rỗng.
- Router lỗi: fallback sang `product_rag` với confidence `0.5`.
- Rewrite lỗi: dùng nguyên query hiện tại.
- Qdrant lỗi hoặc không có kết quả phù hợp: trả thông báo chưa tìm thấy sản phẩm.
- Reranker lỗi hoặc `USE_RERANK=false`: giữ thứ tự vector search đã boost.
- LLM sinh câu mở đầu sản phẩm lỗi hoặc sai format: dùng câu mở đầu mặc định.
- LLM chitchat lỗi: trả thông báo trợ lý đang gián đoạn.
- Không lưu được history: log lỗi nhưng vẫn trả response cho frontend.

Frontend hiện chỉ sử dụng `answer` và `products` để hiển thị. Backend vẫn trả
thêm `route`, `rewrite_question`, `confidence`, `citations`, `sources` và
`debug=null` để debug hoặc mở rộng UI sau này.

## 3. Luồng chitchat

`chitchat` dùng cho chào hỏi, tâm sự và câu ngoài phạm vi sản phẩm. Ví dụ:

```text
nay tôi buồn tôi muốn đi biển
```

Luồng này không gọi Qdrant, không retrieval và không rerank. LLM trả lời tự nhiên, sau đó dẫn nhẹ sang tư vấn chăm sóc hoặc nhóm mỹ phẩm liên quan nhưng không bịa sản phẩm cụ thể.

## 4. Luồng product_rag

`product_rag` dùng cho câu hỏi về tên sản phẩm, loại mỹ phẩm, công dụng, thành phần, thương hiệu, loại da, xuất xứ, giá, rating, cách dùng hoặc nhu cầu chọn sản phẩm.

Ví dụ:

```text
serum dưỡng ẩm
sữa rửa mặt dưới 200k rating cao
CeraVe Foaming Cleanser có tốt không
kem chống nắng đi biển
da dầu mụn nên dùng gì
```

Nếu câu hỏi là follow-up mơ hồ, rewrite query bổ sung ngữ cảnh gần nhất. Nếu câu hiện tại đã nêu loại sản phẩm mới thì code giữ nguyên câu hiện tại trước khi gọi LLM rewrite, không kéo loại cũ hoặc tiêu chí cũ vào.

```text
History: serum
Current: dưỡng ẩm
Rewrite: serum dưỡng ẩm

History: serum
Current: sữa rửa mặt
Rewrite: sữa rửa mặt
```

## 5. Router

Router nằm tại `src/router/semantic_router.py`.

### Static cosmetic keywords

Router nhận diện các nhóm keyword:

- Loại sản phẩm: serum, sữa rửa mặt, kem dưỡng, toner, kem chống nắng, tẩy trang...
- Nhu cầu làm đẹp: dưỡng ẩm, làm sạch, trị mụn, chống nắng, phục hồi, kiềm dầu...
- Thành phần: BHA, AHA, retinol, niacinamide, vitamin C, ceramide...
- Loại da và intent tư vấn: da dầu, da khô, da nhạy cảm kết hợp `nên dùng`, `tư vấn`, `loại nào`...

Các keyword thương mại như `mua`, `giá`, `loại nào` không tự route sang RAG nếu không có ngữ cảnh sản phẩm. Quy tắc này tránh match sai các câu đời sống.

### Dynamic terms từ data

Router nạp term từ MongoDB sau khi seed:

```text
product_name_vn
product_name_en
brand
volume
origin
benefits
product_type
skin_type
```

Không đưa `description`, `ingredients`, `usage_instructions` vào router vì các field này dài và dễ gây false positive. Tên sản phẩm được dùng cho fuzzy match; thương hiệu, loại sản phẩm và công dụng được match trực tiếp.

## 6. RAG Retrieval

### Vector Search bằng Qdrant

Indexer chỉ tạo embedding text từ:

```text
product_name_vn, product_name_en, brand, benefits,
product_type, skin_type, description, ingredients,
usage_instructions, origin, volume, original_price, sale_price,
rating, review_count
```

Trong text đưa vào model embedding, code dùng nhãn tiếng Việt thay cho key kỹ
thuật. Ví dụ: `product_type -> Loại sản phẩm`, `volume -> Dung tích`,
`benefits -> Công dụng`, `ingredients -> Thành phần`. Key metadata lưu trong
Qdrant vẫn giữ nguyên để router và payload filter không đổi.

`qa_count`, `category_level_1`, `category_level_2`, `image_url` không đi vào embedding text.

Model `dangvantuan/vietnamese-embedding` tạo vector 768 chiều và dùng PyVi để tokenize tiếng Việt trước khi encode. Metadata SentenceTransformer của model khai báo 512 token nhưng backbone PhoBERT chỉ có `max_position_embeddings=258`, tương ứng tối đa an toàn 256 token đầu vào. Code cap `max_seq_length=256` khi load model để tránh lỗi runtime. `CHUNK_SIZE` và `CHUNK_OVERLAP` hiện dùng đơn vị ký tự theo `RecursiveCharacterTextSplitter`.

Giữ cấu hình mặc định `CHUNK_SIZE=450` và `CHUNK_OVERLAP=70`. Khi đo trên 6.673 sản phẩm hiện tại sau bước tokenize PyVi, chunk lớn nhất là 242 token và không có chunk nào vượt giới hạn an toàn 256 token. Nếu thay đổi model hoặc các field đưa vào embedding text, cần đo lại và reindex Qdrant.

### Payload filter

`src/rag/query_analysis.py` trích filter khi query có dữ kiện:

```text
brand, benefits, product_type, skin_type, origin,
sale_price, original_price, rating, review_count, volume
```

Ví dụ `CeraVe dưới 300k` tạo filter `brand=CeraVe` và `sale_price<=300000`.

### Sort và boost

Sau vector search, retriever thêm boost nhỏ trong tập candidate:

- `giá rẻ`, `rẻ nhất`: ưu tiên `sale_price` thấp.
- `rating cao`, `đánh giá cao`: ưu tiên `rating` cao.
- `nhiều review`, `nhiều đánh giá`, `bán chạy`: ưu tiên `review_count` cao.

Boost không thay thế relevance score từ Qdrant.

Nếu query nêu rõ loại sản phẩm như `serum`, `sữa rửa mặt` hoặc `kem chống nắng`, retriever lọc lại candidate theo tên và category metadata trước rerank. Nếu không còn candidate đúng loại, API báo chưa tìm thấy dữ liệu phù hợp thay vì tư vấn sản phẩm sai loại.

### Rerank và build context

Trước rerank, hệ thống chỉ giữ chunk có thứ hạng cao nhất của mỗi sản phẩm để chunk trùng không chiếm chỗ tư vấn. `AITeamVN/Vietnamese_Reranker` nhận cặp `[query, document]`, tokenize với `max_length=2304`, sau đó chọn `TOP_K`. Mặc định `TOP_K=4` và API tư vấn 4 sản phẩm khác nhau nếu retrieval có đủ dữ liệu. Nếu `USE_RERANK=false` hoặc model lỗi, hệ thống giữ thứ tự Qdrant đã boost và không làm crash API.

Document sau rerank được dùng để tạo `citations` cùng `products`. Với luồng sản phẩm, LLM chỉ sinh câu mở đầu tiếng Việt tự nhiên bắt đầu bằng `Dạ,`; code dựng header, danh sách sản phẩm và footer từ dữ liệu retrieval để số lượng và nội dung luôn khớp product card.

## 7. Cấu trúc thư mục

```text
../backend/data/Hasaki_Data_Final.xlsx  nguồn sản phẩm duy nhất
../backend/src/scripts/importProducts.js import Excel -> MongoDB dùng chung
scripts/build_embeddings.py       reset và build Qdrant index
src/api/main.py                   FastAPI routes và service container
src/history/chat_history.py       lưu lịch sử chat
src/inference/                    chat flow và rewrite query
src/processing/product_schema.py  schema, searchable text, filter payload
src/rag/                          embedding, indexer, retriever, reranker
src/router/                       router rule-based và dynamic term catalog
tests/                            unit tests và chat flow tests
```

## 8. Biến môi trường

Sao chép `.env.example` thành `.env`, sau đó kiểm tra:

```text
MONGODB_URI                 URL MongoDB
MONGODB_DATABASE            database MongoDB
MONGODB_COLLECTION          collection sản phẩm
QDRANT_URL                  URL Qdrant
QDRANT_COLLECTION           collection vector
QDRANT_ID_STRATEGY          uuid5 để reindex idempotent
LLM_PROVIDER                ollama hoặc gemini
OLLAMA_BASE_URL             URL Ollama
OLLAMA_MODEL                mặc định qwen2.5:3b
GEMINI_MODEL                model Gemini khi dùng provider gemini
GOOGLE_API_KEY              API key Gemini
EMBEDDING_MODEL             model embedding Hugging Face
EMBEDDING_DEVICE            cpu hoặc cuda
RERANK_MODEL                AITeamVN/Vietnamese_Reranker
RERANK_DEVICE               cpu hoặc cuda
USE_RERANK                  true hoặc false
HF_TOKEN                    token Hugging Face nếu cần tăng rate limit
CHUNK_SIZE                  kích thước chunk
CHUNK_OVERLAP               overlap giữa chunk
TOP_N_CANDIDATES            số candidate Qdrant
TOP_K                       số sản phẩm khác nhau sau rerank; tối thiểu 4
MAX_UI_PRODUCTS             số card sản phẩm trả về frontend; tối thiểu 4
```

Không commit token thật vào Git.

## 9. Chạy Docker từng bước

### Bước 1: Tạo file môi trường

Linux/macOS:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

### Bước 2: Chạy MongoDB và backend dùng chung

Từ folder `backend`:

```bash
docker compose up -d --build
docker compose exec backend npm run seed:products
```

Lệnh seed import `../backend/data/Hasaki_Data_Final.xlsx` vào
`smart_cosmetics_crm.products`. RAG không tạo MongoDB riêng.

### Bước 3: Build và chạy RAG

```bash
docker compose up -d --build
```

Chạy lệnh này từ folder `RAG_LANGCHAIN_V4` sau khi Compose của `backend` đã tạo
network `cosmetics_shared_network`. Compose RAG cấp GPU NVIDIA số `0` cho service
`ollama` qua `deploy.resources.reservations.devices`. Ollama tự phát hiện GPU và
tự offload số layer phù hợp với VRAM. Nếu máy không có GPU NVIDIA hoặc Docker GPU
access chưa hoạt động, bỏ block `deploy` của service `ollama` để chạy CPU.
`EMBEDDING_DEVICE` và `RERANK_DEVICE` vẫn có thể cấu hình riêng thành `cuda` nếu cần.

Kiểm tra container Ollama đã nhận GPU:

```bash
docker inspect rag_ollama --format '{{json .HostConfig.DeviceRequests}}'
docker compose exec ollama ollama ps
```

Model Hugging Face được cache trong Docker volume `huggingface_cache`. Lần startup đầu tiên có thể chậm do tải model; các lần recreate container sau sẽ dùng lại cache.

Service `app` tự đợi Ollama sẵn sàng, pull `OLLAMA_MODEL`, rồi load model vào bộ nhớ trước khi chạy Uvicorn. Lệnh preload dùng cùng `OLLAMA_NUM_CTX` với runtime chat để tránh Ollama phải dựng runner khác ở request đầu tiên. Vì vậy không cần chạy lệnh pull Ollama thủ công trong luồng Docker chuẩn.

### Bước 4: Build embeddings và reindex Qdrant

Luôn chạy lại bước này sau khi đổi `EMBEDDING_MODEL`, `CHUNK_SIZE` hoặc `CHUNK_OVERLAP`.

```bash
docker compose exec app uv run python scripts/build_embeddings.py
```

Hoặc gọi API:

```bash
curl -X POST http://localhost:8000/reindex
```

### Bước 6: Health check

```bash
curl http://localhost:8000/health
```

### Bước 7: Test API `/chat`

Linux/macOS:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":"demo_user","session_id":"session_001","query":"kem chống nắng đi biển"}'
```

PowerShell:

```powershell
curl.exe -X POST http://localhost:8000/chat `
  -H "Content-Type: application/json" `
  -d '{"user_id":"demo_user","session_id":"session_001","query":"kem chống nắng đi biển"}'
```

Response gồm:

```text
answer, route, rewrite_question, confidence, citations, products
```

## 10. Chạy local và test

```bash
uv sync --dev
uv run python -m pytest -q
```

Khi chạy local ngoài Docker, sửa `MONGODB_URI`, `QDRANT_URL`, `OLLAMA_BASE_URL` sang `localhost` phù hợp.
