# TÀI LIỆU CHỨC NĂNG + API SMART COSMETICS CRM (backend + frontend_v2)

Cập nhật: 2026-05-23
Phạm vi quét mã nguồn:
- `backend/`
- `frontend_v2/`

## 1) Tổng quan công nghệ

### 1.1 Backend
- Runtime: Node.js (CommonJS), Express 4.
- CSDL: MongoDB + Mongoose.
- Kiến trúc: Clean Architecture theo lớp `presentation` -> `application` -> `infrastructure` -> `domain` -> `shared`.
- Auth & bảo mật: JWT access/refresh token, lưu token qua cookie `httpOnly` (`access_token`/`refresh_token`) cho flow frontend, bcryptjs, Google OAuth, Helmet, CORS whitelist, express-mongo-sanitize, sanitize-html.
- Validation input: Joi DTO schemas.
- Upload ảnh sản phẩm: Multer (`/uploads/products`).
- Thanh toán: PayOS (`@payos/node`) + fallback mock checkout URL khi chưa cấu hình key.
- Messaging/Event: RabbitMQ (`amqplib`) + publisher/consumer.
- Email: Nodemailer (SMTP), nếu thiếu SMTP thì log verify URL để dev test.
- Test: Jest + Supertest.

### 1.2 Frontend
- Framework: Next.js 15 (App Router), React 18, TypeScript.
- Styling: Tailwind CSS + CSS tu viet (`storefront.css`).
- State: Zustand (auth/cart) + localStorage (chỉ lưu thông tin user/cart cache, không lưu access/refresh token).
- Data fetching: Axios client `withCredentials` + interceptor refresh token qua cookie; React Query dùng cho một số block homepage.
- Form/validation: react-hook-form + zod.
- UI libs: sonner (toast), recharts (admin chart), framer-motion, lucide-react.
- Tích hợp ngoài:
  - Google Identity Services (đăng nhập Google popup).
  - Vietmap Autocomplete qua Next API route `/api/address`.
  - AI chatbot qua `NEXT_PUBLIC_AI_CHAT_URL` (mặc định `http://localhost:8000/chat`).

## 2) Backend API đang có thật trong mã nguồn

Base API prefix: `/api/v1`

### 2.1 System/API chung

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| GET | `/health` | No | Health check, trả `status` và `uptime`. |
| Static | `/uploads/*` | No | Serve file upload ảnh sản phẩm. |

### 2.2 Auth API (`/api/v1/auth`)

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| POST | `/register` | No | Đăng ký tài khoản email/password, tạo user `role=customer`, `emailVerified=false`, phát sinh token xác thực email, publish `USER_REGISTERED`. |
| GET | `/verify-email?token=...` | No | Xác thực email bằng token, cập nhật `emailVerified=true`, publish `USER_EMAIL_VERIFIED`. |
| POST | `/resend-verification-email` | No | Gửi lại email xác thực, publish `EMAIL_VERIFICATION_REQUESTED`. |
| POST | `/login` | No | Đăng nhập email/password, chặn user chưa verify hoặc bị block, set cookie `httpOnly` access/refresh token; có merge guest cart nếu có cookie guest. |
| POST | `/google` | No | Đăng nhập Google bằng `idToken`, verify bằng Google OAuth client, tạo/cập nhật user, set cookie auth; có merge guest cart. |
| POST | `/refresh` | No | Đổi access token bằng refresh token (nhận từ body hoặc cookie), check hash refresh token trong DB và set lại cookie auth. |
| POST | `/logout` | Cookie auth hoặc Bearer | Xóa `refreshTokenHash` để vô hiệu refresh token hiện tại và clear auth cookies. |
| POST | `/change-password` | Cookie auth hoặc Bearer | Đổi mật khẩu bằng `currentPassword` + `newPassword`; tự revoke refresh token cũ. |
| GET | `/me` | Cookie auth hoặc Bearer | Lấy profile user hiện tại. |

Input chính:
- `register`: `{ email, password(min 8), name? }`
- `login`: `{ email, password }`
- `refresh`: `{ refreshToken? }` (có thể bỏ trống nếu refresh token đang nằm trong cookie)
- `change-password`: `{ currentPassword, newPassword }` với `newPassword` khác mật khẩu cũ.

Ghi chú auth quan trọng:
- `AuthController` đã loại `tokens` khỏi JSON response login/google/refresh; token chỉ set qua cookie `httpOnly`.
- Middleware `protectRoute/optionalAuth` đọc access token từ `Authorization: Bearer ...` hoặc cookie auth.

