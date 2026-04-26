import type {
  AnyUser, KuratorUser, AdminUser, SanggarUser, PelatihUser, SenimanUser, JuriUser,
  News, Banner, SliderImage, Latihan, Iuran, PengajuanHonor, DistribusiHonor,
  TransaksiManual, KasEntry, KurasiMatrix, PenugasanJuri, KurasiSubmission,
  Sertifikat, ActivityLog, JamPembinaan, AbsensiPembinaan, PendaftaranPembinaan,
  AppearanceSettings, Role,
  Aset, Sarpras, Kerjasama, ChatMessage, Negosiasi, Invoice, Payment,
  Contract, Bast, Rating, InfoBudaya,
} from "./types";

const KEY = "jaksanggar_v1";

export interface DBShape {
  users: AnyUser[];
  news: News[];
  banners: Banner[];
  slider: SliderImage[];
  latihan: Latihan[];
  iuran: Iuran[];
  pengajuanHonor: PengajuanHonor[];
  distribusi: DistribusiHonor[];
  transaksi: TransaksiManual[];
  kas: KasEntry[];
  kurasiMatrix: KurasiMatrix;
  penugasanJuri: PenugasanJuri[];
  kurasiSubmissions: KurasiSubmission[];
  sertifikat: Sertifikat[];
  activity: ActivityLog[];
  jamPembinaan: JamPembinaan;
  absensiPembinaan: AbsensiPembinaan[];
  pendaftaranPembinaan: PendaftaranPembinaan[];
  appearance: AppearanceSettings;
  exportPassword: string;
  honorPerSesiDefault: number;
  // Kerjasama Sanggar
  aset: Aset[];
  sarpras: Sarpras[];
  kerjasama: Kerjasama[];
  chatMessages: ChatMessage[];
  negosiasi: Negosiasi[];
  invoices: Invoice[];
  payments: Payment[];
  contracts: Contract[];
  bast: Bast[];
  ratings: Rating[];
  // Informasi Kebudayaan (replaces "Berita Sanggar Aktif" on Sanggar dashboard)
  infoBudaya: InfoBudaya[];
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function seed(): DBShape {
  const now = Date.now();
  const kurator: KuratorUser = {
    id: uid(), role: "kurator", username: "Penguasa jak1", password: "ayamayaman",
    createdAt: now,
  };
  const admin: AdminUser = {
    id: uid(), role: "admin", username: "admin1", password: "admin123",
    nama: "Sari Admin", createdAt: now,
    permissions: { kelolaBerita: true, kelolaBanner: true, kelolaSlider: true, kelolaJamPembinaan: false, kelolaInfoBudaya: true },
  };
  const juri: JuriUser = {
    id: uid(), role: "juri", username: "juri1", password: "juri123",
    nama: "Bpk. Hidayat, M.Sn.", keahlian: "Tari Tradisional", createdAt: now,
  };
  const sanggar1: SanggarUser = {
    id: uid(), role: "sanggar", username: "betawi.merah", password: "sanggar123",
    email: "betawi@example.com", noHp: "081234567890",
    namaSanggar: "Sanggar Betawi Merah",
    namaKetua: "H. Mahmud Saliman",
    legalitas: "Yayasan", namaBadanHukum: "Yayasan Budaya Betawi Merah",
    jenisKesenian: ["Tari", "Musik"],
    alamat: "Jl. Condet Raya No. 12, Jakarta Timur",
    lat: -6.2615, lng: 106.8645,
    rekening: { bank: "DKI", nomor: "10300012345", atasNama: "Yayasan Betawi Merah" },
    saldo: 8_500_000, editCount: 0, editPeriodStart: now, createdAt: now,
  };
  const sanggar2: SanggarUser = {
    id: uid(), role: "sanggar", username: "kembang.setaman", password: "sanggar123",
    email: "setaman@example.com", noHp: "082134567891",
    namaSanggar: "Sanggar Kembang Setaman",
    namaKetua: "Ibu Rini Astuti",
    legalitas: "CV", namaBadanHukum: "CV Kembang Setaman",
    jenisKesenian: ["Tari", "Teater"],
    alamat: "Jl. Kebon Jeruk Raya No. 88, Jakarta Barat",
    lat: -6.1865, lng: 106.7720,
    rekening: { bank: "BCA", nomor: "8801234567", atasNama: "CV Kembang Setaman" },
    saldo: 4_200_000, editCount: 0, editPeriodStart: now, createdAt: now,
  };
  const pelatih1: PelatihUser = {
    id: uid(), role: "pelatih", username: "pelatih.iwan", password: "pelatih123",
    nama: "Iwan Setiawan", noHp: "081298765432",
    usia: 38, pendidikan: "S1 Seni Tari", jenisKesenian: "Tari",
    sanggarId: sanggar1.id, status: "aktif",
    rekening: { bank: "Mandiri", nomor: "1300012345", atasNama: "Iwan Setiawan" },
    honorPerSesi: 250_000, createdAt: now,
  };
  const pelatih2: PelatihUser = {
    id: uid(), role: "pelatih", username: "pelatih.nia", password: "pelatih123",
    nama: "Nia Permata", noHp: "081298765433",
    usia: 32, pendidikan: "S1 Seni Musik", jenisKesenian: "Musik",
    sanggarId: sanggar1.id, status: "aktif",
    rekening: { bank: "BNI", nomor: "0012345678", atasNama: "Nia Permata" },
    honorPerSesi: 200_000, createdAt: now,
  };
  const seniman1: SenimanUser = {
    id: uid(), role: "seniman", username: "ayu.tari", password: "seniman123",
    nama: "Ayu Lestari", noHp: "081377889900",
    usia: 22, pendidikan: "SMA", profesi: "Mahasiswa", jenisKesenian: "Tari",
    sanggarId: sanggar1.id, status: "aktif",
    rekening: { bank: "BRI", nomor: "0023456789", atasNama: "Ayu Lestari" },
    createdAt: now,
  };
  const seniman2: SenimanUser = {
    id: uid(), role: "seniman", username: "budi.gambang", password: "seniman123",
    nama: "Budi Hartono", noHp: "081377889901",
    usia: 28, pendidikan: "S1", profesi: "Karyawan Swasta", jenisKesenian: "Musik",
    sanggarId: sanggar1.id, status: "aktif",
    rekening: { bank: "BCA", nomor: "5512348877", atasNama: "Budi Hartono" },
    createdAt: now,
  };
  const seniman3: SenimanUser = {
    id: uid(), role: "seniman", username: "citra.teater", password: "seniman123",
    nama: "Citra Wulandari", noHp: "081377889902",
    usia: 25, pendidikan: "S1 Sastra", profesi: "Penulis Lepas", jenisKesenian: "Teater",
    sanggarId: sanggar2.id, status: "aktif",
    rekening: { bank: "BSI", nomor: "7700123456", atasNama: "Citra Wulandari" },
    createdAt: now,
  };
  const senimanPending: SenimanUser = {
    id: uid(), role: "seniman", username: "dewi.calon", password: "seniman123",
    nama: "Dewi Maharani", noHp: "081377889903",
    usia: 19, pendidikan: "SMA", jenisKesenian: "Tari",
    sanggarId: sanggar1.id, status: "pending",
    rekening: { bank: "DKI", nomor: "10322224444", atasNama: "Dewi Maharani" },
    createdAt: now,
  };

  const news: News[] = [
    { id: uid(), judul: "Pembukaan Pendaftaran Pembinaan 2026", isi: "Sanggar di seluruh Jakarta diundang mendaftar program pembinaan manajemen tahun ini.", createdAt: now - 86400000 * 3, authorId: admin.id },
    { id: uid(), judul: "Festival Budaya Betawi Bulan Depan", isi: "Pendaftaran peserta festival telah dibuka di portal Jak Sanggar.", createdAt: now - 86400000, authorId: admin.id },
  ];
  const slider: SliderImage[] = [
    { id: uid(), imageUrl: "https://images.unsplash.com/photo-1583294131-9c11d4d4b4e3?w=1200", caption: "Sanggar berkarya, budaya bertahan" },
    { id: uid(), imageUrl: "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=1200", caption: "Regenerasi pelaku seni untuk Jakarta" },
  ];
  const banners: Banner[] = [
    { id: uid(), teks: "Periode kurasi sanggar 2026 akan dimulai 1 Mei 2026.", start: now, end: now + 86400000 * 30, active: true },
  ];

  const infoBudaya: InfoBudaya[] = [
    {
      id: uid(),
      judul: "Tari Topeng Betawi",
      ringkasan: "Tarian topeng khas Betawi yang lahir dari tradisi keliling kampung. Memadukan tari, musik, dan teater rakyat.",
      isi: "Tari Topeng Betawi adalah seni pertunjukan rakyat yang berkembang di pinggiran Jakarta sejak abad ke-19. Penari mengenakan tiga jenis topeng — Panji, Samba, dan Jingga — yang masing-masing membawa karakter berbeda. Diiringi musik gambang kromong dan rebana, pertunjukan ini biasa hadir di pesta hajatan, khitanan, sampai panen.",
      imageUrl: "https://images.unsplash.com/photo-1583394293214-28a4b0028b1c?w=1600",
      kategori: "Tari",
      sumber: "Dinas Kebudayaan DKI Jakarta",
      active: true,
      order: 1,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 5,
      authorId: kurator.id,
    },
    {
      id: uid(),
      judul: "Gambang Kromong",
      ringkasan: "Orkes khas Betawi yang memadukan alat musik Tionghoa dan pribumi. Bukti hidup akulturasi panjang di Jakarta.",
      isi: "Gambang Kromong lahir dari perpaduan alat musik Tionghoa (kongahyan, tehyan, sukong) dengan alat musik pribumi (gambang, kromong, gendang). Lagu-lagunya seperti 'Jali-Jali', 'Kicir-Kicir', dan 'Surilang' jadi identitas Jakarta. Hari ini gambang kromong sering dipakai mengiringi lenong, tari cokek, hingga upacara pernikahan adat Betawi.",
      imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1600",
      kategori: "Musik",
      sumber: "Lembaga Kebudayaan Betawi",
      active: true,
      order: 2,
      createdAt: now - 86400000 * 4,
      updatedAt: now - 86400000 * 4,
      authorId: kurator.id,
    },
    {
      id: uid(),
      judul: "Lenong Denes & Lenong Preman",
      ringkasan: "Teater rakyat Betawi penuh humor, dialek khas, dan kritik sosial. Dua versi: Denes (kerajaan) dan Preman (rakyat).",
      isi: "Lenong adalah teater rakyat Betawi yang memadukan dialog jenaka, lagu, dan tari. Lenong Denes mengangkat cerita kerajaan dengan kostum mewah, sedangkan Lenong Preman bercerita tentang jagoan kampung dengan bahasa sehari-hari yang nyablak. Tokoh ikonik seperti Si Jampang dan Si Pitung sering jadi lakon utama.",
      imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1600",
      kategori: "Teater",
      sumber: "Pusat Studi Betawi UI",
      active: true,
      order: 3,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 3,
      authorId: kurator.id,
    },
    {
      id: uid(),
      judul: "Kerak Telor — Kuliner Identitas",
      ringkasan: "Hidangan ikonik Betawi yang mulai langka. Beras ketan, telur bebek, ebi, kelapa serundeng — dibakar di anglo.",
      isi: "Kerak Telor adalah penganan khas Betawi yang dulu disajikan untuk tamu kehormatan kompeni Belanda di pesta Pemerintah Hindia Belanda. Bahan utamanya beras ketan putih, telur bebek atau ayam, ebi (udang kering halus), bawang goreng, kelapa sangrai, dan bumbu rempah. Saat ini kerak telor jadi ikon Pekan Raya Jakarta dan festival budaya Betawi.",
      imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1600",
      kategori: "Kuliner",
      sumber: "Kompendium Kuliner Nusantara",
      active: true,
      order: 4,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
      authorId: admin.id,
    },
    {
      id: uid(),
      judul: "Palang Pintu — Tradisi Pernikahan",
      ringkasan: "Tradisi penyambutan rombongan pengantin pria dengan adu pantun, silat beksi, dan baca shalawat sebelum diizinkan masuk.",
      isi: "Palang Pintu adalah tradisi adat dalam pernikahan Betawi. Saat rombongan pengantin pria tiba di kediaman pengantin perempuan, jagoan dari kedua pihak akan beradu pantun dan silat beksi. Setelah saling mengalahkan secara simbolis, diakhiri dengan lantunan shalawat dan rombongan diperbolehkan masuk. Tradisi ini menggambarkan keterbukaan, kesopanan, dan keberanian khas masyarakat Betawi.",
      imageUrl: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1600",
      kategori: "Upacara",
      sumber: "Lembaga Kebudayaan Betawi",
      active: true,
      order: 5,
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
      authorId: admin.id,
    },
  ];

  const kasEntries: KasEntry[] = [
    { id: uid(), sanggarId: sanggar1.id, tanggal: now - 86400000 * 20, keterangan: "Honor Pentas HUT DKI", debit: 5_000_000, kredit: 0, saldo: 5_000_000, refType: "manual", refId: "" },
    { id: uid(), sanggarId: sanggar1.id, tanggal: now - 86400000 * 15, keterangan: "Iuran Anggota Mei", debit: 1_500_000, kredit: 0, saldo: 6_500_000, refType: "iuran", refId: "" },
    { id: uid(), sanggarId: sanggar1.id, tanggal: now - 86400000 * 10, keterangan: "Sewa Sanggar", debit: 0, kredit: 1_000_000, saldo: 5_500_000, refType: "manual", refId: "" },
    { id: uid(), sanggarId: sanggar1.id, tanggal: now - 86400000 * 7, keterangan: "Donasi Komunitas", debit: 4_000_000, kredit: 0, saldo: 9_500_000, refType: "manual", refId: "" },
    { id: uid(), sanggarId: sanggar1.id, tanggal: now - 86400000 * 3, keterangan: "Honor Pelatih April", debit: 0, kredit: 1_000_000, saldo: 8_500_000, refType: "honor", refId: "" },
  ];

  const iuran: Iuran[] = [
    { id: uid(), sanggarId: sanggar1.id, senimanId: seniman1.id, judul: "Iuran Bulanan Mei 2026", nominal: 75_000, status: "pending", buktiDataUrl: undefined, createdAt: now - 86400000 },
  ];

  const pengajuanHonor: PengajuanHonor[] = [
    { id: uid(), sanggarId: sanggar1.id, pelatihId: pelatih1.id, jumlahSesi: 8, honorPerSesi: 250_000, total: 2_000_000, status: "pending", createdAt: now - 86400000 * 2 },
  ];

  const matrix: KurasiMatrix = {
    updatedAt: now,
    indikator: [
      { id: uid(), nama: "Manajemen Organisasi", bobot: 30, variabel: [
        { id: uid(), nama: "Legalitas & Tata Kelola", bobot: 50, subVariabel: [] },
        { id: uid(), nama: "Keuangan & Pelaporan", bobot: 50, subVariabel: [] },
      ]},
      { id: uid(), nama: "Tampilan Karya", bobot: 70, variabel: [
        { id: uid(), nama: "Kualitas Artistik", bobot: 40, subVariabel: [] },
        { id: uid(), nama: "Originalitas & Kekayaan Budaya", bobot: 30, subVariabel: [] },
        { id: uid(), nama: "Kekompakan Tim", bobot: 30, subVariabel: [] },
      ]},
    ],
  };

  const penugasanJuri: PenugasanJuri[] = [
    { id: uid(), juriId: juri.id, sanggarId: sanggar1.id, periode: "Kurasi 2026 Tahap I", createdAt: now },
  ];

  // Kerjasama seed
  const aset: Aset[] = [
    { id: uid(), sanggarId: sanggar1.id, kategori: "alat_musik", nama: "Gambang Kromong", jenis: "Set lengkap 7 alat", jumlahTotal: 1, jumlahTersedia: 1, kondisi: "baik", hargaSewa: 1_500_000, satuanHarga: "per_event", statusPublish: true, createdAt: now },
    { id: uid(), sanggarId: sanggar1.id, kategori: "kostum", nama: "Kostum Tari Topeng", jenis: "Pria & Wanita", jumlahTotal: 12, jumlahTersedia: 12, kondisi: "baik", hargaSewa: 75_000, satuanHarga: "per_hari", statusPublish: true, createdAt: now },
    { id: uid(), sanggarId: sanggar2.id, kategori: "kostum", nama: "Kostum Lenong Klasik", jenis: "Set 8 pemain", jumlahTotal: 8, jumlahTersedia: 8, kondisi: "baik", hargaSewa: 90_000, satuanHarga: "per_hari", statusPublish: true, createdAt: now },
  ];
  const sarpras: Sarpras[] = [
    { id: uid(), sanggarId: sanggar1.id, namaTempat: "Aula Betawi Merah", jenisTempat: "aula", kapasitas: 80, fasilitas: "AC, Sound, Cermin", alamat: "Jl. Condet Raya No. 12", hargaSewa: 350_000, satuanHarga: "per_jam", statusPublish: true, createdAt: now },
    { id: uid(), sanggarId: sanggar2.id, namaTempat: "Studio Kembang Setaman", jenisTempat: "studio", kapasitas: 30, fasilitas: "Lantai parket, cermin, sound", alamat: "Jl. Kebon Jeruk Raya 88", hargaSewa: 200_000, satuanHarga: "per_jam", statusPublish: true, createdAt: now },
  ];

  return {
    users: [kurator, admin, juri, sanggar1, sanggar2, pelatih1, pelatih2, seniman1, seniman2, seniman3, senimanPending],
    news, banners, slider, latihan: [], iuran, pengajuanHonor, distribusi: [],
    transaksi: [], kas: kasEntries, kurasiMatrix: matrix, penugasanJuri,
    kurasiSubmissions: [], sertifikat: [], activity: [],
    jamPembinaan: { pagiMax: "08:00", siangStart: "13:00", siangEnd: "17:00", pulangStart: "17:00", pulangEnd: "21:00" },
    absensiPembinaan: [], pendaftaranPembinaan: [],
    appearance: {
      primaryHsl: "220 55% 18%",
      accentHsl: "42 65% 53%",
      dark: false,
      theme: "light",
      themePreset: "light",
      language: "id",
      customTheme: { enabled: false, mode: "light", primaryHsl: "220 55% 18%", accentHsl: "42 65% 53%", bgOpacity: 0.22 },
      brand: {
        appName: "Jak Sanggar",
        appTagline: "Kebudayaan akan bernyawa karena ketulusan",
        sidebarFooterLine1: "Kebudayaan akan bernyawa",
        sidebarFooterLine2: "karena ketulusan",
        iconKey: "Sparkles",
        loginEyebrow: "Konsorsium Sanggar Betawi",
      },
      backdrop: { enabled: false, opacity: 0.18, blendMode: "soft-light" },
      tradisi: {
        enabled: true,
        position: "br",
        cooldownMs: 2200,
        autoHideMs: 4200,
        cardWidth: 280,
        showCloseButton: true,
        source: "default",
        custom: [],
        kategoriColors: {
          "Pantun Betawi": "#e3b864",
          "Peribahasa": "#d4a64e",
          "Palang Pintu": "#c2784a",
          "Sahibul Hikayat": "#b89460",
          "Cerita Rakyat": "#c45a72",
          "Salam Betawi": "#caa86a",
          "Rancag": "#daa44e",
          "Lenong": "#9d7bc0",
        },
      },
    },
    exportPassword: "kurator123",
    honorPerSesiDefault: 250_000,
    aset, sarpras, kerjasama: [], chatMessages: [], negosiasi: [], invoices: [],
    payments: [], contracts: [], bast: [], ratings: [],
    infoBudaya,
  };
}

function migrate(db: DBShape): DBShape {
  // Backfill new collections for existing localStorage seeds.
  db.aset ||= [];
  db.sarpras ||= [];
  db.kerjasama ||= [];
  db.chatMessages ||= [];
  db.negosiasi ||= [];
  db.invoices ||= [];
  db.payments ||= [];
  db.contracts ||= [];
  db.bast ||= [];
  db.ratings ||= [];
  db.infoBudaya ||= [];
  // Backfill kelolaInfoBudaya permission untuk admin yang sudah ada
  for (const u of db.users) {
    if (u.role === "admin") {
      const a = u as AdminUser;
      const existing = (a.permissions ?? {}) as Partial<AdminUser["permissions"]>;
      a.permissions = {
        kelolaBerita: existing.kelolaBerita ?? true,
        kelolaBanner: existing.kelolaBanner ?? true,
        kelolaSlider: existing.kelolaSlider ?? true,
        kelolaJamPembinaan: existing.kelolaJamPembinaan ?? false,
        kelolaInfoBudaya: existing.kelolaInfoBudaya ?? true,
      };
    }
  }
  db.appearance ||= { primaryHsl: "220 55% 18%", accentHsl: "42 65% 53%", dark: false, theme: "light" };
  db.appearance.themePreset ||= db.appearance.theme ?? "light";
  db.appearance.language ||= "id";
  db.appearance.customTheme = { enabled: false, mode: "light", primaryHsl: "220 55% 18%", accentHsl: "42 65% 53%", bgOpacity: 0.22, ...(db.appearance.customTheme ?? {}) };
  db.appearance.studio = { fontScale: 1, sidebarImageOpacity: 0.18, loginHeroOverlayOpacity: 0.55, ...(db.appearance.studio ?? {}) };
  const defBrand = {
    appName: "Jak Sanggar",
    appTagline: "Kebudayaan akan bernyawa karena ketulusan",
    sidebarFooterLine1: "Kebudayaan akan bernyawa",
    sidebarFooterLine2: "karena ketulusan",
    iconKey: "Sparkles",
    loginEyebrow: "Konsorsium Sanggar Betawi",
  };
  db.appearance.brand = { ...defBrand, ...(db.appearance.brand ?? {}) };
  const defBackdrop = { enabled: false, opacity: 0.18, blendMode: "soft-light" as const };
  db.appearance.backdrop = { ...defBackdrop, ...(db.appearance.backdrop ?? {}) };
  const defKategoriColors = {
    "Pantun Betawi": "#e3b864",
    "Peribahasa": "#d4a64e",
    "Palang Pintu": "#c2784a",
    "Sahibul Hikayat": "#b89460",
    "Cerita Rakyat": "#c45a72",
    "Salam Betawi": "#caa86a",
    "Rancag": "#daa44e",
    "Lenong": "#9d7bc0",
  };
  const defTradisi = {
    enabled: true,
    position: "br" as const,
    cooldownMs: 2200,
    autoHideMs: 4200,
    cardWidth: 280,
    showCloseButton: true,
    source: "default" as const,
    custom: [],
    kategoriColors: defKategoriColors,
  };
  const existingTradisi = db.appearance.tradisi ?? {} as any;
  db.appearance.tradisi = {
    ...defTradisi,
    ...existingTradisi,
    custom: Array.isArray(existingTradisi.custom) ? existingTradisi.custom : [],
    kategoriColors: { ...defKategoriColors, ...(existingTradisi.kategoriColors ?? {}) },
  };
  return db;
}

let cache: DBShape | null = null;

export function load(): DBShape {
  if (cache) return cache;
  if (typeof window === "undefined") { cache = seed(); return cache; }
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    cache = seed();
    localStorage.setItem(KEY, JSON.stringify(cache));
    return cache;
  }
  try {
    cache = migrate(JSON.parse(raw) as DBShape);
    return cache;
  } catch { cache = seed(); localStorage.setItem(KEY, JSON.stringify(cache)); return cache; }
}

