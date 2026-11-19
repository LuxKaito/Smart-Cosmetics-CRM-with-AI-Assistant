# Frontend rules

Bộ tài liệu này là bản đồ nhanh cho Frontend của dự án. Mã nguồn thực tế nằm trong `frontend_v2/`; tài liệu không thay thế source.

## Tra cứu theo tác vụ

| Tác vụ | Đọc trước |
| --- | --- |
| Xác định framework, thư mục, API/state/style | `PROJECT_STRUCTURE.md` |
| Tìm Header, Category Menu, Mega Menu, banner, Flash Sale, card, footer | `COMPONENT_MAP.md` |
| Tìm route hoặc trang đang render component nào | `PAGE_MAP.md` |
| Chỉnh CSS, Tailwind, responsive, màu, animation | `STYLING_RULES.md` |
| Thêm/sửa component, hook, service hoặc state | `CODING_RULES.md` |
| Quy trình sửa tối thiểu và kiểm tra | `EDITING_RULES.md` |
| Thay đổi đáng kể về cấu trúc/luồng | `CHANGE_LOG.md` |

## Cách dùng

1. Chọn tài liệu liên quan đến yêu cầu; không cần đọc cả bộ mỗi lượt.
2. Dùng đường dẫn trong bản đồ để mở trực tiếp file, sau đó kiểm tra source hiện tại và các quan hệ cha/con liên quan.
3. Nếu bản đồ không còn khớp source, ưu tiên source và cập nhật bản đồ khi cấu trúc, route hoặc quan hệ component thay đổi.

Root `AGENTS.md` nhắc Codex về cách áp dụng các quy tắc này. Tài liệu được giữ ngắn để giảm việc quét lại dự án và tránh lặp thông tin.
