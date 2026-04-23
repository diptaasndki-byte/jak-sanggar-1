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

## Fitur Utama
- Dasbor per peran dengan sidebar khas tema (maroon/gold + ornamen batik).
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