const subs = new Set<() => void>();
export function subscribe(fn: () => void) { subs.add(fn); return () => subs.delete(fn); }
function notify() { subs.forEach(fn => fn()); }

export class StorageQuotaError extends Error {
  constructor(message = "Penyimpanan lokal penuh.") { super(message); this.name = "StorageQuotaError"; }
}

let lastSerialized: string | null = null;

export function save(updater: (db: DBShape) => void) {
  const db = load();
  const before = lastSerialized ?? JSON.stringify(db);
  updater(db);
  const next = JSON.stringify(db);
  try {
    localStorage.setItem(KEY, next);
    lastSerialized = next;
  } catch (err: any) {
    // Roll back the in-memory mutation by re-parsing the previous snapshot
    try {
      const prev = JSON.parse(before) as DBShape;
      Object.assign(db, prev);
    } catch { /* keep mutated state if rollback fails */ }
    if (err && (err.name === "QuotaExceededError" || /quota/i.test(String(err.message ?? "")))) {
      throw new StorageQuotaError("Penyimpanan lokal melebihi kapasitas. Kurangi ukuran logo / backdrop, atau hapus data yang tidak terpakai.");
    }
    throw err;
  }
  cache = { ...db };
  notify();
}

export function resetAll() {
  localStorage.removeItem(KEY);
  cache = null;
  load();
  notify();
}