### 2.3 Product API (`/api/v1/products`)

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| GET | `/categories` | No | Lấy danh sách category/subcategory/subcategoriesByCategory từ catalog active. |
| GET | `/categories/:category/products` | No | Lọc sản phẩm theo category path param + query filters. |
| GET | `/search` | No | Tìm kiếm sản phẩm (`search`/`q`) + filters/pagination/sort. |
| GET | `/` | No | Danh sách sản phẩm có filter, phân trang, sort. |
| GET | `/:id` | No | Chi tiết sản phẩm (chỉ sản phẩm active). |
| POST | `/` | Admin only | Tạo sản phẩm mới (multipart/form-data, upload ảnh). |
| PATCH | `/:id` | Admin only | Cập nhật sản phẩm (multipart/form-data, upload ảnh). |
| DELETE | `/:id` | Admin only | Soft delete (`isActive=false`), publish event product deleted. |

Phân quyền Product write:
- Middleware `protectRoute` + `requireAdmin`.
- Staff bán hàng không được sửa catalog sản phẩm.

Query filter hỗ trợ:
- `q`, `search`, `category`, `subcategory`, `brand`, `skin_type`
- `minPrice`, `maxPrice`
- `page`, `limit`
- `sort`: `price`, `-price`, `sale_price`, `-sale_price`, `rating`, `-rating`, `createdAt`, `-createdAt`, `soldCount`, `-soldCount`

Ghi chú nghiệp vụ:
- Giá/metadata sản phẩm được normalize (`sale_price`, `original_price`, ảnh...).
- MongoDB lưu category chuẩn dùng chung với RAG: `category_level_1`, `category_level_2`, `benefits`, `product_type`, `ingredients`, `usage_instructions`.
- API public vẫn trả alias `category`, `subcategory`, `categories` để giữ tương thích filter storefront hiện tại; alias không được lưu xuống MongoDB.
- Xóa sản phẩm là soft delete, không xóa document cứng.
- Publish events: `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`.

### 2.4 Cart API (`/api/v1/cart`)

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| GET | `/` | Optional | Lấy cart theo user hoặc guest token cookie. |
| POST | `/items` | Optional | Thêm item vào cart, check tồn kho, lưu snapshot giá/tên/ảnh tại thời điểm thêm. |
| PATCH | `/items/:productId` | Optional | Cập nhật số lượng item trong cart, re-check tồn kho. |
| DELETE | `/items/:productId` | Optional | Xóa item khỏi cart. |
| DELETE | `/clear` | Optional | Xóa toàn bộ item trong cart active. |
| POST | `/merge` | Cookie auth hoặc Bearer | Merge cart guest vào cart user, clamp số lượng theo stock, mark cart guest là `converted`, clear cookie guest. |

Cơ chế owner cart:
- Nếu request có access token hợp lệ (Bearer hoặc cookie auth) -> owner theo `userId`.
- Nếu chưa login -> owner theo cookie `cart_token` (httpOnly, sameSite=lax, secure ở production, TTL theo `GUEST_CART_TTL_DAYS`).
- Guest token lưu trong DB dưới dạng hash (`cartTokenHash`).

Trạng thái cart:
- `active`, `converted`, `abandoned`

### 2.5 Checkout API (`/api/v1/checkout`)

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| GET | `/summary` | Cookie auth hoặc Bearer | Tóm tắt checkout từ cart user: re-check active/stock/giá, tính subtotal/discount/shipping/total, trả payment methods khả dụng. |

Ghi chú nghiệp vụ shipping:
- Nếu tỉnh/thành là TP.HCM -> phí nội thành mặc định thấp hơn.
- Nếu tổng merchandise đạt ngưỡng free shipping -> phí vận chuyển = 0.

### 2.6 Order API (`/api/v1/orders`)

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| POST | `/` | Cookie auth hoặc Bearer | Tạo đơn từ checkout summary. Hỗ trợ `COD` và `PAYOS`. |
| GET | `/my` | Cookie auth hoặc Bearer | Danh sách đơn của user hiện tại. |
| GET | `/:id` | Cookie auth hoặc Bearer | Chi tiết đơn (chỉ owner được xem). |
| PATCH | `/:id/cancel` | Cookie auth hoặc Bearer | Hủy đơn từ phía khách. Không cho hủy đơn đã `PAID`. |

