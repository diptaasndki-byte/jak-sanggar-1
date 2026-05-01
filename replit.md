# Jak Sanggar

Aplikasi web Bahasa Indonesia untuk mengelola sanggar kesenian Jakarta secara terpadu — meliputi keanggotaan, latihan, buku kas, pembinaan, dan kurasi sanggar.

## Artefak
- `artifacts/jak-sanggar` — React + Vite, frontend, routing wouter, UI shadcn, ikon lucide-react. Sebagian besar entitas masih persist di `localStorage` (key `jaksanggar_v1`); **auth (login/logout/me) sudah dipindahkan ke API server (Tahap 1)**.
- `artifacts/api-server` — Express 5 + Drizzle ORM. Endpoint: `/api/healthz`, `/api/auth/{login,logout,me}`, `/api/users` CRUD (kurator/admin), `/api/uploads` (multipart). Sesi via cookie HttpOnly `jak_session`. Storage berkas via MinIO/S3 (env `S3_*`) dengan fallback dev `/tmp/jak-uploads/`.
- `lib/db` — Drizzle schema (`users`, `sessions`, `uploads`).
- `lib/api-spec` + `lib/api-zod` + `lib/api-client-react` — kontrak OpenAPI + codegen (Zod schemas + React Query hooks).

## Tahap Migrasi Backend
- **Tahap 1 (selesai):** fondasi — DB schema, auth (bcrypt + cookie), endpoint users + uploads, frontend `useAuth` pakai API.
- **Tahap 2+ (berikutnya):** pindahkan modul lain (sanggar profile, latihan, kas, kurasi, dst.) dari localStorage ke API.
- **Tahap 6:** deploy ke VPS Bizznet — lihat `artifacts/jak-sanggar/deploy/BACKEND.md`.

## Peran Pengguna (7)
1. Kurator (super admin, kredensial tetap `Penguasa jak1` / `ayamayaman`)
2. Admin staff (hak akses dapat di-toggle Kurator)
3. Sanggar (registrasi mandiri)
4. Pelatih (registrasi mandiri, harus diterima Sanggar)
5. Seniman (registrasi mandiri, harus diterima Sanggar)
6. Juri (dibuat Kurator)
7. Sewa Jasa (registrasi mandiri publik — penyewa umum / EO / instansi yang menelusuri katalog jasa sanggar; client-side only, tidak melalui API server)

## Kredensial Demo
- Kurator: `Penguasa jak1` / `ayamayaman`
- Sanggar: `betawi.merah` / `sanggar123`
- Pelatih: `pelatih.iwan` / `pelatih123`
- Seniman: `ayu.tari` / `seniman123`
- Juri: `juri1` / `juri123`
- Admin: `admin1` / `admin123`
- Sewa Jasa: `sewa.demo` / `sewa1234`

## Struktur
- `src/lib/{types,store,auth}.ts(x)` — model data, DB lokal, AuthProvider
- `src/lib/kerjasama.ts` — alur kerjasama antar-sanggar + katalog (sanggar/sdm/aset/sarpras)
- `src/lib/sewa-flow.ts` — alur Pemesanan Sewa Jasa (penyewa eksternal → sanggar → SDM): `createPemesanan`, `terimaPemesanan`, `tolakPemesanan`, `batalkanPemesanan`, `konfirmasiSdm`, `tandaTangan` (auto-promosi ke `kontrak_aktif` ketika semua pihak setuju), `terbitkanInvoice`, `uploadBuktiBayar`, `verifikasiPembayaran`, `finalkanBast`. Item Sanggar/Aset/Sarpras butuh 2 TTD (penyewa+sanggar); item SDM butuh 3 TTD (penyewa+sanggar+SDM).
- `src/components/layout/{AppShell,PageHeader,BackButton}.tsx`
- `src/pages/{auth,sanggar,pelatih,seniman,juri,admin,kurator,sewa,sdm}/`
- `src/App.tsx` — semua route + Guard per peran. Untuk sewa: `/sewa/item/:id` (form pesan), `/sewa/pesanan[/:id]`. Untuk sanggar penyedia: `/sanggar/permintaan-sewa[/:id]`. Untuk SDM yang ditugaskan: `/{pelatih|seniman}/penugasan-sewa[/:id]`.

