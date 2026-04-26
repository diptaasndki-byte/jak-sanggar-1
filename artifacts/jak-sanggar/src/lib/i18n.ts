import { useDb } from "./auth";
import type { Language } from "./types";

type Dict = Record<string, string>;

const ID: Dict = {};

const BTW: Dict = {
  "Beranda": "Pendopo",
  "Pengaturan": "Setelan",
  "Pengaturan Tampilan": "Setelan Tampilan",
  "Tampilan": "Tampilan",
  "Profil Saya": "Profil Aye",
  "Keluar": "Cabut",
  "Notifikasi": "Notif",
  "Simpan": "Simpen",
  "Simpan Semua": "Simpen Semua",
  "Simpan Identitas": "Simpen Identitas",
  "Simpan Backdrop": "Simpen Backdrop",
  "Simpan Bahasa": "Simpen Bahasa",
  "Simpan Tema Kustom": "Simpen Tema Kustom",
  "Batal": "Batalin",
  "Batalkan": "Batalin",
  "Hapus": "Buang",
  "Hapus Logo": "Buang Logo",
  "Tambah": "Tambahin",
  "Reset": "Balikin",
  "Kembalikan Default": "Balikin ke Awal",
  "Pilih": "Pilih",
  "Brand & Logo": "Brand & Logo",
  "Tema & Warna": "Tema & Warne",
  "Backdrop": "Backdrop",
  "Pop-up Tradisi": "Pop-up Tradisi",
  "Bahasa": "Bahase",
  "Mode Tampilan": "Mode Tampilan",
  "Aksen Warna": "Warne Aksen",
  "Tema Kustom Anda": "Tema Bikinan Aye",
  "Pilih Bahasa Antarmuka": "Pilih Bahase Tampilan",
  "Bahasa Indonesia": "Bahasa Indonesia",
  "Bahasa Betawi": "Bahase Betawi (Logat)",
  "Indonesia": "Indonesia",
  "Betawi": "Betawi",
  // Login
  "Selamat Datang Kembali": "Selamet Dateng Lagi",
  "Masuk Aman": "Cabut Mlebu",
  "Masuk Akun": "Mlebu Akun",
  "Memverifikasi...": "Lagi mariksain...",
  "Username / Email": "Username / Imel",
  "Password": "Sandi",
  "Lupa Password?": "Kelupaan Sandi?",
  "Daftar Akun": "Daftarin Akun",
  "Akun Demo": "Akun Coba-coba",
  "Gunakan kredensial yang terdaftar untuk melanjutkan.": "Pake username & sandi yang dah kedaftar buat lanjut, ye.",
  "Gagal masuk": "Kage berhasil masuk",
  "Username atau password tidak cocok.": "Username ame sandi-nye kage cocok, coba lagi.",
  "Sembunyikan password": "Sumputin sandi",
  "Tampilkan password": "Liatin sandi",
  // Roles
  "Kurator": "Kurator",
  "Admin": "Admin",
  "Sanggar": "Sanggar",
  "Pelatih": "Pelatih",
  "Seniman": "Seniman",
  "Juri": "Juri",
  // Misc
  "Edisi Premium": "Edisi Mantep",
  "Tagline Resmi": "Tagline Resmi",
  "Bahasa berhasil diganti": "Bahase dah keganti",
  "Tema kustom diterapkan": "Tema bikinan aye dah dipake",
  "Tema diperbarui": "Tema dah diperbaharuin",
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
