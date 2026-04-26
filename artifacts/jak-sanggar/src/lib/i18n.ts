import { useDb } from "./auth";
import type { Language } from "./types";

type Dict = Record<string, string>;

const ID: Dict = {};

// Bahasa Betawi — tradisi lisan (logat tetua: aye, ente, ame, kage, dah, ye, atawa).
// Hindari gaul modern (gue, lo, sob, gas, bro) maupun campuran Jawa (mlebu).
const BTW: Dict = {
  // Navigasi inti
  "Beranda": "Pelataran",
  "Pengaturan": "Atur-Aturan",
  "Pengaturan Tampilan": "Atur-Aturan Tampilan",
  "Tampilan": "Tampilan",
  "Profil Saya": "Profil Aye",
  "Keluar": "Pulang",
  "Notifikasi": "Kabar",

  // Aksi umum
  "Simpan": "Simpen",
  "Simpan Semua": "Simpen Sekaliyan",
  "Simpan Identitas": "Simpen Identitas",
  "Simpan Backdrop": "Simpen Backdrop",
  "Simpan Bahasa": "Simpen Bahase",
  "Simpan Tema Kustom": "Simpen Tema Bikinan Aye",
  "Simpan Studio": "Simpen Sanggar",
  "Batal": "Urungin",
  "Batalkan": "Urungin Aje",
  "Hapus": "Buang",
  "Hapus Logo": "Buang Logo",
  "Tambah": "Tambahin",
  "Reset": "Balikin",
  "Kembalikan Default": "Balikin ke Aslinye",
  "Kembalikan Bawaan": "Balikin ke Aslinye",
  "Pilih": "Pilih",
  "Unggah": "Pasang",

  // Tab Tampilan
  "Brand & Logo": "Brand & Logo",
  "Tema & Warna": "Tema & Warne",
  "Backdrop": "Backdrop",
  "Pop-up Tradisi": "Pesen Tradisi",
  "Bahasa": "Bahase",
  "Studio Lanjutan": "Sanggar Mendalem",
  "Mode Tampilan": "Mode Tampilan",
  "Aksen Warna": "Warne Aksen",
  "Tema Kustom Anda": "Tema Bikinan Aye",

  // Pilihan bahasa
  "Pilih Bahasa Antarmuka": "Pilih Bahase Tampilan",
  "Bahasa Indonesia": "Bahasa Indonesia",
  "Bahasa Betawi": "Bahase Betawi (Tradisi Lisan)",
  "Indonesia": "Indonesia",
  "Betawi": "Betawi",

  // Login (gaya undangan halus tetua Betawi)
  "Selamat Datang Kembali": "Sile Mampir Lagi",
  "Masuk Aman": "Mari Masuk",
  "Masuk Akun": "Mari Masuk Akun",
  "Memverifikasi...": "Lagi diperiksain...",
  "Username / Email": "Username / Imel",
  "Password": "Sandi",
  "Lupa Password?": "Sandi-nye Kelupaan?",
  "Daftar Akun": "Daftarin Akun",
  "Akun Demo": "Akun Coba-Cobaan",
  "Gunakan kredensial yang terdaftar untuk melanjutkan.": "Pake username ame sandi yang dah kedaftar buat lanjut, ye.",
  "Gagal masuk": "Kage Kebuka",
  "Username atau password tidak cocok.": "Username ame sandi-nye kage cocok, coba lagi.",
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
  "Edisi Premium": "Edisi Adiluhung",
  "Tagline Resmi": "Pepatah Resmi",
  "Bahasa berhasil diganti": "Bahase dah keganti",
  "Tema kustom diterapkan": "Tema bikinan aye dah dipake",
  "Tema diperbarui": "Tema dah diperbaharuin",
  "Studio diperbarui": "Sanggar dah diperbaharuin",
  "Studio dikembalikan ke bawaan": "Sanggar dibalikin ke aslinye",
  "Gambar siap. Tekan Simpan untuk menerapkan.": "Gambar dah siap. Tinggal pencet Simpen, beres.",
  "Gagal memuat gambar": "Gambarnye kage kebuka",
  "Gagal menyimpan": "Kage kesimpen",

  // Studio Lanjutan
  "Tipografi": "Gaya Aksara",
  "Pilih jenis huruf untuk judul dan teks isi, serta atur skala teks global.": "Pilih aksara buat judul ame isi tulisan, terus tetepin ukurannye sekaliyan.",
  "Font Judul": "Aksara Judul",
  "Font Isi": "Aksara Isi",
  "Bawaan": "Asli",
  "Skala Teks": "Ukuran Tulisan",
  "Berlaku ke seluruh aplikasi.": "Berlaku ke segenap tampilan.",
  "Permukaan & Sudut": "Latar & Sudut",
  "Atur warna halaman, kartu, garis batas, serta tingkat kelengkungan sudut.": "Setel warne pelataran, kartu, garis, ame lengkungan sudutnye.",
  "Warna Halaman": "Warne Pelataran",
  "Warna Teks": "Warne Tulisan",
  "Warna Kartu": "Warne Kartu",
  "Warna Garis": "Warne Garis",
  "Sudut": "Lengkungan",
  "Sidebar": "Pinggiran",
  "Ganti warna, atau unggah gambar latar untuk sidebar navigasi.": "Tuker warne, atawa pasang gambar latar buat pinggiran navigasi.",
  "Warna Sidebar": "Warne Pinggiran",
  "Warna Teks Sidebar": "Warne Tulisan Pinggiran",
  "Gambar Latar Sidebar": "Gambar Latar Pinggiran",
  "Opasitas Gambar": "Tebel-Tipisnye Gambar",
  "Halaman Masuk": "Pelataran Masuk",
  "Ganti gambar dan warna lapisan panel kiri halaman masuk.": "Tuker gambar ame warne lapisan di sisi kiri pelataran masuk.",
  "Gambar Hero": "Gambar Utame",
  "Warna Lapisan": "Warne Lapisan",
  "Opasitas Lapisan": "Tebel-Tipisnye Lapisan",
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