Input `POST /orders`:
- `shippingAddress`: `{ fullName, phone(0xxxxxxxx), province, district, ward, addressLine }`
- `paymentMethod`: `COD` | `PAYOS`
- `note?`, `voucherCode?`

Luồng chính:
- COD: tạo order `UNPAID` + `PENDING_CONFIRMATION`, trừ tồn kho ngay, clear cart, trả `successUrl`.
- PAYOS: tạo order `PENDING` + `PENDING_PAYMENT`, tạo payment link PayOS, chưa clear cart ngay, trả `checkoutUrl`.

### 2.7 Payment API (`/api/v1/payments`)

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| POST | `/payos/create` | Cookie auth hoặc Bearer | Tạo lại payment link PayOS cho đơn chờ thanh toán. |
| POST | `/payos/webhook` | No (verify chữ ký) | Nhận callback PayOS, cập nhật trạng thái thanh toán/đơn hàng. |
| GET | `/payos/return` | No | Xử lý return URL từ PayOS và redirect về frontend `checkout/success` hoặc `checkout/failed`. |
| GET | `/payos/cancel` | No | Xử lý cancel URL từ PayOS, cập nhật trạng thái thất bại/hủy và redirect frontend failed. |

Ghi chú kỹ thuật PayOS:
- Nếu thiếu `PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY`, backend tạo mock checkout URL để dev flow.
- Webhook bắt buộc verify signature trước khi xử lý.

### 2.8 Admin API (`/api/v1/admin`)

Tất cả route `/api/v1/admin/*` bắt buộc đi qua:
- `protectRoute`: user phải đăng nhập.
- `requireAdmin`: user phải có role `admin`.

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| GET | `/products` | Admin only | Danh sách sản phẩm admin (search/filter/pagination, gồm cả sản phẩm inactive). |
| POST | `/products` | Admin only | Tạo sản phẩm mới. |
| PATCH | `/products/:id` | Admin only | Cập nhật sản phẩm. |
| DELETE | `/products/:id` | Admin only | Soft delete sản phẩm (`isActive=false`). |
| GET | `/users` | Admin only | Danh sách tài khoản (search/filter/pagination theo role, trạng thái block). |
| PATCH | `/users/:id/block` | Admin only | Khóa/mở khóa tài khoản theo `isBlocked`. |
| PATCH | `/users/:id/role` | Admin only | Gán role `customer` hoặc `staff` (không cho gán `admin` từ endpoint này). |
| GET | `/vouchers` | Admin only | Danh sách voucher (search/filter/pagination). |
| POST | `/vouchers` | Admin only | Tạo voucher mới. |
| PATCH | `/vouchers/:id` | Admin only | Cập nhật voucher. |
| DELETE | `/vouchers/:id` | Admin only | Vô hiệu hóa voucher (`isActive=false`). |
| GET | `/statistics` | Admin only | Thống kê tổng quan: doanh thu, đơn hàng, khách hàng, sản phẩm, top bán chạy, doanh thu theo tháng. |

### 2.9 Staff API (`/api/v1/staff`)

Tất cả route `/api/v1/staff/*` bắt buộc đi qua:
- `protectRoute`: user phải đăng nhập.
- `requireRole(STAFF)`: chỉ role `staff`, Admin không dùng API Staff.

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| GET | `/overview` | Staff only | Dashboard nhanh số lượng đơn hàng và khách hàng. |
| GET | `/orders` | Staff only | Danh sách đơn hàng, filter và pagination. |
| GET | `/orders/:id` | Staff only | Chi tiết đơn hàng. |
| PATCH | `/orders/:id/confirm` | Staff only | Xác nhận đơn chờ xử lý. |
| PATCH | `/orders/:id/status` | Staff only | Chuyển trạng thái sang giao hàng hoặc hoàn thành. |
| PATCH | `/orders/:id/cancel` | Staff only | Hủy đơn hàng. |
| GET | `/customers` | Staff only | Danh sách khách hàng, filter và pagination. |
| GET | `/customers/:id` | Staff only | Chi tiết khách hàng. |
| GET | `/customers/:id/orders` | Staff only | Lịch sử đơn hàng của khách hàng. |

Các endpoint cũ `/api/v1/admin/orders*` và `/api/v1/admin/customers*` đã ngưng sử dụng và bị xóa khỏi router Admin.

### 2.10 Review API (`/api/v1/reviews`)