## Identitas Visual (Redesign Apr 2026)
- Tagline: **"Budaya Naik Kelas, Digital Tanpa Batas."** (tampil di hero login + header dasbor).
- Palet utama: **Navy (#1d2c4f) + Emas (#cf9a36) + Cream (#f6efe3) + Brick-red (destructive)**, dengan tiga mode tema:
  1. `light` — cream + navy + emas (default, cocok cetak)
  2. `dark` — navy gelap + emas hangat
  3. `luxury` — navy paling pekat + glow emas premium (CSS class `.luxury` di-toggle bersama `.dark`)
- Mode tema disimpan di `db.appearance.theme` (fallback ke `dark` boolean lama untuk backward-compat). Tombol cycle ada di header AppShell; picker visual ada di Pengaturan Tampilan Kurator.
- Ornamen Betawi: `src/components/betawi/Ornaments.tsx` — `TumpalSpinner`, `PucukRebungDivider`, `OndelOndelSilhouette`, `GoldDustField`, `BatikCorner`. Watermark batik global via util `betawi-watermark`.
- Utility kunci di `src/index.css`: `glass`, `premium-card` (rounded-2xl + hover lift + gold border), `btn-gold` (gradien emas), `gold-glow`, `tumpal-divider`, `page-enter` (fade-up tiap navigasi), `gold-dust-particle`.
- Komponen `AnimatedCounter` (`src/components/system/AnimatedCounter.tsx`) untuk angka KPI / Saldo / Nilai Akhir Kurasi.
- Login: split layout (3:2) — kiri panel navy dengan tagline emas + ondel silhouette + butiran emas; kanan glass card.
- SanggarHome: hero card navy-emas, saldo besar (animated counter), 4 KPI cards (Saldo Kas accent emas), grafik kas Area, slider berita auto-rotate.
- Kurasi: panel Nilai Akhir tampil sebagai sertifikat-look navy-emas dengan animated counter dan badge predikat.

## Fitur Utama
- Dasbor per peran dengan sidebar navy + active gold-bar dan watermark batik halus.
- Sanggar: profil (edit bebas tanpa batas + field NPWP + unduh PDF terkunci), keanggotaan (3 tab + mutasi/promosi/dismiss-PDF), latihan (kalender + GPS kamera + PDF laporan), buku kas (validasi iuran & honor + ekspor CSV/PDF + bagi hasil job), pembinaan (kartu registrasi pseudo-barcode + absensi 3 slot + sertifikasi), kurasi (3 tahap + sertifikat printable), regenerasi (timeline + ekspor PDF).
- Pelatih: daftar latih, pengajuan honor, e-slip, honor proyek, sertifikat.
- Seniman: tagihan (upload bukti), riwayat, honor komersial, sertifikat.
- Juri: penilaian dengan NA live + final-lock.
- Admin: berita, banner, slider (sesuai izin Kurator).
- Kurator (super-admin): pengelolaan akun (CRUD semua peran termasuk reset sandi & **Login As** / impersonation), Manajemen Data (Buku Kas / Latihan / Kurasi / Pembinaan / Regenerasi sanggar manapun + Recompute Saldo), matriks kurasi (template/inject CSV), penugasan juri, manajemen staff, pengaturan tampilan & jam pembinaan, password ekspor sistem.

## Pasang Aplikasi (PWA + APK)
- PWA installable: `public/manifest.webmanifest` mendaftarkan PNG 192/512 + maskable, service worker `public/sw.js` cache v2. `InstallPwaCard` deteksi `beforeinstallprompt`, fallback Android (Chrome menu) + iOS (Share → Add to Home Screen) lewat modal panduan.
- APK Android (TWA): script `artifacts/jak-sanggar/deploy/build-apk.sh` (Bubblewrap CLI) — Android SDK ~3GB sehingga build harus dilakukan di mesin lokal/VPS, bukan di Replit. Dokumentasi langkah lengkap (JDK17, keystore, `assetlinks.json`, opsi Play Store) di `deploy/APK-BUILD.md`. Tombol "Unduh APK" di `InstallPwaCard` muncul otomatis (HEAD probe) bila `public/JakSanggar.apk` ada.

## Impersonation (Login As)
- State `jaksanggar_impersonation_v1` = `{ originalUserId, impersonatedUserId }` disimpan di localStorage. Setelah `authApi.me()` hidrasi, jika original = kurator dan target masih ada → AuthProvider switch user ke target.
- Banner emas global `ImpersonationBanner` ditampilkan di atas `<main>` dengan tombol "Kembali ke Kurator". Tombol "Login As" tersedia per baris di `KuratorAccounts` dan tombol "Buka sebagai Sanggar Ini" di Manajemen Data. Aktivitas dicatat di `activity` (action `impersonate-start`/`impersonate-stop`).

## Konvensi
- Seluruh teks Bahasa Indonesia, tanpa emoji.
- BackButton tampil di setiap halaman selain dasbor utama.
- Format Rp via `Intl.NumberFormat("id-ID")`.
