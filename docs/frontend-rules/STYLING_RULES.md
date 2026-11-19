# Styling rules

## Nguồn style và thứ tự

CSS toàn site được import từ `src/app/layout.tsx` theo thứ tự:

1. `src/app/globals.css` — Tailwind directives, màu gốc và một số style chung.
2. `src/styles/legacy.css` — phần lớn class giao diện hiện hữu; đây là stylesheet lớn, có nhiều quy tắc theo component.
3. `src/styles/motion.css` — motion dùng chung và hỗ trợ `prefers-reduced-motion`.
4. `src/styles/typography.css` — font và quy tắc typography chung.
5. `src/styles/palette.css` — lớp hiệu chỉnh palette/override, được nạp sau `legacy.css`.
6. `src/styles/tactile-button.css` — style bổ sung cho nút tactile.

Khi một style không có hiệu lực, kiểm tra selector specificity và thứ tự import trước khi thêm quy tắc mới. Không đặt selector rộng để sửa riêng một component.

## Tailwind và CSS component

- Tailwind 3 có trong dependency và `tailwind.config.ts`; nhiều trang dùng utility class trực tiếp trong TSX.
- Không có CSS Module/SCSS trong source hiện được khảo sát. Phần lớn style riêng dùng class truyền thống trong `legacy.css` hoặc `palette.css`.
- Giữ class/selector trong phạm vi component, ví dụ `.category-sidebar ...`; tránh sửa toàn cục `a`, `h4`, `ul`, `button` để xử lý một trang.
- Trước khi thêm CSS, tìm class trong TSX và tìm các định nghĩa hiện có trong cả `legacy.css` lẫn `palette.css`.

## Token, font và responsive

- Màu token có ở `globals.css` (`--lux-pink-light`, `--lux-pink-main`, `--lux-white`, `--lux-cream`, `--lux-text`, `--lux-muted`) và `tailwind.config.ts` (`lux.*`). `legacy.css` cũng duy trì các biến cũ như `--bg`, `--primary`, `--surface`.
- Font Next được khai báo tại `src/app/layout.tsx`: Nunito cho nội dung, Vollkorn cho tiêu đề editorial, Barlow Condensed cho campaign. Biến CSS được nối trong `styles/typography.css`.
- Giữ breakpoint và cách responsive của vùng/component lân cận. CSS hiện có breakpoint responsive trong `legacy.css`/`palette.css`; Tailwind utility dùng khi markup cùng convention.
- Animation chung nằm trong `motion.css` và `SiteMotion.tsx`; kiểm tra reduced-motion và tương tác form trước khi thêm animation.

## Quy tắc sửa giao diện

- Chỉ đổi token màu nếu yêu cầu tác động toàn hệ thống; đổi màu một khu vực thì scope theo class khu vực.
- Giữ nguyên cỡ chữ, khoảng cách, bố cục và hover nếu yêu cầu chỉ nói về màu/font.
- Không nhân bản selector override nếu có thể sửa đúng quy tắc hiện hữu. Khi cần override, đặt ở stylesheet đang sở hữu vùng đó và ghi selector đủ hẹp.