| Method | Path | Auth | Chức năng |
|---|---|---|---|
| GET | `/products/:productId` | Public, nhận diện cookie auth nếu có | Danh sách review của sản phẩm và trạng thái user hiện tại có được review hay không. |
| POST | `/products/:productId` | Customer đã đăng nhập | Tạo review verified purchase. Backend chỉ chấp nhận khi customer có đơn `DELIVERED` chứa sản phẩm và chưa review sản phẩm đó trước đây. |

Sau khi tạo review, backend tự tính lại `rating` và `review_count` của sản phẩm. Client không được tự gửi email user để quyết định danh tính người review.

## 3) Chức năng backend không phải REST nhưng đang hoạt động

### 3.1 RabbitMQ events publish
- AUTH: `USER_REGISTERED`, `EMAIL_VERIFICATION_REQUESTED`, `USER_EMAIL_VERIFIED`
- CART: `CART_MERGED`
- ORDER: `ORDER_CREATED`, `ORDER_CANCELLED`
- PAYMENT: `PAYMENT_PENDING`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`
- PRODUCT: `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`

### 3.2 RabbitMQ consumers
- Consumer email xác thực tài khoản (`user.registered`, `email.verification.requested`).
- Các queue còn lại hiện tại log sự kiện để sẵn sàng mở rộng notification/analytics.

## 4) Frontend gọi API như thế nào

### 4.1 API client lõi (`frontend_v2/src/lib/apiClient.ts`)
- Base URL: `API_PREFIX = ${NEXT_PUBLIC_API_URL}/api/v1`.
- `withCredentials: true` để gửi cookie guest cart + auth cookies.
- Không còn tự gắn `Authorization` từ localStorage token.
- Khi gặp `401`, tự gọi `/auth/refresh` (body rỗng, refresh token lấy từ cookie) rồi retry request.
- Nếu refresh fail: clear auth store + localStorage user.

### 4.2 Các service chính mapping với backend

#### Auth service
- `registerUser` -> `POST /auth/register`
- `resendVerificationEmail` -> `POST /auth/resend-verification-email`
- `verifyEmailToken` -> `GET /auth/verify-email`
- `loginUser` -> `POST /auth/login`
- `loginWithGoogle` -> `POST /auth/google`
- `fetchMe` -> `GET /auth/me`
- `logoutUser` -> `POST /auth/logout`
- `changePassword` -> `POST /auth/change-password`
- Sau login/google/fetchMe: frontend set `user` vào Zustand + localStorage.
- Không persist access/refresh token ở localStorage (key `authTokens` đã bị dọn).

#### Product service
- `fetchHomeProducts` -> `GET /products`
- `fetchProducts` -> `GET /products` (filter/pagination/sort)
- `fetchProductById` -> `GET /products/:id`
- `fetchProductCategories` -> `GET /products/categories`
- `createProduct` -> `POST /products`
- `updateProduct` -> `PATCH /products/:id`
- `deleteProduct` -> `DELETE /products/:id`

#### Cart service
- `fetchCart` -> `GET /cart`
- `addCartItem` -> `POST /cart/items`
- `updateCartItemApi` -> `PATCH /cart/items/:productId`
- `removeCartItemApi` -> `DELETE /cart/items/:productId`
- `clearCartApi` -> `DELETE /cart/clear`
- `mergeGuestCartApi` -> `POST /cart/merge`

#### Order/Checkout/Payment service
- `fetchCheckoutSummary` -> `GET /checkout/summary`
- `createOrder` -> `POST /orders`
- `fetchMyOrders` -> `GET /orders/my`
- `fetchOrderById` -> `GET /orders/:id`
- `cancelOrder` -> `PATCH /orders/:id/cancel`
- `createPayOSPaymentLink` -> `POST /payments/payos/create`

#### Admin service
- `fetchAdminStatistics` -> `GET /admin/statistics`
- `fetchAdminProducts` -> `GET /admin/products`
- `createAdminProduct` -> `POST /admin/products`
- `updateAdminProduct` -> `PATCH /admin/products/:id`
- `deleteAdminProduct` -> `DELETE /admin/products/:id`
- `fetchAdminUsers` -> `GET /admin/users`
- `setAdminUserBlocked` -> `PATCH /admin/users/:id/block`
- `assignAdminUserRole` -> `PATCH /admin/users/:id/role`
- `fetchAdminVouchers` -> `GET /admin/vouchers`
- `createAdminVoucher` -> `POST /admin/vouchers`
- `updateAdminVoucher` -> `PATCH /admin/vouchers/:id`
- `deleteAdminVoucher` -> `DELETE /admin/vouchers/:id`

#### Staff service
- `staffService.overview` -> `GET /staff/overview`
- `staffOrderService.list` -> `GET /staff/orders`
- `staffOrderService.detail` -> `GET /staff/orders/:id`
- `staffOrderService.confirm` -> `PATCH /staff/orders/:id/confirm`
- `staffOrderService.updateStatus` -> `PATCH /staff/orders/:id/status`
- `staffOrderService.cancel` -> `PATCH /staff/orders/:id/cancel`
- `staffCustomerService.list` -> `GET /staff/customers`
- `staffCustomerService.detail` -> `GET /staff/customers/:id`
- `staffCustomerService.orders` -> `GET /staff/customers/:id/orders`

### 4.3 API nội bộ Next.js (frontend)

| Method | Path | Chức năng |
|---|---|---|
| GET | `/api/address?q=...` | Route handler phía Next server gọi Vietmap autocomplete (`https://maps.vietmap.vn/api/autocomplete/v4`), normalize + dedupe + rank suggestions địa chỉ. |

