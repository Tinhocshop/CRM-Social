# Kế Hoạch Dự Án ZaloCRM Customizer

## 1. Mục Tiêu Dự Án
- Tùy biến và làm chủ hệ thống ZaloCRM trên nền tảng AI Studio.
- Đảm bảo 100% giao diện hiển thị đúng chuẩn, hoạt động ổn định và bảo mật.
- Loại bỏ các thành phần rác, banner bản quyền/quảng bá của hệ thống gốc theo yêu cầu của người dùng.
- Thống nhất font chữ: **Roboto** cho toàn bộ nội dung và **Oswald** cho tiêu đề (cùng kích thước font).
- Chuyển đổi dữ liệu sang mô hình tương tác thực tế (Xem/Thêm/Sửa/Xóa đầy đủ, không hardcode).

---

## 2. Kế Hoạch Giải Quyết Bộ 4 Lỗi Hệ Thống (Root-Cause & Domino Analysis)

Qua rà soát chuyên sâu, hệ thống ghi nhận chuỗi 4 lỗi liên hoàn (hiệu ứng domino) như sau:

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

### Kế hoạch xử lý triệt để 4 bước:
1. **Bước 1 (Xử lý gốc rễ Lỗi 4): Cấm tuyệt đối xóa DOM trực tiếp (`el.remove` / `removeChild`)**
   - Thay toàn bộ các lệnh `el.remove()` trong `DefaultLayout.vue` bằng CSS `pointer-events: none; display: none;`.
   - Xóa bỏ toàn bộ các vòng lặp interval purge khỏi `index.html`, `src/main.ts`, `src/App.vue`.
   - Chỉ sử dụng CSS toàn cục `display: none !important` để ẩn phần tử.

2. **Bước 2 (Xử lý gốc rễ Lỗi 3): Null-Safety trong chu trình Patch & Unmount của Vue**
   - Bổ sung kiểm tra `if (!n2) return;` trong hàm `patch()`.
   - Bổ sung kiểm tra `if (!vnode) return;` trong hàm `unmount()`.
   - Bổ sung kiểm tra `instance.subTree?.el?.parentNode` trong hàm `useCssVars()`.

3. **Bước 3 (Xử lý gốc rễ Lỗi 2): Tái cấu trúc chuẩn Layout Router & Null-Safety cho emitsOptions**
   - Chuyển `App.vue` sang mô hình chuẩn: `<router-view>` nằm cố định ở tầng ngoài cùng, cung cấp scoped slot `Component` và `route` cho dynamic layout. Nhờ đó `<router-view>` không bao giờ bị unmount khi đổi trang.
   - Script `scripts/patch-vue.js` tự động bọc `(component ? component.emitsOptions : null)` và `(instance ? instance.emitsOptions : null)`.

4. **Bước 4 (Xử lý gốc rễ Lỗi 1): Bộ đệm an toàn chống lỗi Circular JSON**
   - Cài đặt script ở dòng đầu tiên của `<head>` trong `index.html`:
     - Bọc `JSON.stringify` bằng `WeakSet` tự động chuyển tham chiếu vòng thành `"[Circular]"`.
     - Lọc `console.error` để biến component instance thành chuỗi an toàn `"[VueComponentInstance]"`.

---

## 3. Kế Hoạch Các Giai Đoạn Tiếp Theo

### Giai đoạn 1: Ổn định nền tảng & Sửa lỗi Runtime (Đã hoàn thành)
- [x] Khắc phục triệt để bộ 4 lỗi hệ thống (`circular structure`, `emitsOptions`, `type`, `parentNode`).
- [x] Khởi tạo tầng `mockAdapter` và `mock-backend` để toàn bộ API hoạt động trơn tru.

### Giai đoạn 2: Tùy biến giao diện & Loại bỏ thành phần hệ thống gốc (Đang thực hiện)
- [x] Gỡ bỏ thanh banner quảng bá tác giả gốc (`.dh-attr` / `useAttribution`) khỏi Dashboard.
- [x] Gỡ bỏ thanh dải tab vai trò (`.at-roletabs`: Việc của tôi / Quản lý team / Quản lý hệ thống) theo selector người dùng chỉ định.
- [x] Cấu hình font chữ: **Roboto** cho văn bản toàn trang và **Oswald** cho toàn bộ tiêu đề.
- [ ] Cho phép người dùng tùy biến tên thương hiệu, logo, slogan trực tiếp từ giao diện cài đặt.

### Giai đoạn 3: Hoàn thiện tính năng CRUD & Lưu trữ dữ liệu
- [ ] Rà soát toàn bộ các module (Tin nhắn, Khách hàng, Lịch hẹn, Nhãn, Tài khoản Zalo) để đảm bảo có đầy đủ chức năng Thêm, Sửa, Xóa.
- [ ] Tách biệt đường dẫn chi tiết cho từng tính năng để tiện chia sẻ URL.
- [ ] Chuẩn hóa lưu trữ vào database/state lâu dài.

### Giai đoạn 4: Đóng gói & Triển khai thực tế trên VPS (Đã lập tài liệu)
- [x] Soạn thảo tài liệu hướng dẫn kỹ thuật triển khai VPS: `docs/HUONG_DAN_TRIEN_KHAI_VPS.md`.
- [x] Khảo sát kiến trúc Database: PostgreSQL 16 + Redis 7 + Nginx + SSL Certbot.
- [ ] Hỗ trợ cấu hình Docker Compose thực tế khi người dùng cấp VPS.
