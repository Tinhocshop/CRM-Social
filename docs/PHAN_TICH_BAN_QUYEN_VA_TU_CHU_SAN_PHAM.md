# Bản Phân Tích Bản Quyền, Các Điểm Rút Ruột & Kế Hoạch Tự Chủ Sản Phẩm 100%

> **Tài liệu bắt buộc:** Tất cả các AI Agent tham gia phát triển dự án này PHẢI đọc kỹ tài liệu này trước khi chỉnh sửa mã nguồn hoặc lên kế hoạch tính năng, nhằm đảm bảo không tái phát các bẫy phụ thuộc, không xung đột code và tuân thủ định hướng tự chủ sản phẩm độc quyền cho người dùng.

---

## 1. Bối Cảnh & Mục Tiêu Của Chủ Dự Án
- Dự án ban đầu xuất phát từ mã nguồn ZaloCRM (Vue 3 + Vuetify + TypeScript).
- **Mục tiêu của người dùng:** Loại bỏ toàn bộ dấu vết bản quyền, các bẫy phụ thuộc vào tác giả cũ (`locnguyendata.com` / Nguyễn Tiến Lộc) để phát triển thành **sản phẩm phần mềm độc quyền của riêng công ty**, có thể dùng nội bộ hoặc thương mại hóa (SaaS).
- **Đánh giá tổng quan:** **Khả thi 100%**. Khoảng 95% nghiệp vụ cốt lõi đã nằm trong mã nguồn Frontend này. Không cần đập đi xây lại, chỉ cần mở khóa các phần bị giấu và tự phát triển lại 2 module bị rút ruột.

---

## 2. Bóc Mẽ Các Điểm Cố Tình "Khóa" & "Gài Bán Bản Quyền" Trong Code

Tác giả cũ áp dụng mô hình **Open-Core**: tung ra bản Community Edition (AGPL-3.0) nhưng cắt xén các tính năng kinh doanh cốt lõi thành các file rỗng (stubs) để bán gói riêng gọi là **Enterprise Extension (EE)**.

### 2.1. Thư mục giấu tính năng: `src/_ee-stubs/` (Enterprise Stubs)
Trong mã nguồn, toàn bộ import `@ee/...` được điều hướng về thư mục `src/_ee-stubs/`:
1. **Automation Blocks (`@ee/automation`)**:
   - *File liên quan:*
     - `src/_ee-stubs/automation/chat-blocks/AutomationBlocksPanel.vue` (trả về `<span />`)
     - `src/_ee-stubs/automation/chat-blocks/BlockPickerPopup.vue`
     - `src/_ee-stubs/automation/chat-blocks/BlockPreviewDialog.vue`
     - `src/_ee-stubs/automation/api/blocks.ts` (trả về mảng rỗng `listBlocks() => []`)
   - *Nghiệp vụ thực tế:* Kịch bản tin nhắn mẫu tự động trong khung Chat. Khi telesale chat với khách, có thể bấm chọn kịch bản chào hàng, báo giá, gửi chuỗi ảnh và tài liệu có điều kiện. Tác giả đã rút ruột tính năng này để bán riêng.
2. **Lead Pool - Bể chứa & Phân bổ Lead (`@ee/lead-pool`)**:
   - *File liên quan:* `src/_ee-stubs/lead-pool/components/LeadFloatingButton.vue` (trả về `<span />`).
   - *Nghiệp vụ thực tế:* Bể chứa khách hàng tiềm năng chưa phụ trách. Sale bấm nút "Nhận khách" để claim khách vào danh sách chăm sóc của mình, hoặc hệ thống tự động chia đều theo vòng quay.
3. **Facebook Lead Ads & Timeline thông báo (`@ee/automation/components/`)**:
   - *File liên quan:* `LeadNotifyConfigDrawer.vue`, `LeadNotifyTimeline.vue`.
   - *Nghiệp vụ thực tế:* Tự động hút khách hàng điền form từ quảng cáo Facebook về CRM và lập lịch thông báo cho sale.

### 2.2. Điểm "Khóa Giả": Ẩn tính năng Riêng tư & Mã PIN Nick Zalo
- *Vị trí kiểm tra:* `src/views/ZaloAccountsView.vue` và `src/composables/use-settings-nav.ts`.
- *Mã nguồn tác giả viết:*
  ```ts
  import { isExtension } from '@ee/edition';
  // ...
  const VALID_TABS: TabKey[] = isExtension ? ['manage', 'privacy'] : ['manage'];
  ```
- *Sự thật:* Toàn bộ component của tab **Riêng tư** (`PrivacyNicksTab.vue`, `PrivacyUnlockOtpModal.vue`, `usePrivacyStore`) **ĐÃ CÓ SẴN 100% trong mã nguồn**! Tác giả chỉ đơn giản gán `export const isExtension = false;` trong `src/_ee-stubs/edition.ts` để giấu tab này đi nhằm lừa người dùng rằng tính năng này chỉ có ở bản trả tiền!
- 👉 **Giải pháp cho Agent:** Chuyển `isExtension = true` hoặc xóa bỏ điều kiện chặn, tính năng Bảo mật PIN & Ẩn nick nhạy cảm sẽ hoạt động ngay lập tức.

### 2.3. Bẫy Quảng Cáo Bản Quyền & Backlink
- `src/composables/use-attribution.ts`: Mã hóa Base64 đường link `locnguyendata.com` và số điện thoại, render banner quảng cáo dịch vụ custom phần mềm vào Dashboard. (Đã vô hiệu hóa).
- Các dòng comment `SPDX-License-Identifier: AGPL-3.0-or-later` và `Copyright (C) 2026 Nguyễn Tiến Lộc` ở đầu mọi file code.

