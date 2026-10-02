# Bảng Thống Kê Tiến Độ Dự Án

*Cập nhật lần cuối: 2026-10-02*

| STT | Hạng mục / Tính năng | Mô tả chi tiết | Trạng thái | Ghi chú |
|---|---|---|---|---|
| 1 | Khắc phục triệt để chuỗi 4 lỗi hệ thống | Xử lý `circular structure`, `emitsOptions`, `type`, `parentNode` | ✅ Đã hoàn thành | 26/26 unit test passed |
| 2 | Chuẩn hóa kiến trúc Single `<v-app>` | Đặt 1 `<v-app>` duy nhất tại `App.vue`, chuyển layout thành `<div>` | ✅ Đã hoàn thành | Khắc phục tận gốc lỗi unmount |
| 3 | Mock Backend & Auth Standalone | Tích hợp Axios adapter mô phỏng API Fastify nội bộ, pre-seed session | ✅ Đã hoàn thành | Không còn lỗi 401/404 |
| 4 | Gỡ bỏ banner tác giả gốc | Xóa `.dh-attr`, vô hiệu hóa `useAttribution`, chèn CSS toàn cục | ✅ Đã hoàn thành | Triệt để, an toàn DOM |
| 5 | Gỡ bỏ khối tab vai trò `.at-roletabs` | Xóa thanh nút chọn vai trò theo selector Focus Mode | ✅ Đã hoàn thành | Giao diện gọn gàng |
| 6 | Chuẩn hóa Font chữ toàn hệ thống | Font **Roboto** cho nội dung toàn trang, font **Oswald** cho tiêu đề | ✅ Đã hoàn thành | Nạp Google Fonts |
| 7 | Hướng dẫn triển khai & Update VPS | Soạn thảo chi tiết tài liệu triển khai VPS cho các agent sau này | ✅ Đã hoàn thành | `docs/HUONG_DAN_TRIEN_KHAI_VPS.md` |
| 8 | Tài liệu phân tích bản quyền & Tự chủ | Mổ xẻ bẫy `_ee-stubs`, khóa giả `isExtension`, lộ trình độc lập | ✅ Đã hoàn thành | `docs/PHAN_TICH_BAN_QUYEN_VA_TU_CHU_SAN_PHAM.md` |
| 9 | Làm sạch comment bản quyền cũ | Quét và xóa sạch các comment `SPDX` và Copyright tác giả cũ khỏi `src/` | 🔄 Đang làm | Kế hoạch Bước 1 |
| 10 | Mở khóa Tab Riêng tư & PIN Zalo | Kích hoạt `isExtension = true` để hiện tab Bảo mật nick Zalo | 🔄 Đang làm | Kế hoạch Bước 2 |
| 11 | Tùy biến thương hiệu tổ chức (White-label) | Thay thế nhận diện "HS Holding" thành thương hiệu động của người dùng | 🔄 Đang làm | Cập nhật hồ sơ tổ chức |
| 12 | Module Tin nhắn mẫu nhanh (Chat Templates) | Tự xây dựng popup tạo & gửi kịch bản mẫu thay thế `@ee/automation` | ⏳ Chưa làm | Kế hoạch Bước 3 |
| 13 | Module Bể chứa Lead (Lead Pool) | Tự xây dựng bảng chia lead và nút "Nhận khách" thay thế `@ee/lead-pool` | ⏳ Chưa làm | Kế hoạch Bước 4 |
| 14 | Quản lý dữ liệu thực tế CRUD | Đảm bảo mọi màn hình có đầy đủ thao tác Xem/Thêm/Sửa/Xóa | ⏳ Chưa làm | Kế hoạch tiếp theo |
| 15 | Tách biệt liên kết từng tính năng | Đảm bảo mỗi chức năng có router link độc lập để chia sẻ | ⏳ Chưa làm | Kế hoạch tiếp theo |
