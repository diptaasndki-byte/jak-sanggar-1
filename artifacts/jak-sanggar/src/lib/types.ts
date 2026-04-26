export type Role = "kurator" | "admin" | "sanggar" | "pelatih" | "seniman" | "juri";

export type JenisKesenian = "Tari" | "Musik" | "Teater" | "Rupa" | "Sastra";
export type Bank = "BCA" | "Mandiri" | "DKI" | "BRI" | "BNI" | "BSI" | "CIMB";
export type Legalitas = "Yayasan" | "PT" | "CV" | "Non-Badan Hukum";

export interface Rekening {
  bank: Bank;
  nomor: string;
  atasNama: string;
}

export interface BaseUser {
  id: string;
  role: Role;
  username: string;
  password: string;
  email?: string;
  noHp?: string;
  createdAt: number;
}

export interface KuratorUser extends BaseUser { role: "kurator"; }

export interface AdminPermissions {
  kelolaBerita: boolean;
  kelolaBanner: boolean;
  kelolaSlider: boolean;
  kelolaJamPembinaan: boolean;
}
export interface AdminUser extends BaseUser {
  role: "admin";
  nama: string;
  permissions: AdminPermissions;
}

export interface FotoGaleriItem { id: string; dataUrl: string; caption?: string; createdAt: number; }

export interface SanggarUser extends BaseUser {
  role: "sanggar";
  namaSanggar: string;
  namaKetua: string;
  legalitas: Legalitas;
  namaBadanHukum?: string;
  jenisKesenian: JenisKesenian[];
  alamat: string;
  lat?: number;
  lng?: number;
  rekening: Rekening;
  saldo: number;
  editCount: number;
  editPeriodStart: number;
  fotoProfileDataUrl?: string;
  fotoGaleri?: FotoGaleriItem[];
  deskripsi?: string;
  tahunBerdiri?: number;
  website?: string;
  instagram?: string;
}

export interface PelatihUser extends BaseUser {
  role: "pelatih";
  nama: string;
  usia: number;
  pendidikan: string;
  jenisKesenian: JenisKesenian;
  sanggarId?: string;
  status: "pending" | "aktif" | "ditolak" | "keluar";
  rekening: Rekening;
  honorPerSesi: number;
  fotoProfileDataUrl?: string;
  fotoGaleri?: FotoGaleriItem[];
  bio?: string;
  alamat?: string;
}

export interface SenimanUser extends BaseUser {
  role: "seniman";
  nama: string;
  usia: number;
  pendidikan: string;
  profesi?: string;
  jenisKesenian: JenisKesenian;
  sanggarId?: string;
  status: "pending" | "aktif" | "ditolak" | "keluar";
  rekening: Rekening;
  fotoProfileDataUrl?: string;
  fotoGaleri?: FotoGaleriItem[];
  bio?: string;
  alamat?: string;
  jenisKelamin?: "Laki-laki" | "Perempuan";
  tanggalLahir?: string;
}

export interface JuriUser extends BaseUser {
  role: "juri";
  nama: string;
  keahlian: string;
  rekening?: Rekening;
  fotoProfileDataUrl?: string;
  fotoGaleri?: FotoGaleriItem[];
  bio?: string;
  pendidikan?: string;
  pengalaman?: string;
  alamat?: string;
}

export type AnyUser =
  | KuratorUser | AdminUser | SanggarUser | PelatihUser | SenimanUser | JuriUser;

export interface News {
  id: string;
  judul: string;
  isi: string;
  imageUrl?: string;
  createdAt: number;
  authorId: string;
}

export interface Banner {
  id: string;
  teks: string;
  start: number;
  end: number;
  active: boolean;
}

export interface SliderImage {
  id: string;
  imageUrl: string;
  caption: string;
}

export interface Latihan {
  id: string;
  sanggarId: string;
  tanggal: string; // YYYY-MM-DD
  jam: string;     // HH:mm
  tempat: string;
  kurikulum: string;
  ciriAdat: string;
  pelatihId?: string;
  editedAt?: number;
  laporan?: {
    fotoDataUrl: string;
    timestamp: number;
    lat: number;
    lng: number;
  };
}

export interface AbsensiPelatih {
  id: string;
  latihanId: string;
  pelatihId: string;
  hadirAt: number;
}