---

## 3. Bản Đồ Hiện Trạng: Đã Có Gì & Cần Phát Triển Lại Những Gì

| Nghiệp vụ / Tính năng | Hiện trạng trong Source Code | Đánh giá & Hướng xử lý |
|---|---|---|
| **Chat đa nick Zalo tập trung** | Đã hoàn thiện 100% (`ChatView.vue`, `MessageThread.vue`, `ConversationList.vue`) | Giữ nguyên sử dụng, hoạt động rất tốt. |
| **Quản lý danh bạ khách hàng (Contacts)** | Đã hoàn thiện 100% (`ContactsView.vue`, `CustomerProfileDialog.vue`) | Giữ nguyên sử dụng, có đầy đủ bộ lọc, thẻ tag. |
| **Đồng bộ bạn bè Zalo (Friends)** | Đã hoàn thiện 100% (`FriendsView.vue`) | Giữ nguyên sử dụng. |
| **Quét thành viên nhóm Zalo** | Đã hoàn thiện 100% (`GroupScanView.vue`, `GroupsView.vue`) | Giữ nguyên sử dụng. |
| **Phân quyền người dùng (RBAC)** | Đã hoàn thiện 100% (`UsersRbacView.vue`, `PermissionGroupsView.vue`) | Đã có sẵn 6 vai trò: Admin, Sale, Manager, CSKH,... |
| **Đặt lịch hẹn & Nhắc nhở** | Đã hoàn thiện 100% (`AppointmentsView.vue`, `AppointmentEditor.vue`) | Đầy đủ chức năng. |
| **Báo cáo biểu đồ doanh số & tin nhắn** | Đã hoàn thiện 100% (`AnalyticsView.vue`, `ReportsView.vue`) | Chart.js hoàn chỉnh. |
| **Bảo mật PIN nick Zalo (Privacy)** | **Đã có code 100%** nhưng bị ẩn bởi `isExtension = false` | 👉 **Chỉ cần mở khóa flag `isExtension = true`** là dùng được ngay. |
| **Kịch bản tin nhắn mẫu (Chat Templates)** | Bị tác giả rút ruột thành stub rỗng (`@ee/automation`) | 👉 **Cần phát triển mới:** Xây dựng module Quản lý tin nhắn mẫu (Quick Templates) cho phép sale tạo và gửi nhanh tin nhắn, hình ảnh, file. |
| **Bể chứa khách (Lead Pool)** | Bị tác giả rút ruột thành stub rỗng (`@ee/lead-pool`) | 👉 **Cần phát triển mới:** Xây dựng bảng Lead Pool và nút "Nhận khách" đơn giản cho sale. |
| **Nhận diện thương hiệu (White-label)** | Đang dính cứng tên ZaloCRM / HS Holding | 👉 **Cần phát triển mới:** Xây dựng module cấu hình thương hiệu động (Tên app, logo, slogan, favicon) trong trang Cài đặt. |
| **Comment bản quyền tác giả cũ** | Còn nằm ở đầu các file trong `src/` | 👉 **Cần làm sạch:** Chạy script dọn sạch 100% comment AGPL/Copyright cũ. |

---

## 4. Kiến Trúc Backend & Kết Nối Zalo Thực Tế (Bắt Buộc Khi Triển Khai)

Kho mã nguồn này là **Frontend Single Page Application (Vue 3)**. Để hệ thống chạy thực tế trên máy chủ VPS của công ty anh:
1. **Frontend:** Biên dịch bằng `npm run build` ra thư mục `dist/`, phục vụ bởi Nginx.
2. **Backend API:** Viết bằng Node.js (Fastify hoặc Express/NestJS):
   - Quản lý database: PostgreSQL (lưu tài khoản, liên hệ, tin nhắn, nhãn, lịch hẹn qua Prisma ORM).
   - Quản lý bộ đệm & Realtime: Redis + Socket.IO.
3. **Zalo Gateway (Nói chuyện với Zalo):**
   - **Tùy chọn A (Zalo Cá nhân):** Dùng thư viện giả lập Zalo Web (như `zca-js` hoặc WebSocket client mô phỏng `chat.zalo.me`). Khi đăng nhập, quét mã QR trên điện thoại để lấy cookie/session lưu vào database.
   - **Tùy chọn B (Zalo Doanh nghiệp OA):** Dùng Zalo Open API chính thức của VNG (thông qua Webhook và Access Token).

---

## 5. Quy Tắc Bắt Buộc Dành Cho Các AI Agent Sau Này

1. **Tuyệt đối không can thiệp `el.remove()` vào DOM:** Mọi thao tác ẩn/hiện chỉ dùng CSS `display: none !important` hoặc `pointer-events: none;`. Không tự ý xóa DOM ngoài luồng làm hỏng Virtual DOM của Vue.
2. **Giữ nguyên kiến trúc Single `<v-app>` tại `src/App.vue`:** Không bao giờ đưa `<v-app>` vào trong các Layout con (`DefaultLayout`, `AuthLayout`, `MobileLayout`).
3. **Phát triển tính năng mới dưới dạng module nội bộ của dự án:**
   - Khi thay thế các tính năng stub `@ee`, tạo các component trực tiếp trong `src/components/` (ví dụ `src/components/chat/QuickTemplatesModal.vue`), không nhập khẩu từ `@ee`.
4. **Luôn kiểm tra và cập nhật `docs/`:**
   - Cập nhật tiến độ vào `docs/TIEN_DO.md`.
   - Ghi lại các lỗi và giải pháp kỹ thuật vào `docs/KY_THUAT.md`.
   - Đảm bảo `npm run build` và `vitest run` thành công 100% trước khi kết thúc ca làm việc.
