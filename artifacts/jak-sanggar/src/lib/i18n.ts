import { useDb } from "./auth";
import type { Language } from "./types";

type Dict = Record<string, string>;

const ID: Dict = {};

// Bahasa Betawi — Nyablak & Canggih (sesuai brief Jak Sanggar):
// ramah, sopan, tapi blak-blakan dan modern. Kosakata khas:
// "Masuk Nyok" (login), "Cabut/Pamit" (logout), "Sedot" (download),
// "Jepret" (capture), "Catet" (save), "Sat-set" (cepet),
// "Markas Besar" (dashboard), "Lobby" (home/beranda),
// "Pasukan Kite" (members), "Singgasana" (admin panel).
// Panggilan: Abang, Mpok, Anak Sanggar, Pasukan.
const BTW: Dict = {
  // Navigasi inti
  "Beranda": "Lobby",
  "Pengaturan": "Atur-Atur",
  "Pengaturan Tampilan": "Atur Tampilan",
  "Tampilan": "Tampilan",
  "Profil Saya": "Profil Aye",
  "Keluar": "Pamit",
  "Notifikasi": "Kabar",

  // Aksi umum (vocab khas Jak Sanggar)
  "Simpan": "Catet",
  "Simpan Semua": "Catet Semuanye",
  "Simpan Identitas": "Catet Identitas",
  "Simpan Backdrop": "Catet Backdrop",
  "Simpan Bahasa": "Catet Bahasa",
  "Simpan Tema Kustom": "Catet Tema Racikan",
  "Simpan Studio": "Catet Studio",
  "Batal": "Batalin",
  "Batalkan": "Batalin Aje",
  "Hapus": "Buang",
  "Hapus Logo": "Buang Logo",
  "Tambah": "Tambahin",
  "Reset": "Balikin",
  "Kembalikan Default": "Balikin ke Awal",
  "Kembalikan Bawaan": "Balikin ke Awal",
  "Pilih": "Pilih",
  "Unggah": "Sedot Masuk",

  // Tab Tampilan
  "Brand & Logo": "Brand & Logo",
  "Tema & Warna": "Tema & Warna",
  "Backdrop": "Backdrop",
  "Pop-up Tradisi": "Pop-up Tradisi",
  "Bahasa": "Bahasa",
  "Studio Lanjutan": "Studio Pro",
  "Mode Tampilan": "Mode Tampilan",
  "Aksen Warna": "Warna Aksen",
  "Tema Kustom Anda": "Tema Racikan Aye",

  // Pilihan bahasa
  "Pilih Bahasa Antarmuka": "Pilih Bahasa Tampilan",
  "Bahasa Indonesia": "Bahasa Indonesia",
  "Bahasa Betawi": "Bahasa Betawi",
  "Indonesia": "Indonesia",
  "Betawi": "Betawi",

  // Login (vocab khas: Masuk Nyok!)
  "Selamat Datang Kembali": "Balik Lagi, Pasukan!",
  "Masuk Aman": "Masuk Nyok",
  "Masuk Akun": "Masuk Nyok",
  "Memverifikasi...": "Lagi diperiksa, sat-set...",
  "Username / Email": "Username / Email",
  "Password": "Sandi",
  "Lupa Password?": "Lupa Sandi?",
  "Daftar Akun": "Daftar Akun",
  "Akun Demo": "Akun Cobaan",
  "Gunakan kredensial yang terdaftar untuk melanjutkan.": "Pake username sama sandi yang udah kedaftar buat masuk, ye.",
  "Gagal masuk": "Belom Bisa Masuk",
  "Username atau password tidak cocok.": "Username sama sandinye kage cocok, coba lagi, Bang.",
  "Sembunyikan password": "Sembunyiin sandi",
  "Tampilkan password": "Tampilin sandi",

  // Roles
  "Kurator": "Kurator",
  "Admin": "Singgasana",
  "Sanggar": "Sanggar",
  "Pelatih": "Pelatih",
  "Seniman": "Seniman",
  "Juri": "Juri",

  // Toast & status
  "Edisi Premium": "Edisi Sultan",
  "Tagline Resmi": "Slogan Resmi",
  "Bahasa berhasil diganti": "Bahasanye dah keganti",
  "Tema kustom diterapkan": "Tema racikan dah dipake",
  "Tema diperbarui": "Tema dah diperbarui, sat-set",
  "Studio diperbarui": "Studio dah diperbarui, sat-set",
  "Studio dikembalikan ke bawaan": "Studio dah dibalikin ke awal",
  "Gambar siap. Tekan Simpan untuk menerapkan.": "Gambarnye dah siap. Tinggal pencet Catet, beres.",
  "Gagal memuat gambar": "Gambarnye kage kebuka",
  "Gagal menyimpan": "Belom kecatet",

  // Studio Pro — istilah teknis tetep, kalimat panjang dapet logat
  "Tipografi": "Tipografi",
  "Pilih jenis huruf untuk judul dan teks isi, serta atur skala teks global.": "Pilih jenis huruf buat judul sama isi tulisan, terus atur ukurannye sekalian.",
  "Font Judul": "Font Judul",
  "Font Isi": "Font Isi",
  "Bawaan": "Asli",
  "Skala Teks": "Ukuran Tulisan",
  "Berlaku ke seluruh aplikasi.": "Berlaku ke semua tampilan, Pasukan.",
  "Permukaan & Sudut": "Permukaan & Sudut",
  "Atur warna halaman, kartu, garis batas, serta tingkat kelengkungan sudut.": "Atur warna halaman, kartu, garis, sama tingkat lengkungan sudutnye.",
  "Warna Halaman": "Warna Halaman",
  "Warna Teks": "Warna Tulisan",
  "Warna Kartu": "Warna Kartu",
  "Warna Garis": "Warna Garis",
  "Sudut": "Lengkungan",
  "Sidebar": "Sidebar",
  "Ganti warna, atau unggah gambar latar untuk sidebar navigasi.": "Tuker warna, atau sedot gambar latar buat sidebar navigasi.",
  "Warna Sidebar": "Warna Sidebar",
  "Warna Teks Sidebar": "Warna Tulisan Sidebar",
  "Gambar Latar Sidebar": "Gambar Latar Sidebar",
  "Opasitas Gambar": "Tebel-Tipisnye Gambar",
  "Halaman Masuk": "Halaman Masuk",
  "Ganti gambar dan warna lapisan panel kiri halaman masuk.": "Tuker gambar sama warna lapisan di panel kiri halaman masuk.",
  "Gambar Hero": "Gambar Utama",
  "Warna Lapisan": "Warna Lapisan",
  "Opasitas Lapisan": "Tebel-Tipisnye Lapisan",

  // PWA / Pasang aplikasi
  "Versi Android": "Versi Android",
  "Pasang Jak Sanggar di HP": "Pasang Jak Sanggar di HP",
  "Tap tombol di bawah, izinin pasang. App-nya bakal nongol di layar utama HP, bisa dibuka offline.":
    "Pencet tombolnye, izinin pasang. App-nye nongol di layar utama HP, bisa dibuka tanpa internet.",
  "Buka di Safari → tombol Bagikan → 'Tambahkan ke Layar Utama'.":
    "Buka di Safari → pencet tombol Bagikan → pilih 'Tambahkan ke Layar Utama'.",
  "Buka link ini di Chrome Android atau Safari iPhone biar bisa dipasang sebagai aplikasi.":
    "Buka link ini di Chrome Android atau Safari iPhone biar bisa dipasang sebagai aplikasi, Bang/Mpok.",
  "Pasang Sekarang": "Pasang Sat-Set",
  "Cara Pasang di iPhone": "Cara Pasang di iPhone",
  "Pasang Aplikasi": "Pasang Aplikasi",
  "(Pakai Chrome Android biar tombolnya aktif)": "(Pake Chrome Android biar tombolnye nyala)",
  "Aplikasi terpasang": "Aplikasi udah kepasang!",
  "Buka dari layar utama HP Abang/Mpok, sat-set!": "Buka dari layar utama HP Abang/Mpok, sat-set!",
  "Mantap!": "Mantap, Bang!",
  "Aplikasi lagi dipasang ke HP Abang/Mpok...": "Aplikasi lagi dipasang ke HP Abang/Mpok, sabar bentar...",
  "Belum bisa dipasang otomatis": "Belum bisa dipasang otomatis",
  "Buka di Chrome Android, terus tap menu titik tiga → 'Pasang aplikasi'.":
    "Buka di Chrome Android, terus pencet menu titik tiga → 'Pasang aplikasi'.",
  "Aplikasi sudah terpasang di perangkat ini": "Aplikasinye udah kepasang di perangkat ini",
  "Pasang di iPhone": "Pasang di iPhone",
  "Tiga langkah aja, Bang/Mpok": "Tiga langkah aje, Bang/Mpok",
  "Buka halaman ini di browser Safari (bukan Chrome).": "Buka halaman ini di browser Safari (bukan Chrome).",
  "Tap ikon": "Pencet ikon",
  "Bagikan di bawah layar.": "Bagikan di bawah layar.",
  "Tambahkan ke Layar Utama": "Tambahkan ke Layar Utama",
  "Tutup": "Tutup",
};

const PACKS: Record<Language, Dict> = { id: ID, btw: BTW };

export function tFor(lang: Language, key: string): string {
  if (lang === "id") return key;
  return PACKS[lang][key] ?? key;
}

export function useT() {
  const db = useDb();
  const lang: Language = db.appearance.language ?? "id";
  return (key: string) => tFor(lang, key);
}

export function currentLang(): Language {
  // Read once from DOM dataset cache to avoid hook calls in non-component code
  if (typeof document !== "undefined") {
    const v = document.documentElement.dataset.lang;
    if (v === "id" || v === "btw") return v;
  }
  return "id";
}