export interface Iuran {
  id: string;
  sanggarId: string;
  senimanId: string;
  judul: string;
  nominal: number;
  buktiDataUrl?: string;
  status: "pending" | "lunas" | "ditolak";
  createdAt: number;
  validatedAt?: number;
}

export interface PengajuanHonor {
  id: string;
  sanggarId: string;
  pelatihId: string;
  jumlahSesi: number;
  honorPerSesi: number;
  total: number;
  status: "pending" | "disetujui" | "ditolak";
  buktiTransferDataUrl?: string;
  createdAt: number;
  paidAt?: number;
}

export interface DistribusiHonor {
  id: string;
  sanggarId: string;
  penerimaId: string;
  penerimaRole: "pelatih" | "seniman";
  judulJob: string;
  nominal: number;
  buktiTransferDataUrl?: string;
  konfirmasi: boolean;
  createdAt: number;
}

export interface TransaksiManual {
  id: string;
  sanggarId: string;
  jenis: "pemasukan" | "pengeluaran";
  tanggal: string;
  kategori: string;
  nominal: number;
  sumberAtauTujuan: string;
  keterangan: string;
  buktiDataUrl?: string;
  createdAt: number;
}

export interface KasEntry {
  id: string;
  sanggarId: string;
  tanggal: number;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo: number;
  refType: string;
  refId: string;
}

export interface SubVariabel { id: string; nama: string; bobot: number; }
export interface Variabel { id: string; nama: string; bobot: number; subVariabel: SubVariabel[]; }
export interface Indikator { id: string; nama: string; bobot: number; variabel: Variabel[]; }

export interface KurasiMatrix {
  indikator: Indikator[];
  updatedAt: number;
}

export interface PenugasanJuri {
  id: string;
  juriId: string;
  sanggarId: string;
  periode: string;
  createdAt: number;
}

export interface KurasiSubmission {
  id: string;
  sanggarId: string;
  tahap1: Record<string, string>;
  tahap2VideoName?: string;
  scores: Record<string, Record<string, number>>; // juriId -> variabelId -> nilai 0..100
  finalized: Record<string, number>; // juriId -> timestamp
  createdAt: number;
}

export interface Sertifikat {
  id: string;
  pemilikId: string;
  pemilikNama: string;
  jenis: string; // "Sertifikasi Profesi: ..." or "Kurasi"
  predikat?: string;
  nilai?: number;
  issuedAt: number;
  sanggarId?: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorRole: Role | "guest";
  action: string;
  meta?: Record<string, unknown>;
  ts: number;
}

export interface JamPembinaan {
  pagiMax: string; // "08:00"
  siangStart: string;
  siangEnd: string;
  pulangStart: string;
  pulangEnd: string;
}

export interface AbsensiPembinaan {
  id: string;
  pesertaId: string;
  slot: "pagi" | "siang" | "pulang";
  ts: number;
  fotoDataUrl?: string;
  validatedByAdminId?: string;
}

export interface PendaftaranPembinaan {
  id: string;
  sanggarId: string;
  delegasiId: string;
  setuju: boolean;
  barcode: string;
  createdAt: number;
}

// ===================== KERJASAMA SANGGAR =====================

export type SatuanHarga = "per_jam" | "per_hari" | "per_event";
export type AsetKategori = "alat_musik" | "kostum";
export type KondisiAset = "baik" | "perlu_perbaikan";

export interface Aset {
  id: string;
  sanggarId: string;
  kategori: AsetKategori;
  nama: string;
  jenis: string;
  jumlahTotal: number;
  jumlahTersedia: number;
  kondisi: KondisiAset;
  fotoDataUrl?: string;
  hargaSewa: number;
  satuanHarga: SatuanHarga;
  statusPublish: boolean;
  createdAt: number;
}

export type JenisTempat = "tempat_latihan" | "aula" | "studio";

export interface Sarpras {
  id: string;
  sanggarId: string;
  namaTempat: string;
  jenisTempat: JenisTempat;
  kapasitas: number;
  fasilitas: string;
  alamat: string;
  fotoDataUrl?: string;
  hargaSewa: number;
  satuanHarga: SatuanHarga;
  statusPublish: boolean;
  createdAt: number;
}

