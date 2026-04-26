import { useDb } from "./auth";
import type { Language } from "./types";

type Dict = Record<string, string>;

const ID: Dict = {};

const BTW: Dict = {
  // Navigasi inti
  "Beranda": "Lapak",
  "Pengaturan": "Atur-Atur",
  "Pengaturan Tampilan": "Atur Tampilan",
  "Tampilan": "Tampilan",
  "Profil Saya": "Profil Gue",
  "Keluar": "Cabut",
  "Notifikasi": "Notif",

  // Aksi umum
  "Simpan": "Gas Simpen",
  "Simpan Semua": "Simpen Semuanye",
  "Simpan Identitas": "Simpen Identitas",
  "Simpan Backdrop": "Simpen Backdrop",
  "Simpan Bahasa": "Simpen Bahasa",
  "Simpan Tema Kustom": "Simpen Tema Racikan",
  "Simpan Studio": "Gas Simpen Studio",
  "Batal": "Skip",
  "Batalkan": "Skip Aje",
  "Hapus": "Buang",
  "Hapus Logo": "Buang Logo",
  "Tambah": "Tambahin",
  "Reset": "Set Ulang",
  "Kembalikan Default": "Balikin Asli",
  "Kembalikan Bawaan": "Balikin Asli",
  "Pilih": "Pilih",
  "Unggah": "Naekin",

  // Tab Tampilan
  "Brand & Logo": "Brand & Logo",
  "Tema & Warna": "Tema & Warna",
  "Backdrop": "Backdrop",
  "Pop-up Tradisi": "Pop-up Tradisi",
  "Bahasa": "Bahasa",
  "Studio Lanjutan": "Studio Pro",
  "Mode Tampilan": "Mode Tampilan",
  "Aksen Warna": "Warna Aksen",
  "Tema Kustom Anda": "Tema Racikan Lo",

  // Pilihan bahasa
  "Pilih Bahasa Antarmuka": "Pilih Bahasa Tampilan",
  "Bahasa Indonesia": "Bahasa Indonesia",
  "Bahasa Betawi": "Bahasa Gaul Betawi",
  "Indonesia": "Indonesia",
  "Betawi": "Betawi",

  // Login
  "Selamat Datang Kembali": "Balik Lagi, Sob!",
  "Masuk Aman": "Gas Masuk",
  "Masuk Akun": "Gas Login",
  "Memverifikasi...": "Lagi dicek...",
  "Username / Email": "Username / Email",
  "Password": "Sandi",
  "Lupa Password?": "Lupa Sandi?",
  "Daftar Akun": "Bikin Akun",
  "Akun Demo": "Akun Cobain",
  "Gunakan kredensial yang terdaftar untuk melanjutkan.": "Pake username sama sandi yang udah kedaftar, ye.",
  "Gagal masuk": "Gagal Masuk",
  "Username atau password tidak cocok.": "Username sama sandinye kage cocok, coba lagi.",
  "Sembunyikan password": "Umpetin sandi",
  "Tampilkan password": "Liatin sandi",

  // Roles
  "Kurator": "Kurator",
  "Admin": "Admin",
  "Sanggar": "Sanggar",
  "Pelatih": "Pelatih",
  "Seniman": "Seniman",
  "Juri": "Juri",

  // Toast & status
  "Edisi Premium": "Edisi Sultan",
  "Tagline Resmi": "Tagline Resmi",
  "Bahasa berhasil diganti": "Bahasa udah keganti",
  "Tema kustom diterapkan": "Tema racikan udah dipake",
  "Tema diperbarui": "Tema udah keupdate",
  "Studio diperbarui": "Studio udah keupdate",
  "Studio dikembalikan ke bawaan": "Studio dibalikin ke asli",
  "Gambar siap. Tekan Simpan untuk menerapkan.": "Gambar udah siap. Tinggal pencet Simpen, beres.",
  "Gagal memuat gambar": "Gambarnye gagal kebuka",
  "Gagal menyimpan": "Gagal disimpen",

  // Studio Lanjutan
  "Tipografi": "Gaya Huruf",
  "Pilih jenis huruf untuk judul dan teks isi, serta atur skala teks global.": "Pilih huruf buat judul ame isi tulisan, terus setel ukurannye sekalian.",
  "Font Judul": "Huruf Judul",
  "Font Isi": "Huruf Isi",
  "Bawaan": "Asli",
  "Skala Teks": "Ukuran Teks",
  "Berlaku ke seluruh aplikasi.": "Berlaku ke semua tampilan, bro.",
  "Permukaan & Sudut": "Latar & Sudut",
  "Atur warna halaman, kartu, garis batas, serta tingkat kelengkungan sudut.": "Atur warna halaman, kartu, garis, ame tingkat lengkungan sudutnye.",
  "Warna Halaman": "Warna Halaman",
  "Warna Teks": "Warna Tulisan",
  "Warna Kartu": "Warna Kartu",
  "Warna Garis": "Warna Garis",
  "Sudut": "Lengkungan",
  "Sidebar": "Sidebar",
  "Ganti warna, atau unggah gambar latar untuk sidebar navigasi.": "Ganti warna, atau naekin gambar latar buat sidebar navigasi.",
  "Warna Sidebar": "Warna Sidebar",
  "Warna Teks Sidebar": "Warna Tulisan Sidebar",
  "Gambar Latar Sidebar": "Gambar Latar Sidebar",
  "Opasitas Gambar": "Tebel Tipisnye Gambar",
  "Halaman Masuk": "Halaman Login",
  "Ganti gambar dan warna lapisan panel kiri halaman masuk.": "Ganti gambar ame warna lapisan di panel kiri halaman login.",
  "Gambar Hero": "Gambar Utama",
  "Warna Lapisan": "Warna Lapisan",
  "Opasitas Lapisan": "Tebel Tipisnye Lapisan",
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