export function logActivity(actorId: string, actorRole: Role | "guest", action: string, meta?: Record<string, unknown>) {
  save(db => {
    db.activity.unshift({ id: uid(), actorId, actorRole, action, meta, ts: Date.now() });
    if (db.activity.length > 500) db.activity.length = 500;
  });
}

export function fmtRp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}
export function fmtDate(ts: number | string) {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
export function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function recomputeSaldo(sanggarId: string): number {
  const db = load();
  const entries = db.kas.filter(k => k.sanggarId === sanggarId).sort((a, b) => a.tanggal - b.tanggal);
  let saldo = 0;
  for (const e of entries) saldo += e.debit - e.kredit;
  return saldo;
}

export function pushKas(sanggarId: string, keterangan: string, debit: number, kredit: number, refType: string, refId: string) {
  save(db => {
    const last = db.kas.filter(k => k.sanggarId === sanggarId).reduce((s, k) => s + k.debit - k.kredit, 0);
    const saldo = last + debit - kredit;
    db.kas.push({ id: uid(), sanggarId, tanggal: Date.now(), keterangan, debit, kredit, saldo, refType, refId });
    const sg = db.users.find(u => u.id === sanggarId && u.role === "sanggar") as SanggarUser | undefined;
    if (sg) sg.saldo = saldo;
  });
}
