# Repository guidance

## Frontend changes

- Frontend chính của repository nằm trong `frontend_v2/`.
- Trước khi chỉnh sửa, dùng `docs/frontend-rules/README.md` để chọn đúng tài liệu liên quan. Chỉ đọc tài liệu phù hợp với tác vụ; không bắt buộc mở cả bộ.
- Dùng `PROJECT_STRUCTURE.md`, `COMPONENT_MAP.md` và `PAGE_MAP.md` để định vị route/component. Khi đã biết file, mở trực tiếp file đó và truy vết các phần cha/con liên quan.
- Dùng `STYLING_RULES.md` trước khi đổi style và `EDITING_RULES.md` cho quy trình sửa/kiểm tra.
- Tài liệu là bản đồ tra cứu, không phải nguồn sự thật tuyệt đối. Nếu source và tài liệu khác nhau, tin source; cập nhật bản đồ khi phát hiện route, cấu trúc, component hoặc quan hệ đã thay đổi.
- Tìm kiếm có mục tiêu bằng `rg`; không quét lại toàn dự án khi tác vụ chỉ liên quan một route/component/style.
- Chỉ sửa phạm vi được yêu cầu. Không tự ý refactor nghiệp vụ, đổi cấu trúc, thêm dependency hoặc thay giao diện/chức năng ngoài yêu cầu.
- Kiểm tra component cha/con, CSS, service, hook, store và type liên quan nếu thay đổi có thể ảnh hưởng chúng. Sau đó xem diff và chạy lệnh kiểm tra phù hợp.
- Cập nhật tài liệu khi thêm/xóa/di chuyển/đổi tên route, component hoặc thư mục hay đổi luồng quan trọng. Không ghi log cho thay đổi CSS nhỏ.
