# Hướng Dẫn Chi Tiết Triển Khai & Cập Nhật Lên VPS (Dành Cho Agent & Kỹ Sư)

Tài liệu này được lập ra để bất kỳ Agent hay Lập trình viên nào tiếp nhận dự án đều có thể nắm bắt kiến trúc và thực hiện triển khai/cập nhật hệ thống lên máy chủ VPS thực tế một cách nhanh chóng, chính xác và bảo mật.

---

## 1. Sơ Đồ Kiến Trúc Hệ Thống (Production Architecture)

```
[Người dùng truy cập Browser] ──(HTTPS - Cổng 443 / Tên miền: crm.yourdomain.com)──┐
                                                                                    │
                                                                                    ▼
                                                                        ┌──────────────────────┐
                                                                        │  Nginx Reverse Proxy │
                                                                        └──────────┬───────────┘
                                       ┌───────────────────────────────────────────┴───────────────────────────────────────────┐
                                       ▼                                                                                       ▼
                        ┌───────────────────────────────┐                                                       ┌───────────────────────────────┐
                        │   Static Files (Frontend)     │                                                       │   Backend API & WebSocket     │
                        │   Đường dẫn: /var/www/crm/dist│                                                       │   Node.js (Cổng 4000)         │
                        └───────────────────────────────┘                                                       └──────────────┬────────────────┘
                                                                                                                               │
                                                                                       ┌───────────────────────────────────────┴───────────────────────────────────────┐
                                                                                       ▼                                                                               ▼
                                                                        ┌───────────────────────────────┐                                               ┌───────────────────────────────┐
                                                                        │  PostgreSQL (Cơ sở dữ liệu)   │                                               │  Redis (Cache & Socket queue) │
                                                                        │  Cổng: 5432                   │                                               │  Cổng: 6379                   │
                                                                        └───────────────────────────────┘                                               └───────────────────────────────┘
```

---

## 2. Chuẩn Bị Máy Chủ VPS

* **Hệ điều hành khuyến nghị:** Ubuntu 22.04 LTS hoặc 24.04 LTS (x86_64).
* **Cấu hình tối thiểu:** 2 vCPU, 4GB RAM, 40GB+ NVMe SSD.
* **Các cổng cần mở (Firewall UFW):**
  * `22/tcp`: SSH truy cập từ xa.
  * `80/tcp`: HTTP (chuyển hướng sang HTTPS).
  * `443/tcp`: HTTPS (kết nối bảo mật).

### Lệnh cài đặt ban đầu trên VPS:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw nginx certbot python3-certbot-nginx docker.io docker-compose

# Cấu hình tường lửa
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

---

## 3. Khởi Chạy Database & Cache Bằng Docker Compose

Trên VPS, tạo thư mục quản lý: `/opt/zalocrm`
Tạo file `/opt/zalocrm/docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: zalocrm_postgres
    restart: always
    environment:
      POSTGRES_DB: zalocrm
      POSTGRES_USER: zalocrm_admin
      POSTGRES_PASSWORD: ChangeThisSecurePassword2026!
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432" # Chỉ lắng nghe nội bộ, không mở ra ngoài internet

  redis:
    image: redis:7-alpine
    container_name: zalocrm_redis
    restart: always
    command: redis-server --requirepass ChangeThisRedisPassword2026!
    volumes:
      - ./data/redis:/data
    ports:
      - "127.0.0.1:6379:6379" # Chỉ lắng nghe nội bộ

volumes:
  postgres_data:
  redis_data:
```

Khởi chạy container:
```bash
cd /opt/zalocrm
sudo docker-compose up -d
```

---

## 4. Quy Trình Đóng Gói & Cập Nhật Frontend (Mã Nguồn Này)

### 4.1. Đóng gói bản build:
1. Đảm bảo toàn bộ mã nguồn sạch, các font chữ đã được tối ưu:
   * Body Text: **Roboto**
   * Tiêu đề (Headings): **Oswald**
2. Chạy lệnh build:
   ```bash
   npm install
   npm run build
   ```
3. Sau khi build thành công, toàn bộ tài nguyên tĩnh nằm trong thư mục **`dist/`**.

### 4.2. Đưa lên VPS:
* Sao chép toàn bộ thư mục `dist/` vào thư mục web trên VPS:
  ```bash
  sudo mkdir -p /var/www/zalocrm
  sudo cp -r dist /var/www/zalocrm/
  sudo chown -R www-data:www-data /var/www/zalocrm
  sudo chmod -R 755 /var/www/zalocrm
  ```

---

## 5. Cấu Hình Nginx Reverse Proxy & SSL

Tạo file cấu hình tại `/etc/nginx/sites-available/zalocrm.conf`:

```nginx
server {
    listen 80;
    server_name crm.yourdomain.com; # Thay bằng domain thực tế

    # Đường dẫn thư mục Frontend đã build
    root /var/www/zalocrm/dist;
    index index.html;

    # Tối ưu hóa file tĩnh
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2|woff|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # SPA Routing: tất cả route chuyển về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy chuyển tiếp tới Backend Fastify/Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Proxy cho Realtime Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Kích hoạt site và nạp lại Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/zalocrm.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Cấp chứng chỉ SSL HTTPS miễn phí tự động:
```bash
sudo certbot --nginx -d crm.yourdomain.com
```

---

## 6. Quy Trình Cập Nhật (Update Workflow Cho Agent Tương Lai)

Khi có bản cập nhật code mới, Agent hoặc Lập trình viên chỉ cần chạy quy trình 3 bước:

```bash
# Bước 1: Kéo code mới và cài đặt dependency (nếu có)
git pull origin main
npm install

# Bước 2: Kiểm tra lỗi và Build Frontend
npm test
npm run build

# Bước 3: Triển khai sang thư mục Nginx
sudo rsync -av --delete dist/ /var/www/zalocrm/dist/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7. Các Điểm Kỹ Thuật Cần Lưu Ý (Security & Performance)

1. **Bảo mật cơ sở dữ liệu:** Không bao giờ mở cổng PostgreSQL (5432) và Redis (6379) ra ngoài internet (`0.0.0.0`). Luôn bind về `127.0.0.1`.
2. **Không commit bí mật:** Không commit file `.env` chứa mật khẩu database, token Zalo, secret key lên kho mã nguồn công khai.
3. **Backup định kỳ:** Thiết lập cronjob tự động chạy `pg_dump` mỗi đêm lúc 2h sáng:
   ```bash
   0 2 * * * docker exec zalocrm_postgres pg_dump -U zalocrm_admin zalocrm | gzip > /opt/zalocrm/backups/db_$(date +\%Y\%m\%d).sql.gz
   ```
4. **Font chữ & Thương hiệu:** Dự án đã chuẩn hóa font **Roboto** cho toàn trang và **Oswald** cho tiêu đề, đồng thời gỡ bỏ toàn bộ attribution banner cũ. Khi đóng gói bản build mới, luôn kiểm tra `dist/index.html` đảm bảo cấu hình font được nạp đầy đủ.
