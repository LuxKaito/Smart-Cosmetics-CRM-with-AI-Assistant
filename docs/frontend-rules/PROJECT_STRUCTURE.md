# Cấu trúc Frontend

## Nền tảng

- Frontend riêng ở `frontend_v2/`, dùng Next.js App Router, React 18 và TypeScript strict.
- Route được tạo từ `frontend_v2/src/app/**/page.tsx`; layout lồng nhau dùng `layout.tsx`; API route hiện có là `src/app/api/address/route.ts`.
- Tailwind CSS 3 được cấu hình trong `tailwind.config.ts`. Giao diện đồng thời dùng CSS toàn cục và class CSS truyền thống.
- Các lệnh dự án trong `package.json`: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`. Không có script test khai báo ở đây.

## Sơ đồ source

```text
frontend_v2/
├─ public/                  # Tài nguyên phục vụ trực tiếp: banner, brand, category-icons, img, mascots, logo, workbook
├─ scripts/                 # Tạo JSON review/blog từ workbook trong public/ (ExcelJS được resolve từ backend/node_modules)
├─ src/
│  ├─ app/                  # App Router: trang, layout bảo vệ admin/staff, route handler
│  ├─ components/
│  │  ├─ account/           # Các màn hình tài khoản và AccountLayout
│  │  ├─ admin/             # Khung quản trị, biểu mẫu, bảng, bộ lọc, số liệu
│  │  ├─ auth/              # GoogleSignInButton
│  │  ├─ editorial/         # Bài review/tin tức: card, danh sách, chi tiết, section
│  │  ├─ layout/            # HomePage, Header, Footer, SiteMotion
│  │  ├─ orders/            # Lịch sử/chi tiết đơn, trạng thái và timeline
│  │  ├─ staff/             # Khung nhân viên và thành phần vận hành
│  │  └─ ui/                 # Thành phần storefront dùng chung
│  ├─ data/                 # Dữ liệu tĩnh: trang chủ, nội dung editorial, bộ lọc, JSON
│  ├─ hooks/                # useHomeData, useChatbot
│  ├─ lib/                  # API client, cấu hình URL, lỗi, giá
│  ├─ providers/            # React Query provider, đồng bộ trạng thái auth/cart
│  ├─ services/             # Adapter API theo miền nghiệp vụ
│  ├─ stores/                # Zustand authStore, cartStore
│  ├─ styles/                # CSS toàn site và các lớp style chuyên biệt
│  ├─ types/                 # Kiểu dữ liệu frontend/API
│  └─ utils/                 # Tiện ích user, cart, auth storage
├─ next.config.mjs, tsconfig.json, tailwind.config.ts
├─ Dockerfile, docker-compose.yml
└─ package.json
```

`frontend_v2/img/` cũng có ảnh cục bộ; kiểm tra mục đích và nơi được tham chiếu trước khi dùng. Ảnh hiển thị trên website thường được tham chiếu từ `public/`.

## Luồng dữ liệu và state

- `src/app/layout.tsx` nạp font và CSS toàn cục, rồi bọc trang bằng `AppProviders`, `SiteMotion` và `ChatbotWidget`.
- `AppProviders` cung cấp TanStack Query, `AuthHydrator` và Toaster. `useHomeData` đọc dữ liệu tĩnh; `HomePage` lấy thêm sản phẩm/voucher qua React Query.
- Phần lớn request REST của browser đi qua `src/lib/apiClient.ts` từ các module `src/services/`. Ngoại lệ dùng Axios/fetch trực tiếp: `blogService.ts`, `chatbotService.ts`, server layout admin/staff và luồng địa chỉ.
- `locationService.ts` gọi route nội bộ `/api/address`; `src/app/api/address/route.ts` proxy tới Vietmap. URL public/internal và chatbot nằm trong `src/lib/config.ts`.
- Trạng thái dùng chung auth/cart ở `src/stores/authStore.ts` và `cartStore.ts`. `AuthHydrator` khôi phục trạng thái khi khởi tạo app.
- Layout admin/staff là Server Component, xác thực cookie qua API rồi mới render khung client `AdminLayout`/`StaffLayout`.

## File cấu hình quan trọng

- `src/app/layout.tsx`: font, thứ tự import CSS, provider và thành phần toàn site.
- `src/app/globals.css`: Tailwind directives và biến màu gốc.
- `src/lib/config.ts`: API base URL công khai/nội bộ và URL chatbot.
- `package.json`: dependency và lệnh chạy/build/lint.
- `docker-compose.yml`, `Dockerfile`: build/chạy frontend production bằng Docker.
