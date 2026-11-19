# Page and route map

Next.js App Router: route tương ứng thư mục dưới `frontend_v2/src/app/`. `[id]` và `[slug]` là dynamic segment. “Inline” nghĩa là UI/logic chính nằm ngay trong `page.tsx`, không phải component độc lập.

## Storefront và nội dung

| Route | File | Điểm vào chính |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | `HomePage` → Header, banner, danh mục, voucher, FlashDeals, HotProductsSection, brand, `ComprehensiveCareSection`, gợi ý, editorial, Footer. |
| `/products` | `src/app/products/page.tsx` | Header/Footer + `ProductSection`; dùng `productFilters` và product types. |
| `/products/[id]` | `src/app/products/[id]/page.tsx` | Chi tiết sản phẩm inline; Header/Footer, `productService`, `cartService`, `pricing`. |
| `/favorites` | `src/app/favorites/page.tsx` | Inline; Header/Footer, `ProductCard`, `favoriteService`, auth store. |
| `/cart` | `src/app/cart/page.tsx` | Giỏ hàng inline; Header/Footer, cart types/store/service liên quan. |
| `/checkout` | `src/app/checkout/page.tsx` | Checkout inline; Header/Footer, cart/auth/order helpers. |
| `/checkout/success` | `src/app/checkout/success/page.tsx` | Kết quả thành công; tra đơn qua `orderService`. |
| `/checkout/failed` | `src/app/checkout/failed/page.tsx` | Trang checkout thất bại inline. |
| `/orders` | `src/app/orders/page.tsx` | Render trực tiếp `OrderHistoryPage`, cùng component với `/account/orders`. |
| `/address` | `src/app/address/page.tsx` | Alias chuyển hướng tới `/account/address`. |
| `/chinh-sach-doi-tra` | `src/app/chinh-sach-doi-tra/page.tsx` | Trang chính sách inline; Header/Footer. |
| `/he-thong-cua-hang` | `src/app/he-thong-cua-hang/page.tsx` | Trang hệ thống cửa hàng inline; Header/Footer. |
| `/chatbot` | `src/app/chatbot/page.tsx` | Header/Footer + `ChatbotWidget` chế độ page; widget nổi từ root layout tự ẩn trên route này. |
| `/news` | `src/app/news/page.tsx` | Alias chuyển hướng tới `/tin-tuc-luxberry`. |
| `/tin-tuc-luxberry` | `src/app/tin-tuc-luxberry/page.tsx` | `EditorialListingPage` với `luxberryNewsArticles`. |
| `/tin-tuc-luxberry/[slug]` | `src/app/tin-tuc-luxberry/[slug]/page.tsx` | `EditorialDetailPage`. |
| `/review-my-pham` | `src/app/review-my-pham/page.tsx` | `EditorialListingPage` với `beautyReviewArticles`. |
| `/review-my-pham/[slug]` | `src/app/review-my-pham/[slug]/page.tsx` | `EditorialDetailPage`. |

## Auth và tài khoản

| Route | File | Điểm vào chính |
| --- | --- | --- |
| `/login` | `src/app/login/page.tsx` | Form inline, `GoogleSignInButton`, auth/cart services và stores. |
| `/register` | `src/app/register/page.tsx` | Form inline, `GoogleSignInButton`, `authService`. |
| `/verify-email` | `src/app/verify-email/page.tsx` | Xác minh email inline, dùng `authService`. |
| `/verify-otp` | `src/app/verify-otp/page.tsx` | Xác minh OTP inline. |
| `/change-password` | `src/app/change-password/page.tsx` | Wrapper `ChangePasswordPage`. |
| `/account` | `src/app/account/page.tsx` | `ProfilePage` trong `AccountLayout`. |
| `/account/address` | `src/app/account/address/page.tsx` | `AddressBookPage` trong luồng account. |
| `/account/change-password` | `src/app/account/change-password/page.tsx` | `ChangePasswordPage` trong luồng account. |
| `/account/orders` | `src/app/account/orders/page.tsx` | `OrderHistoryPage`. |
| `/account/orders/[id]` | `src/app/account/orders/[id]/page.tsx` | `OrderDetailPage`. |
| `/account/vouchers` | `src/app/account/vouchers/page.tsx` | `MyVouchersPage`. |

## Admin và staff

`/admin/layout.tsx` xác thực user/role admin ở server rồi bọc bằng `AdminLayout`; `/staff/layout.tsx` làm tương tự cho staff. Các màn nghiệp vụ dưới đây chủ yếu nằm trực tiếp trong page file.

| Route | File | Điểm vào chính |
| --- | --- | --- |
| `/admin` | `src/app/admin/page.tsx` | Chuyển hướng tới `/admin/overview`; vẫn đi qua layout bảo vệ admin. |
| `/admin/overview` | `src/app/admin/overview/page.tsx` | Inline dashboard; `DonutChart`, `RevenueChart`, `StatCard`, `adminOverviewService`. |
| `/admin/products` | `src/app/admin/products/page.tsx` | Inline; filter, pagination, form, dialog, badge, `adminProductService`. |
| `/admin/users` | `src/app/admin/users/page.tsx` | Inline; account drawer, role form, filter, pagination, dialog, badge. |
| `/admin/vouchers` | `src/app/admin/vouchers/page.tsx` | Inline; voucher form, filter, pagination, dialog, badge, `adminVoucherService`. |
| `/staff` | `src/app/staff/page.tsx` | Inline tổng quan; `StaffStatCard`, `staffService`. |
| `/staff/orders` | `src/app/staff/orders/page.tsx` | Inline; filter, pagination, `OrderStatusSelect`, `staffOrderService`. |
| `/staff/orders/[id]` | `src/app/staff/orders/[id]/page.tsx` | Chi tiết đơn inline; `staffOrderService`, `StaffOrderStatusBadge`. |
| `/staff/customers` | `src/app/staff/customers/page.tsx` | Danh sách khách inline; filter, pagination, status/stat cards. |
| `/staff/customers/[id]` | `src/app/staff/customers/[id]/page.tsx` | Chi tiết khách inline; `staffCustomerService`, `StaffOrderStatusBadge`. |

## Route handler

| URL | File | Ghi chú |
| --- | --- | --- |
| `/api/address` | `src/app/api/address/route.ts` | Route handler Next.js; không phải page UI. |
