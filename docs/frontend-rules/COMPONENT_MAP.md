# Component map

Đường dẫn bắt đầu bằng `src/` tính từ `frontend_v2/`; tên ngắn `components/...` trong các bảng cũng tương ứng `frontend_v2/src/components/...`. Trong một ô liệt kê nhiều file, tên sau dấu phẩy thuộc cùng thư mục với file đầu. Route gọi component nào được liệt kê trong `PAGE_MAP.md`.

## Luồng chính

```text
src/app/layout.tsx
├─ AppProviders ─ AuthHydrator, TanStack Query, Toaster
├─ SiteMotion ─ GSAP theo route/viewport và tôn trọng reduced motion
├─ ChatbotWidget ─ widget nổi; tự ẩn ở /admin và /chatbot
└─ page route
   └─ / → HomePage
      ├─ Header → CategorySidebar → MegaMenu (hàm nội bộ trong CategorySidebar.tsx)
      ├─ HeroBanners, CategoryIcons, CouponRow, FlashDeals, HotProductsSection, BestSellerSection, BrandStrip
      ├─ ComprehensiveCareSection → ProductCard; category/subcategory-filtered products from productService
      ├─ SuggestedSection → ProductCard
      ├─ EditorialSection → EditorialCard
      └─ Footer
```

`HomePage` dùng `useHomeData`, `productService` và `voucherService`. `FlashDeals`, `SuggestedSection`, `ProductSection` và trang yêu thích dùng chung `ProductCard` ở các luồng tương ứng. `Header` đọc auth/cart store và chứa dropdown danh mục; không phải mọi route đều dùng storefront Header (admin/staff có header riêng).

## Storefront và layout

| File | Vai trò/quan hệ |
| --- | --- |
| `src/components/layout/HomePage.tsx` | Ghép các section trang chủ; tải sản phẩm và voucher công khai. |
| `src/components/layout/Header.tsx` | Header storefront, tìm kiếm, tài khoản/giỏ hàng và điều hướng; render `CategorySidebar`. |
| `src/components/ui/CategorySidebar.tsx` | Danh mục cha và Mega Menu; `MegaMenu` được định nghĩa nội bộ tại file này. |
| `src/components/layout/Footer.tsx` | Footer storefront. |
| `src/components/layout/SiteMotion.tsx` | Animation GSAP cho nội dung khi cuộn/chuyển route. |
| `src/components/ui/HeroBanners.tsx` | Banner trang chủ. |
| `src/components/ui/CategoryIcons.tsx` | Nhóm lối tắt danh mục dạng icon. |
| `src/components/ui/CouponRow.tsx` | Hàng voucher; nhận voucher qua props và đọc trạng thái auth. |
| `src/components/ui/FlashDeals.tsx` | Carousel sản phẩm; có thể bật/tắt tiêu đề, đồng hồ và biến thể trình bày; dùng `ProductCard`. |
| `src/components/ui/HotProductsSection.tsx` | Section “LUXBERRY CÓ GÌ HOT?”; nhóm sản phẩm theo danh mục từ `HomePage`, phân trang động và dùng `ProductCard` ở chế độ dữ liệu thật. |
| `src/components/ui/BestSellerSection.tsx` | Section “TOP SẢN PHẨM BÁN CHẠY”; lọc sản phẩm theo danh mục, dùng banner chiến dịch và tái sử dụng `ProductCard` với dữ liệu từ `HomePage`. |
| `src/components/ui/ProductCard.tsx` | Thẻ sản phẩm, tiện ích `enrichProducts` và chế độ `realDataOnly` để dùng style chung mà không điền số liệu mẫu. |
| `src/components/ui/ProductSection.tsx` | Khu vực danh sách/lọc sản phẩm; dùng `ProductCard`. |
| `src/components/ui/CartRecommendations.tsx` | Dãy gợi ý cuối trang giỏ hàng; lấy sản phẩm theo danh mục và lượt bán từ `productService`, hiển thị bằng `ProductCard`. |
| `src/components/ui/BrandStrip.tsx` | Trình bày thương hiệu. |
| `src/components/ui/ComprehensiveCareSection.tsx` | Section “CHĂM SÓC TOÀN DIỆN” ngay sau BrandStrip; lọc nhóm danh mục và trang sản phẩm từ `productService`, tái dùng `ProductCard`. |
| `src/components/ui/SuggestedSection.tsx` | Khu vực gợi ý; dùng `ProductCard`. |
| `src/data/hotProductGroups.ts` | Cấu hình nhóm danh mục, đường dẫn “Xem thêm” và đường dẫn banner cho HotProductsSection. |
| `src/components/ui/QuickSection.tsx` | Carousel ngang cho các mục nhanh nhận qua props; hiện không được `HomePage` import. |
| `src/components/ui/NewsSection.tsx` | Section “Bí quyết chăm sóc da” nhận danh sách tin qua props; hiện không được `HomePage` import và link `/news` sẽ redirect. |
| `src/components/ui/TactileButton.tsx` | Nút có hiệu ứng nhấn, dùng Framer Motion. |

## Nội dung editorial, account, auth và order

