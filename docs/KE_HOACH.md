# Kế Hoạch Dự Án ZaloCRM Customizer

## 1. Mục Tiêu Dự Án
- Tùy biến và làm chủ hệ thống ZaloCRM trên nền tảng AI Studio.
- Đảm bảo 100% giao diện hiển thị đúng chuẩn, hoạt động ổn định và bảo mật.
- Loại bỏ toàn bộ các thành phần rác, banner quảng bá, comment bản quyền của tác giả cũ (`locnguyendata.com`).
- Mở khóa các tính năng bị cố tình giấu (`isExtension = true`) và tự phát triển các module bị rút ruột (`_ee-stubs/`).
- Thống nhất font chữ: **Roboto** cho toàn bộ nội dung và **Oswald** cho tiêu đề (cùng kích thước font).
- Chuyển đổi dữ liệu sang mô hình tương tác thực tế (Xem/Thêm/Sửa/Xóa đầy đủ, không hardcode).
- Tách biệt đường link của từng tính năng để chia sẻ và bookmark dễ dàng.

---

## 2. Kế Hoạch Giải Quyết Bộ 4 Lỗi Hệ Thống (Root-Cause & Domino Analysis)

Hệ thống đã giải quyết dứt điểm chuỗi 4 lỗi liên hoàn (hiệu ứng domino) như sau:

```
[DOM thật bị xóa bằng el.remove()] (sweepStuckOverlays, purge scripts)
                 │
                 ▼
[Lỗi 4: reading 'parentNode' is null] ──> Vue tìm cha để dọn dẹp nhưng node đã bị xóa trước
                 │
                 ▼
[Lỗi 3: reading 'type' is null]       ──> Cây VNode bị đứt gãy, n2/vnode truyền vào patch() bị null
                 │
                 ▼
[Lỗi 2: reading 'emitsOptions' null]  ──> Layout bị unmount giữa chừng lúc Vue Router đang navigate
                 │
                 ▼
[Lỗi 1: Converting circular structure] ──> Vue ném instance chứa ReactiveEffect vào console.error,
                                          logger của iframe AI Studio gọi JSON.stringify và bị crash.
```

### Các bước đã hoàn tất:
1. **Loại bỏ hoàn toàn thao tác xóa DOM trực tiếp (`el.remove`):**
   - Thay toàn bộ bằng CSS `pointer-events: none; display: none;`.
   - Chuẩn hóa Single `<v-app>` tại gốc `src/App.vue`. Các layout con chuyển thành `<div>`.
2. **Vá Null-Safety cho Vue Runtime (`scripts/patch-vue.js`):**
   - Bổ sung kiểm tra `if (!n2) return;` trong `patch()`, `if (!vnode) return;` trong `unmount()`.
   - Kiểm tra an toàn `instance.subTree?.el?.parentNode` trong `useCssVars()`.
3. **Cài đặt Safe Logger ở `<head>` (`index.html`):**
   - Bọc `JSON.stringify` bằng `WeakSet` chống lỗi circular structure.

---

## 3. Kế Hoạch Tự Chủ Sản Phẩm 100% (Chi tiết xem tại `docs/PHAN_TICH_BAN_QUYEN_VA_TU_CHU_SAN_PHAM.md`)

### Giai đoạn 1: Ổn định nền tảng & Sửa lỗi Runtime (✅ Đã hoàn thành)
- [x] Khắc phục triệt để bộ 4 lỗi hệ thống (`circular structure`, `emitsOptions`, `type`, `parentNode`).
- [x] Chuẩn hóa kiến trúc Single `<v-app>` tại `App.vue`.
- [x] Khởi tạo tầng `mockAdapter` và `mock-backend` để toàn bộ API hoạt động trơn tru.

### Giai đoạn 2: Tẩy trắng bản quyền & Mở khóa tính năng (🔄 Đang thực hiện)
- [x] Gỡ bỏ thanh banner quảng bá tác giả gốc (`.dh-attr` / `useAttribution`) khỏi Dashboard.
- [x] Gỡ bỏ thanh dải tab vai trò (`.at-roletabs`: Việc của tôi / Quản lý team / Quản lý hệ thống).
- [x] Cấu hình font chữ: **Roboto** cho văn bản toàn trang và **Oswald** cho toàn bộ tiêu đề.
- [ ] Chạy script làm sạch 100% các header comment `SPDX-License-Identifier` và Copyright tác giả cũ khỏi `src/`.
- [ ] Kích hoạt mở khóa tab **Riêng tư & Mã PIN Nick Zalo** (`isExtension = true`).
- [ ] Cho phép người dùng tùy biến tên thương hiệu, logo, slogan trực tiếp từ giao diện cài đặt.

### Giai đoạn 3: Tự chủ các module bị tác giả cũ rút ruột (`_ee-stubs/`) (⏳ Chưa làm)
- [ ] **Module Kịch bản tin nhắn mẫu (Quick Templates):** Xây dựng popup/panel cho phép sale tạo mẫu tin nhắn (text, ảnh, file) và bấm gửi ngay vào hội thoại, thay thế stub `@ee/automation`.
- [ ] **Module Bể chứa Lead (Lead Pool):** Xây dựng bảng danh sách khách hàng chưa phụ trách và nút "Nhận khách", thay thế stub `@ee/lead-pool`.

### Giai đoạn 4: Hoàn thiện tính năng CRUD & Lưu trữ dữ liệu (⏳ Chưa làm)
- [ ] Rà soát toàn bộ các module (Tin nhắn, Khách hàng, Lịch hẹn, Nhãn, Tài khoản Zalo) để đảm bảo có đầy đủ chức năng Xem - Thêm - Sửa - Xóa.
- [ ] Tách biệt đường dẫn chi tiết cho từng tính năng để tiện chia sẻ URL.
- [ ] Chuẩn hóa lưu trữ vào database/state lâu dài.

### Giai đoạn 5: Đóng gói & Triển khai thực tế trên VPS (✅ Đã lập tài liệu hướng dẫn)
- [x] Soạn thảo tài liệu hướng dẫn kỹ thuật triển khai VPS: `docs/HUONG_DAN_TRIEN_KHAI_VPS.md`.
- [x] Khảo sát kiến trúc Database: PostgreSQL 16 + Redis 7 + Nginx + SSL Certbot.
- [ ] Hỗ trợ cấu hình Docker Compose thực tế khi người dùng cấp VPS.
