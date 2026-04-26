import { useDb } from "./auth";
import type { Language } from "./types";

type Dict = Record<string, string>;

const ID: Dict = {};

// Bahasa Betawi — sentuhan ringan, natural, bukan dialek panggung.
// Prinsip: istilah teknis/UI tetap bahasa Indonesia. Hanya kalimat
// percakapan & beberapa kata kerja yang diganti dengan logat Betawi
// halus (aye, dah, ye, kage, simpen).
const BTW: Dict = {
  // Navigasi (sebagian besar tetap)
  "Profil Saya": "Profil Aye",
  "Keluar": "Keluar",
  "Notifikasi": "Notifikasi",

  // Aksi umum — Betawi-fy sebagian saja
  "Simpan": "Simpen",
  "Simpan Semua": "Simpen Semua",
  "Simpan Identitas": "Simpen Identitas",
  "Simpan Backdrop": "Simpen Backdrop",
  "Simpan Bahasa": "Simpen Bahasa",
  "Simpan Tema Kustom": "Simpen Tema Kustom",
  "Simpan Studio": "Simpen Studio",
  "Batal": "Batal",
  "Batalkan": "Batalin",
  "Hapus": "Hapus",
  "Hapus Logo": "Hapus Logo",
  "Tambah": "Tambahin",
  "Reset": "Reset",
  "Kembalikan Default": "Balikin ke Awal",
  "Kembalikan Bawaan": "Balikin ke Awal",

  // Login — kalimatnye yang dapet logat, label tetep
  "Selamat Datang Kembali": "Selamet Dateng Lagi",
  "Masuk Akun": "Masuk Akun",
  "Memverifikasi...": "Lagi diperiksa...",
  "Lupa Password?": "Lupa sandi?",
  "Daftar Akun": "Daftar Akun",
  "Akun Demo": "Akun Demo",
  "Gunakan kredensial yang terdaftar untuk melanjutkan.": "Pake username sama sandi yang udah kedaftar, ye.",
  "Gagal masuk": "Gagal masuk",
  "Username atau password tidak cocok.": "Username sama sandinye kage cocok, coba lagi.",
  "Sembunyikan password": "Sembunyiin sandi",
  "Tampilkan password": "Tampilin sandi",

  // Pilihan bahasa
  "Bahasa Betawi": "Bahasa Betawi",

  // Toast & status — di sini logatnye yang paling kerasa
  "Tema Kustom Anda": "Tema Kustom Aye",
  "Bahasa berhasil diganti": "Bahasanye dah keganti",
  "Tema kustom diterapkan": "Tema kustom dah dipake",
  "Tema diperbarui": "Tema dah diperbarui",
  "Studio diperbarui": "Studio dah diperbarui",
  "Studio dikembalikan ke bawaan": "Studio dah dibalikin ke awal",
  "Gambar siap. Tekan Simpan untuk menerapkan.": "Gambarnye dah siap. Tinggal pencet Simpen, beres.",
  "Gagal memuat gambar": "Gambarnye gagal kebuka",
  "Gagal menyimpan": "Gagal disimpen",

  // Studio Lanjutan — istilah teknis biarin standar, cuma hint kalimat yang diubah
  "Pilih jenis huruf untuk judul dan teks isi, serta atur skala teks global.": "Pilih jenis huruf buat judul sama isi teks, terus atur ukurannye sekalian.",
  "Berlaku ke seluruh aplikasi.": "Berlaku ke semua tampilan.",
  "Atur warna halaman, kartu, garis batas, serta tingkat kelengkungan sudut.": "Atur warna halaman, kartu, garis, sama tingkat lengkungan sudutnye.",
  "Ganti warna, atau unggah gambar latar untuk sidebar navigasi.": "Ganti warna, atau pasang gambar latar buat sidebar navigasi.",
  "Ganti gambar dan warna lapisan panel kiri halaman masuk.": "Ganti gambar sama warna lapisan di panel kiri halaman masuk.",
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
