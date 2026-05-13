# JAK SANGGAR

Aplikasi administrasi sanggar seni berbasis Node.js + Express.

## Fitur Utama

- Login dan register akun.
- Multi role: admin, operator, kurator, sanggar, user.
- Dashboard ringkasan data.
- Profil Sanggar.
- Generator dokumen:
  - Berita Acara Pembentukan Organisasi;
  - SK Pembentukan Sanggar;
  - Anggaran Dasar;
  - Anggaran Rumah Tangga.
- Kurasi Sanggar.
- Log aktivitas sistem.
- Export database JSON.
- Tampilan web langsung dari `public/index.html`.

## Struktur Folder

```text
server.js              Backend API Express
public/index.html      Tampilan aplikasi web
data/db.json           Database JSON otomatis dibuat saat server berjalan
package.json           Konfigurasi Node.js
```

## Instalasi di VPS

```bash
git clone https://github.com/diptaasndki-byte/jak-sanggar-1.git
cd jak-sanggar-1
npm install
```

## Menjalankan Aplikasi

### Mode biasa

```bash
npm start
```

### Mode produksi dengan PM2

```bash
npm install -g pm2
pm2 start server.js --name jak-sanggar
pm2 save
pm2 startup
```

## Update dari GitHub ke VPS

```bash
cd jak-sanggar-1
git pull
npm install
pm2 restart jak-sanggar
```

## Cek Server

Buka:

```text
http://IP-VPS:3000
```

Health check:

```text
http://IP-VPS:3000/health
```

Jika tampil `status: ok`, server aktif.

## Environment Production

Buat file `.env` atau jalankan environment di PM2:

```bash
PORT=3000
SECRET_KEY=ganti_dengan_kunci_rahasia_panjang
NODE_ENV=production
```

Catatan: versi ini memakai database JSON lokal (`data/db.json`). Untuk produksi besar, selanjutnya dapat dimigrasikan ke MySQL/MariaDB.

## Firewall VPS

```bash
sudo ufw allow 3000
sudo ufw status
```

## Nginx Reverse Proxy Contoh

```nginx
server {
    listen 80;
    server_name domainanda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Alur Penggunaan

1. Buka aplikasi.
2. Register akun admin/operator/sanggar.
3. Login.
4. Isi Profil Sanggar.
5. Buat dokumen AD/ART/SK/Berita Acara.
6. Isi Kurasi.
7. Lihat log aktivitas.
8. Export data bila diperlukan.

## Catatan Keamanan

- Jangan gunakan `SECRET_KEY` default di server produksi.
- Batasi register bebas bila sistem sudah digunakan resmi.
- Backup folder `data/` secara berkala.