export type KerjasamaKategori = "sdm" | "alat_musik" | "kostum" | "tempat_latihan";
export type KerjasamaStatus =
  | "menunggu" | "diterima" | "ditolak" | "negosiasi" | "berjalan" | "selesai" | "batal";
export type KerjasamaSumber =
  | "sdm-pelatih" | "sdm-seniman" | "sdm-juri" | "aset" | "sarpras";

export interface Kerjasama {
  id: string;
  nomor: string;
  sumberType: KerjasamaSumber;
  sumberId: string;
  sanggarPenyediaId: string;
  sanggarPeminjamId: string;
  kategori: KerjasamaKategori;
  judul: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  jumlah: number;
  satuanHarga: SatuanHarga;
  deskripsi: string;
  hargaAwal: number;
  nilaiTotal: number;
  status: KerjasamaStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  kerjasamaId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  message: string;
  ts: number;
}

export type NegosiasiStatus = "diajukan" | "diterima" | "ditolak";

export interface Negosiasi {
  id: string;
  kerjasamaId: string;
  pengirimSanggarId: string;
  pengirimUserId: string;
  hargaTawar: number;
  catatan: string;
  status: NegosiasiStatus;
  createdAt: number;
}

export type InvoiceStatus = "terhutang" | "lunas";

export interface Invoice {
  id: string;
  kerjasamaId: string;
  nomor: string;
  total: number;
  status: InvoiceStatus;
  batasPembayaran: number;
  createdAt: number;
}

export type PaymentStatus = "menunggu" | "disetujui" | "ditolak";

export interface Payment {
  id: string;
  invoiceId: string;
  nominal: number;
  tanggalBayar: number;
  buktiDataUrl?: string;
  status: PaymentStatus;
  catatanVerifikator?: string;
  createdAt: number;
}

export interface Contract {
  id: string;
  kerjasamaId: string;
  nomor: string;
  createdAt: number;
}

export type BastStatus = "draft" | "final";

export interface Bast {
  id: string;
  kerjasamaId: string;
  nomor: string;
  status: BastStatus;
  createdAt: number;
  finalAt?: number;
}

export interface Rating {
  id: string;
  kerjasamaId: string;
  dariSanggarId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  ulasan: string;
  createdAt: number;
}

export type ThemeMode = "light" | "dark" | "luxury";

export type TradisiKategori = "Pantun Betawi" | "Peribahasa" | "Palang Pintu" | "Sahibul Hikayat" | "Cerita Rakyat" | "Salam Betawi" | "Rancag" | "Lenong";

export interface TradisiItem {
  id: string;
  kategori: TradisiKategori;
  judul: string;
  isi: string;
  sumber?: string;
}

export type TradisiPosition = "br" | "bl" | "tr" | "tl";

export interface TradisiSettings {
  enabled: boolean;
  position: TradisiPosition;
  cooldownMs: number;
  autoHideMs: number;
  cardWidth: number;
  showCloseButton: boolean;
  source: "default" | "custom" | "merge";
  custom: TradisiItem[];
  kategoriColors?: Partial<Record<TradisiKategori, string>>;
}

export interface BrandSettings {
  appName: string;
  appTagline: string;
  sidebarFooterLine1: string;
  sidebarFooterLine2: string;
  iconKey: string;
  logoDataUrl?: string;
  loginEyebrow?: string;
}

export interface LayoutBackdropSettings {
  enabled: boolean;
  imageDataUrl?: string;
  opacity: number;
  blendMode: "normal" | "overlay" | "multiply" | "screen" | "soft-light";
}

export type Language = "id" | "btw";

export interface CustomThemeSettings {
  enabled: boolean;
  mode: ThemeMode;
  primaryHsl: string;
  accentHsl: string;
  bgImageDataUrl?: string;
  bgOpacity?: number;
  previousBaseline?: {
    theme: ThemeMode;
    themePreset: string;
    primaryHsl: string;
    accentHsl: string;
    dark: boolean;
  };
}

export interface AppearanceSettings {
  primaryHsl: string;
  accentHsl: string;
  dark: boolean;
  theme?: ThemeMode;
  themePreset?: string;
  language?: Language;
  brand?: BrandSettings;
  backdrop?: LayoutBackdropSettings;
  tradisi?: TradisiSettings;
  customTheme?: CustomThemeSettings;
}
