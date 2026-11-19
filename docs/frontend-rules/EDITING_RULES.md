# Safe editing workflow

## Trước khi sửa

1. Đọc `README.md`, sau đó chỉ mở `PAGE_MAP.md`, `COMPONENT_MAP.md` hoặc `STYLING_RULES.md` phù hợp với tác vụ.
2. Tìm route/chuỗi hiển thị/class bằng `rg`; mở file đã xác định trực tiếp thay vì quét toàn `frontend_v2`.
3. Kiểm tra component cha/con và đúng service, hook, store, type hoặc CSS đang tác động. Với CSS, kiểm tra `legacy.css` và `palette.css` cùng thứ tự import.
4. Nếu route/component không có trong bản đồ, xác minh source trước; cập nhật bản đồ khi phát hiện cấu trúc đã đổi.

## Chọn điểm bắt đầu

| Yêu cầu | Điểm bắt đầu |
| --- | --- |
| Header, navigation, danh mục, Mega Menu | `components/layout/Header.tsx`, `components/ui/CategorySidebar.tsx`, styles tương ứng |
| Banner, Flash Sale, danh mục nổi bật trang chủ | `components/layout/HomePage.tsx`, component `components/ui/*`, `data/homeData.ts` |
| Danh sách/chi tiết sản phẩm | `app/products/*`, `components/ui/ProductSection.tsx`, `ProductCard.tsx`, `services/productService.ts` |
| Tài khoản/đăng nhập | route tương ứng trong `app/`, `components/account/*`, `components/auth/*`, `services/authService.ts`, auth store |
| Giỏ hàng/checkout/đơn | `app/cart`, `app/checkout`, `components/orders/*`, service/store/type tương ứng |
| Review/tin | `app/review-my-pham`, `app/tin-tuc-luxberry`, `components/editorial/*`, `data/editorialContent.ts` |
| Admin/staff | `app/admin/*` hoặc `app/staff/*`, route `layout.tsx`, component/service cùng domain |
| Chatbot | `app/chatbot/ChatbotWidget.tsx`, `hooks/useChatbot.ts`, `services/chatbotService.ts` |

## Khi sửa và hoàn tất

- Thay đổi nhỏ nhất trong phạm vi yêu cầu; không đổi cấu trúc, nghiệp vụ, giao diện hoặc chức năng lân cận nếu không cần.
- Sau sửa, xem lại diff/file liên quan và kiểm tra lỗi type/lint phù hợp. Các lệnh có sẵn: `npm run lint`, `npm run build` từ `frontend_v2/`. `package.json` chưa khai báo test script.
- Docker frontend dùng image build, không mount source vào container. Sau khi sửa source muốn cập nhật container production: chạy `docker compose build frontend` rồi `docker compose up -d --no-deps frontend` từ `frontend_v2/`.
- Chỉ cập nhật tài liệu khi route, thư mục, component hoặc quan hệ/luồng quan trọng thay đổi; thay đổi màu/font/CSS cục bộ không cần ghi log.
