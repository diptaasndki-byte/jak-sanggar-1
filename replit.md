# Jak Sanggar

Aplikasi web Bahasa Indonesia untuk mengelola sanggar kesenian Jakarta secara terpadu — meliputi keanggotaan, latihan, buku kas, pembinaan, dan kurasi sanggar.

## Artefak
- `artifacts/jak-sanggar` — React + Vite, frontend-only, persistensi `localStorage` (key `jaksanggar_v1`), routing wouter, UI shadcn, ikon lucide-react.

## Peran Pengguna (6)
1. Kurator (super admin, kredensial tetap `Penguasa jak1` / `ayamayaman`)
2. Admin staff (hak akses dapat di-toggle Kurator)
3. Sanggar (registrasi mandiri)
4. Pelatih (registrasi mandiri, harus diterima Sanggar)
5. Seniman (registrasi mandiri, harus diterima Sanggar)
6. Juri (dibuat Kurator)

## Kredensial Demo
- Kurator: `Penguasa jak1` / `ayamayaman`
- Sanggar: `betawi.merah` / `sanggar123`
- Pelatih: `pelatih.iwan` / `pelatih123`
- Seniman: `ayu.tari` / `seniman123`
- Juri: `juri1` / `juri123`
- Admin: `admin1` / `admin123`

## Struktur
- `src/lib/{types,store,auth}.ts(x)` — model data, DB lokal, AuthProvider
- `src/components/layout/{AppShell,PageHeader,BackButton}.tsx`
- `src/pages/{auth,sanggar,pelatih,seniman,juri,admin,kurator}/`
- `src/App.tsx` — semua route + Guard per peran

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
- Sanggar: profil (lock edit 2x/bulan), keanggotaan (3 tab + mutasi/promosi/dismiss-PDF), latihan (kalender + GPS kamera + PDF laporan), buku kas (validasi iuran & honor + ekspor CSV/PDF + bagi hasil job), pembinaan (kartu registrasi pseudo-barcode + absensi 3 slot + sertifikasi), kurasi (3 tahap + sertifikat printable), regenerasi (timeline + ekspor PDF).
- Pelatih: daftar latih, pengajuan honor, e-slip, honor proyek, sertifikat.
- Seniman: tagihan (upload bukti), riwayat, honor komersial, sertifikat.
- Juri: penilaian dengan NA live + final-lock.
- Admin: berita, banner, slider (sesuai izin Kurator).
- Kurator: akun, matriks kurasi (template/inject CSV), penugasan juri, manajemen staff, pengaturan tampilan & jam pembinaan, password ekspor sistem.

## Konvensi
- Seluruh teks Bahasa Indonesia, tanpa emoji.
- BackButton tampil di setiap halaman selain dasbor utama.
- Format Rp via `Intl.NumberFormat("id-ID")`.