| Nhóm/file | Vai trò |
| --- | --- |
| `components/editorial/EditorialSection.tsx` | Section review/tin trang chủ; dùng `EditorialCard`. |
| `components/editorial/EditorialListingPage.tsx` | Danh sách bài; dùng `EditorialCard`. |
| `components/editorial/EditorialDetailPage.tsx` | Chi tiết bài. |
| `components/editorial/EditorialCard.tsx` | Thẻ bài editorial. |
| `components/account/AccountLayout.tsx` | Khung tài khoản, điều hướng, kiểm tra phiên; dùng Header/Footer và cart store. |
| `components/account/ProfilePage.tsx` | Thông tin cá nhân. |
| `components/account/AddressBookPage.tsx` | Sổ địa chỉ. |
| `components/account/MyVouchersPage.tsx` | Voucher của tài khoản. |
| `components/account/ChangePasswordPage.tsx` | Đổi mật khẩu. |
| `components/auth/GoogleSignInButton.tsx` | Nút đăng nhập Google. |
| `components/orders/OrderHistoryPage.tsx`, `OrderHistoryList.tsx` | Trang/danh sách lịch sử đơn; danh sách có trạng thái tải. |
| `components/orders/OrderDetailPage.tsx`, `OrderDetail.tsx` | Trang và nội dung chi tiết đơn. |
| `components/orders/OrderStatusBadge.tsx`, `OrderStatusTimeline.tsx` | Hiển thị trạng thái và tiến trình đơn. |
| `components/orders/orderStatus.ts` | Hàm định dạng/trạng thái, timeline và khả năng hủy đơn; không phải React component. |
| `src/app/chatbot/ChatbotWidget.tsx` | Widget chatbot ở chế độ nổi hoặc nhúng trang; chế độ nổi tự ẩn ở `/admin` và `/chatbot`; dùng `useChatbot`, `chatbotService` và cart store. |

## Admin và staff

| Nhóm/file | Vai trò |
| --- | --- |
| `components/admin/AdminLayout.tsx`, `AdminHeader.tsx`, `AdminSidebar.tsx` | Khung quản trị phía client sau khi `src/app/admin/layout.tsx` xác thực quyền. |
| `components/admin/AdminFilterBar.tsx`, `AdminPagination.tsx` | Bộ lọc và phân trang dùng trên màn quản trị/nhân viên. |
| `components/admin/DataTable.tsx` | Bảng dữ liệu generic; `AdminDataTable.tsx` chỉ re-export component/type từ file này. |
| `components/admin/AccountTable.tsx`, `AccountFormDrawer.tsx`, `UserRoleForm.tsx` | Bảng, drawer tài khoản và form vai trò. |
| `components/admin/ProductForm.tsx`, `VoucherForm.tsx` | Form sản phẩm/voucher. |
| `components/admin/ConfirmDialog.tsx`, `StatusBadge.tsx`, `OrderStatusSelect.tsx` | Xác nhận, trạng thái và chọn trạng thái đơn. |
| `components/admin/StatCard.tsx`, `AdminStatCard.tsx`, `StatisticCard.tsx`, `DonutChart.tsx`, `RevenueChart.tsx` | Thẻ số liệu và biểu đồ; các file là component riêng, kiểm tra import trước khi thay thế lẫn nhau. |
| `components/admin/AdminPagination.tsx` và `components/staff/StaffPagination.tsx` | Phân trang theo hai biến thể riêng. |
| `components/staff/StaffLayout.tsx`, `StaffHeader.tsx`, `StaffSidebar.tsx` | Khung nhân viên; route layout xác thực vai trò trước khi render. |
| `components/staff/StaffStatCard.tsx`, `StaffOrderStatusBadge.tsx` | Thẻ số liệu và trạng thái đơn dành cho staff. |

## API, hook, store và dữ liệu liên quan

- Hook: `src/hooks/useHomeData.ts` (dữ liệu tĩnh trang chủ), `useChatbot.ts` (state/luồng chat).
- Store: `src/stores/authStore.ts`, `cartStore.ts` (Zustand).
- Client chung: `src/lib/apiClient.ts`; cấu hình URL: `src/lib/config.ts`; lỗi: `src/lib/errors.ts`; giá: `src/lib/pricing.ts`.
- Service theo miền: `authService`, `productService`, `cartService`, `orderService`, `favoriteService`, `voucherService`, `reviewService`, `blogService`, `locationService`, `chatbotService`, `adminService`, `adminProductService`, `adminOverviewService`, `adminUserService`, `adminVoucherService`, `adminShared`, `staffService`, `staffCustomerService`, `staffOrderService`, `staffShared` trong `src/services/`.
- Phần lớn REST service dùng `apiClient`; `blogService`/`chatbotService` gọi Axios trực tiếp, layout admin/staff dùng server `fetch`, còn `locationService` gọi `/api/address` để route handler proxy Vietmap.
- Dữ liệu tĩnh: `src/data/homeData.ts`, `editorialContent.ts`, `productFilters.ts`, `luxberryBlogs.json`, `luxberryReviews.json`.
