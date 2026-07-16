from langchain_core.documents import Document

from src.inference.inference_engine import InferenceEngine
from src.router.semantic_router import SemanticRouter


class _FakeLLM:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        if "bộ viết lại truy vấn" in system_prompt:
            current = user_prompt.split("Câu hỏi hiện tại:\n", 1)[1].splitlines()[0]
            rewrites = {
                "dưỡng ẩm": "serum dưỡng ẩm",
                "sữa rửa mặt": "sữa rửa mặt",
            }
            return rewrites.get(current, current)
        if "Chỉ viết đúng một câu mở đầu" in system_prompt:
            return "Dạ, shop rất vui được giúp bạn chọn sản phẩm phù hợp."
        return (
            "Shop hiểu hôm nay bạn hơi buồn. Bạn có thể nghỉ ngơi một chút nhé. "
            "Nếu bạn muốn, shop có thể tư vấn nhóm chăm sóc da phù hợp khi đi biển."
        )


def _product_doc(product_id: str, name: str, chunk_index: int = 0) -> Document:
    return Document(
        page_content=f"product_name_vn: {name}",
        metadata={
            "source_id": product_id,
            "chunk_index": chunk_index,
            "score_retrieval": 0.8,
            "raw_document": {
                "_id": product_id,
                "product_name_vn": name,
                "description": f"{name} dưỡng ẩm",
                "sale_price": 200_000,
                "original_price": 250_000,
                "rating": 4.8,
            },
        },
    )


class _FakeRetriever:
    def __init__(self) -> None:
        self.queries: list[str] = []

    def retrieve(self, query: str, catalog=None):
        self.queries.append(query)
        return [
            _product_doc("1", "Serum A"),
            _product_doc("1", "Serum A", chunk_index=1),
            _product_doc("2", "Serum B"),
            _product_doc("3", "Serum C"),
            _product_doc("4", "Serum D"),
            _product_doc("5", "Serum E"),
        ]


class _EmptyRetriever:
    def retrieve(self, query: str, catalog=None):
        return []


class _FailingRetriever:
    def retrieve(self, query: str, catalog=None):
        raise RuntimeError("qdrant timeout")


class _FakeReranker:
    def __init__(self) -> None:
        self.queries: list[str] = []
        self.document_ids: list[list[str]] = []
        self.top_ks: list[int] = []

    def rerank(self, query: str, documents, top_k: int = 3):
        docs = list(documents)
        self.queries.append(query)
        self.document_ids.append([doc.metadata["source_id"] for doc in docs])
        self.top_ks.append(top_k)
        return docs[:top_k]


class _FakeHistory:
    def __init__(self, old_query: str | None = None) -> None:
        self.turns = []
        if old_query:
            self.turns = [
                {"role": "user", "content": old_query},
                {"role": "assistant", "content": f"tư vấn {old_query}"},
            ]

    def get_context(self, user_id: str, session_id: str):
        return {
            "summary": "",
            "recent_turns": list(self.turns),
            "recent_text": "\n".join(f"{turn['role']}: {turn['content']}" for turn in self.turns),
        }

    def append_turn(self, **turn) -> None:
        self.turns.append(turn)


def _build_engine(history_query: str | None = None):
    retriever = _FakeRetriever()
    reranker = _FakeReranker()
    engine = InferenceEngine(
        llm=_FakeLLM(),
        retriever=retriever,
        reranker=reranker,
        router=SemanticRouter(),
        history_store=_FakeHistory(history_query),
        top_k=4,
        max_ui_products=4,
    )
    return engine, retriever, reranker


def test_followup_product_query_calls_qdrant_retrieval_and_reranker() -> None:
    engine, retriever, reranker = _build_engine("serum")
    result = engine.chat("dưỡng ẩm", "u1", "s1")
    assert result["route"] == "product_rag"
    assert result["rewrite_question"] == "serum dưỡng ẩm"
    assert retriever.queries == ["serum dưỡng ẩm"]
    assert reranker.queries == ["serum dưỡng ẩm"]


def test_product_answer_lists_four_distinct_retrieved_products() -> None:
    engine, _, reranker = _build_engine()
    result = engine.chat("serum", "u1", "s1")
    assert result["answer"].startswith("Dạ,")
    assert "Bên shop mình lọc được 4 serum phù hợp với nhu cầu của bạn:" in result["answer"]
    assert "1. Serum A" in result["answer"]
    assert "4. Serum D" in result["answer"]
    assert len(result["products"]) == 4
    assert result["products"][0]["product_url"] == "/products/1"
    assert len(result["citations"]) == 4
    assert reranker.document_ids == [["1", "2", "3", "4", "5"]]
    assert reranker.top_ks == [4]


def test_chitchat_does_not_call_retriever_or_reranker() -> None:
    engine, retriever, reranker = _build_engine("serum")
    result = engine.chat("nay tôi buồn tôi muốn đi biển", "u1", "s1")
    assert result["route"] == "chitchat"
    assert result["rewrite_question"] == "nay tôi buồn tôi muốn đi biển"
    assert "chăm sóc da phù hợp khi đi biển" in result["answer"]
    assert result["products"] == []
    assert retriever.queries == []
    assert reranker.queries == []


def test_new_product_type_is_not_mixed_with_old_context() -> None:
    engine, retriever, reranker = _build_engine("serum")
    result = engine.chat("sữa rửa mặt", "u1", "s1")
    assert result["route"] == "product_rag"
    assert result["rewrite_question"] == "sữa rửa mặt"
    assert "Bên shop mình lọc được 4 sữa rửa mặt phù hợp với nhu cầu của bạn:" in result["answer"]
    assert retriever.queries == ["sữa rửa mặt"]
    assert reranker.queries == ["sữa rửa mặt"]


def test_beach_sunscreen_query_calls_product_flow() -> None:
    engine, retriever, reranker = _build_engine()
    result = engine.chat("kem chống nắng đi biển", "u1", "s1")
    assert result["route"] == "product_rag"
    assert "Bên shop mình lọc được 4 kem chống nắng phù hợp với nhu cầu của bạn:" in result["answer"]
    assert retriever.queries == ["kem chống nắng đi biển"]
    assert reranker.queries == ["kem chống nắng đi biển"]


def test_product_flow_returns_friendly_answer_when_qdrant_is_empty() -> None:
    engine, _, _ = _build_engine()
    engine.retriever = _EmptyRetriever()

    result = engine.chat("serum dưỡng ẩm", "u1", "s1")

    assert result["route"] == "product_rag"
    assert result["products"] == []
    assert result["answer"] == (
        "Hiện tại tôi chưa tìm thấy sản phẩm phù hợp trong dữ liệu. "
        "Bạn có thể mô tả thêm loại da, công dụng hoặc khoảng giá mong muốn."
    )


def test_product_flow_falls_back_when_qdrant_query_fails() -> None:
    engine, _, _ = _build_engine()
    engine.retriever = _FailingRetriever()

    result = engine.chat("serum dưỡng ẩm", "u1", "s1")

    assert result["route"] == "product_rag"
    assert result["products"] == []
    assert "chưa tìm thấy sản phẩm phù hợp" in result["answer"]
