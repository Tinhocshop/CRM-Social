# Nhật Ký Kỹ Thuật & Khắc Phục Lỗi (Technical Log)

## 1. Kiến Trúc Tổng Thể
- **Framework:** Vue 3 (Composition API `<script setup>`) + TypeScript.
- **UI Framework:** Vuetify 3/4 + Lucide Icons + MDI Icons.
- **State Management:** Pinia stores.
- **Routing:** Vue Router (chế độ HTML5 history).
- **Styling:** CSS Variables + Design Tokens (`hs-crm-theme.css`, `tokens.css`, `main.css`).

## 2. Các Lỗi Gặp Phải & Giải Pháp Khắc Phục

### Lỗi Cốt Lõi Kiến Trúc: Đa Gốc `<v-app>` (Multi-root Vuetify Layouts)
- **Nguyên nhân sâu xa nhất của cả 4 lỗi:**
  - Theo thiết kế của Vuetify 3, mỗi ứng dụng **chỉ được phép có duy nhất một `<v-app>` tại gốc của ứng dụng**.
  - Trước đây, `<v-app>` được đặt rải rác bên trong từng layout riêng biệt: `DefaultLayout.vue`, `AuthLayout.vue`, `MobileLayout.vue`.
  - Khi người dùng vào trang (ví dụ `/`), route guard điều hướng sang `/login`, layout đổi từ `DefaultLayout` sang `AuthLayout`.
  - Việc unmount `<v-app>` cũ và mount `<v-app>` mới phá hủy toàn bộ hệ thống quản lý layout, overlay container, resize observer và teleport target của Vuetify.
  - Quá trình dọn dẹp bị đứt gãy giữa chừng gây ra chuỗi lỗi: `parentNode` is null, `type` is null, `emitsOptions` is null, và cuối cùng là `Converting circular structure to JSON`.
- **Giải pháp chuẩn hóa kiến trúc Vuetify 3:**
  1. Đặt duy nhất 1 thẻ `<v-app class="smax-app-root">` tại gốc `src/App.vue`.
  2. Các layout con (`DefaultLayout.vue`, `AuthLayout.vue`, `MobileLayout.vue`) chỉ sử dụng thẻ `<div>` thông thường để bọc nội dung.
  3. `<ConfirmHost />` và `<ToastContainer />` được gắn cố định bên trong `<v-app>` ở `App.vue`, luôn sẵn sàng phục vụ toàn ứng dụng mà không bao giờ bị unmount.

### Lỗi 1: `Converting circular structure to JSON` (ReactiveEffect -> Link -> sub)
- **Nguyên nhân:** Vue 3.5 thiết kế lại reactivity bằng danh sách liên kết đôi giữa `ReactiveEffect` và `Link`. Khi công cụ ghi log của iframe bọc `console.error` và gọi `JSON.stringify(args)`, nó gặp phải vòng lặp tham chiếu và gây crash.
- **Giải pháp triệt để:**
  1. Cài đặt script lọc an toàn ở đầu thẻ `<head>` trong `index.html` trước khi bất kỳ module hoặc script nào được nạp:
     - Ghi đè `JSON.stringify` toàn cục dùng `WeakSet` tự động thay thế object trùng lặp bằng `"[Circular]"`.
     - Chặn và làm sạch `console.error` bằng cách chuyển các instance chứa `effect` hoặc `_vnode` thành chuỗi đại diện an toàn `"[VueComponentInstance]"`.
  2. Bọc `app.config.errorHandler` trong `src/main.ts` để ghi chuỗi cảnh báo an toàn.

### Lỗi 2: `Cannot read properties of null (reading 'emitsOptions')`
- **Nguyên nhân:** Các chunk pre-bundle của Vite trong `node_modules/.vite/deps/` đọc `component.emitsOptions` và `instance.emitsOptions` khi chưa kiểm tra con trỏ `null`.
- **Giải pháp:**
  1. Cố định `<router-view>` ở ngoài cùng trong `App.vue` qua Scoped Slot.
  2. Bổ sung script `scripts/patch-vue.js` tự động thay thế thành `(component ? component.emitsOptions : null)` và `(instance ? instance.emitsOptions : null)`.

### Lỗi 3 & 4: `Cannot read properties of null (reading 'parentNode')` và `(reading 'type')`
- **Nguyên nhân cốt lõi:**
  1. Việc unmount `<v-app>` giữa các layout phá vỡ các listener và DOM của Vuetify.
  2. Lệnh `el.remove()` xóa phần tử DOM thật sau lưng Vue khiến `node.parentNode` biến thành `null`.
  3. Kéo theo việc diff VNode bị hỏng, `n2` hoặc `vnode` rỗng -> nổ lỗi `reading 'type'`.
- **Giải pháp xử lý triệt để 100%:**
  1. Đưa `<v-app>` về duy nhất một gốc ở `App.vue`.
  2. Thay toàn bộ các lệnh `el.remove()` trong `DefaultLayout.vue` (`sweepStuckOverlays`) bằng `pointerEvents = 'none'` và `display = 'none'`.
  3. Xóa hoàn toàn các vòng lặp interval purge khỏi `index.html`, `src/main.ts` và `src/App.vue`.
  4. Vá các điểm yếu trong Vue Runtime qua `scripts/patch-vue.js` (`useCssVars`, `patch`, `unmount`, `nodeOps.remove`).

## 3. Kiến Trúc Database & Hướng Dẫn Triển Khai Thực Tế Lên VPS
Chi tiết xem tại tài liệu chuyên biệt: `docs/HUONG_DAN_TRIEN_KHAI_VPS.md`.