### 4.4 API/endpoint ngoài được frontend gọi nhưng backend hiện tại chưa có route tương ứng

| Service | Endpoint đang gọi | Trạng thái so với backend hiện tại |
|---|---|---|
| `blogService` | `GET /api/blogs` | Chưa thấy route trong backend hiện tại. |
| `chatbotService` | `POST ${NEXT_PUBLIC_AI_CHAT_URL}` | Đi sang service AI bên ngoài backend chính (mặc định `http://localhost:8000/chat`). |

## 5) Mapping màn hình frontend -> API chức năng

- Home (`/`): gọi `GET /products` qua `fetchHomeProducts` để render block sản phẩm.
- Products list (`/products`): gọi `GET /products` với filter + phân trang + sort.
- Product detail (`/products/[id]`): gọi `GET /products/:id`, thao tác cart qua `/cart/items`, và đánh giá verified purchase qua `/reviews/products/:productId`.
- Login/Register/Verify email/Change password:
  - `/login`, `/register`, `/verify-email`, `/change-password` gọi nhóm API auth.
  - Sau login/register thành công, frontend trigger refresh cart để badge giỏ hàng cập nhật ngay.
- Cart (`/cart`): gọi đầy đủ API giỏ hàng guest/user.
- Checkout (`/checkout`):
  - Gọi `GET /checkout/summary` (có province để tính shipping).
  - Tạo đơn `POST /orders`.
  - Nếu PayOS thì redirect sang `checkoutUrl` trả về từ backend.
  - Tự gọi `/api/address` để gợi ý địa chỉ.
- Checkout result:
  - `/checkout/success` gọi `GET /orders/:id`.
  - `/checkout/failed` gọi `GET /orders/:id` và có thể gọi `POST /payments/payos/create` để thanh toán lại.
- Orders (`/orders`): gọi `GET /orders/my` và `PATCH /orders/:id/cancel`.
- Admin:
  - `/admin` -> redirect sang `/admin/statistics`.
  - Statistics (`/admin/statistics`) -> `GET /admin/statistics`.
  - Products (`/admin/products`) -> `GET/POST/PATCH/DELETE /admin/products`.
  - Users (`/admin/users`) -> `GET /admin/users`, `PATCH /admin/users/:id/block`, `PATCH /admin/users/:id/role`.
  - Vouchers (`/admin/vouchers`) -> `GET/POST/PATCH/DELETE /admin/vouchers`.
- Staff:
  - Dashboard (`/staff`) -> `GET /staff/overview`.
  - Orders (`/staff/orders`, `/staff/orders/:id`) -> API `/staff/orders*`.
  - Customers (`/staff/customers`, `/staff/customers/:id`) -> API `/staff/customers*`.
- Chatbot page/widget (`/chatbot` + widget global): gọi service AI ngoài qua `NEXT_PUBLIC_AI_CHAT_URL`.

## 6) Kết luận nhanh

- Backend hiện đã có đầy đủ module chính: auth, product, cart (guest + user), checkout, orders, payOS, reviews verified purchase, admin, staff, event messaging.
- Frontend đã tích hợp phần lớn API backend cốt lõi cho luồng mua hàng, module admin (statistics/products/users/vouchers) và khu vực Staff sales riêng.
- Cơ chế auth hiện tại là cookie-based cho frontend (không còn lưu token localStorage), phù hợp hơn cho production security baseline.
- Endpoint nội dung blog động `/api/blogs` vẫn chưa có route trong backend hiện tại.
