# Backend Jak Sanggar di VPS Bizznet Neo Lite

Dokumen ini melanjutkan `README.md` (yang hanya untuk situs statis). Setelah
Tahap 1 selesai (DB schema, auth, users, uploads), berikut langkah pasang
backend di VPS. **Eksekusi nyata ditunda ke Tahap 6** — file ini cuma peta jalan
supaya jelas apa yang perlu kita siapkan nanti.

## Komponen yang akan dipasang

1. **PostgreSQL 16** — sumber data utama (gantikan localStorage browser).
2. **MinIO** — penyimpanan berkas (foto profil, galeri, dokumen) S3-compatible.
3. **Node.js (API server)** — Express 5 + Drizzle ORM, dijalankan systemd.
4. **Nginx** — reverse-proxy `/api` → backend, sekaligus tetap melayani
   `dist/` situs statis Vite seperti sebelumnya.

---

## 1. Pasang PostgreSQL 16

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql

# Buat database & user
sudo -u postgres psql <<'SQL'
CREATE USER jaksanggar WITH PASSWORD 'GANTI_PASSWORD_KUAT';
CREATE DATABASE jaksanggar OWNER jaksanggar;
GRANT ALL PRIVILEGES ON DATABASE jaksanggar TO jaksanggar;
SQL
```

Catat `DATABASE_URL`:

```
postgres://jaksanggar:GANTI_PASSWORD_KUAT@127.0.0.1:5432/jaksanggar
```

Push skema dari laptop dev (atau langsung di VPS jika repo ter-clone):

```bash
DATABASE_URL=postgres://jaksanggar:...@127.0.0.1:5432/jaksanggar \
  pnpm --filter @workspace/db run push
```

---

## 2. Pasang MinIO

```bash
sudo useradd -r minio-user -s /sbin/nologin
sudo mkdir -p /var/lib/minio /etc/minio
sudo chown -R minio-user:minio-user /var/lib/minio /etc/minio

wget https://dl.min.io/server/minio/release/linux-amd64/minio -O /usr/local/bin/minio
sudo chmod +x /usr/local/bin/minio
```

Buat `/etc/default/minio`:

```
MINIO_ROOT_USER=jaksanggar-admin
MINIO_ROOT_PASSWORD=GANTI_PASSWORD_KUAT_LAGI
MINIO_VOLUMES="/var/lib/minio"
MINIO_OPTS="--address :9000 --console-address :9001"
```

Buat unit systemd `/etc/systemd/system/minio.service`:

```ini
[Unit]
Description=MinIO Object Storage
After=network.target

[Service]
User=minio-user
EnvironmentFile=/etc/default/minio
ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now minio
```

Buka console MinIO di `http://VPS_IP:9001`, login pakai root user, lalu:

1. Buat bucket `jak-sanggar`.
2. Buat access key terbatas (mis. `jak-app`) dengan policy
   `readwrite` ke bucket `jak-sanggar`. Catat access key + secret.

> Sebaiknya MinIO **tidak** terekspos langsung — biarkan Nginx yang reverse-proxy
> ke port 9000 di balik domain misal `storage.jaksanggar.example.com` (TLS
> via Let's Encrypt) atau cukup dipakai internal saja.

---

## 3. Jalankan API server (Node)

Di repo (anggap `~/jak-sanggar`):

```bash
pnpm install --prod=false
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/api-server run build
```

Buat `/etc/jaksanggar-api.env`:

```
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://jaksanggar:...@127.0.0.1:5432/jaksanggar
S3_ENDPOINT=http://127.0.0.1:9000
S3_REGION=us-east-1
S3_BUCKET=jak-sanggar
S3_ACCESS_KEY=jak-app
S3_SECRET_KEY=...
```

Buat `/etc/systemd/system/jaksanggar-api.service`:

```ini
[Unit]
Description=Jak Sanggar API Server
After=network.target postgresql.service minio.service

[Service]
WorkingDirectory=/home/deploy/jak-sanggar/artifacts/api-server
EnvironmentFile=/etc/jaksanggar-api.env
ExecStart=/usr/bin/node --enable-source-maps ./dist/index.mjs
Restart=always
User=deploy

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now jaksanggar-api
sudo systemctl status jaksanggar-api --no-pager
```

Test:

```bash
curl http://127.0.0.1:8080/api/healthz
```

---

## 4. Update Nginx

Tambahkan blok `location /api/` di server block site yang sudah ada
(`nginx-jak-sanggar.conf`):

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Untuk upload berkas (multipart) — ijinkan body besar
    client_max_body_size 12M;

    # Streaming respons (mis. /api/uploads/:id/raw)
    proxy_buffering off;
}
```

Reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Verifikasi

```bash
curl https://jaksanggar.example.com/api/healthz
# {"status":"ok"}

curl -i -X POST https://jaksanggar.example.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"Penguasa jak1","password":"ayamayaman"}'
# 200 + Set-Cookie: jak_session=...; HttpOnly; Secure
```

Pastikan saat di production:

- `NODE_ENV=production` aktif → cookie `Secure` (hanya HTTPS).
- Domain situs & domain API **sama** (sub-path `/api`) supaya cookie sesi
  terkirim otomatis.

---

## Catatan keamanan

- Ganti semua password default sebelum production.
- Aktifkan firewall (`ufw allow 22, 80, 443; deny 5432, 9000, 9001`) supaya
  Postgres & MinIO tidak terekspos.
- Backup berkala: `pg_dump` untuk Postgres, `mc mirror` (MinIO client) untuk
  bucket.
- Rotate `SESSION_SECRET` & demo passwords (lihat
  `artifacts/api-server/src/lib/seed.ts`) setelah deploy pertama.
