# Coding rules

## Component và route

- Dùng TypeScript/React. Component React đặt tên PascalCase và xếp theo miền trong `src/components/{ui,layout,account,admin,staff,orders,editorial,auth}`.
- Route thuộc App Router: thêm/sửa `src/app/<route>/page.tsx`; layout cấp route dùng `layout.tsx`. Trước khi tạo component riêng, xem route và component hiện hữu đã có trách nhiệm đó chưa.
- Component cần state, effect, event handler hoặc browser API phải là client component (`"use client"`) ở ranh giới nhỏ nhất phù hợp. Giữ server component mặc định khi không cần client behavior.
- Props và payload dùng type trong `src/types/` hoặc type cục bộ sát component; không nới kiểu thành `any` để né lỗi.

## State, dữ liệu và API

- State chỉ dùng trong một UI: React state trong component/hook. State auth/cart dùng các Zustand store đã có (`authStore`, `cartStore`).
- Server data/cache: dùng TanStack Query theo convention `AppProviders`; tránh tạo cache/store song song cho cùng dữ liệu.
- Đặt request theo domain trong `src/services/`; sử dụng `src/lib/apiClient.ts` và `src/lib/config.ts` theo luồng hiện hữu. Dùng `SERVER_API_PREFIX` cho server-side request cần URL nội bộ.
- Dữ liệu editorial/trang chủ cố định nằm ở `src/data/`; API response và domain types ở `src/types/`.
- Lỗi API qua `src/lib/errors.ts`; kiểm tra service/type/store liên quan trước khi thay đổi luồng dữ liệu.

## Tổ chức và tái sử dụng

- Tên hook theo `useX` trong `src/hooks/`; service theo domain trong `src/services/`; helper thuần đặt ở `src/lib/` hoặc `src/utils/` theo vai trò.
- Tái sử dụng component có cùng hành vi/contract; không thay `AdminStatCard`, `StatCard`, `StatisticCard` hoặc các component trùng tên gần nhau nếu chưa kiểm tra API và nơi sử dụng.
- Giữ logic nghiệp vụ trong service/store hoặc module miền đang sở hữu; không refactor chéo miền trong yêu cầu giao diện nhỏ.
- Không thêm thư viện, đổi cấu trúc thư mục, hay đổi convention chỉ để hoàn thành một chỉnh sửa cục bộ.
