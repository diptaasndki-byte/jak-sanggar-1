import type {
  AnyUser, KuratorUser, AdminUser, SanggarUser, PelatihUser, SenimanUser, JuriUser,
  News, Banner, SliderImage, Latihan, Iuran, PengajuanHonor, DistribusiHonor,
  TransaksiManual, KasEntry, KurasiMatrix, PenugasanJuri, KurasiSubmission,
  Sertifikat, ActivityLog, JamPembinaan, AbsensiPembinaan, PendaftaranPembinaan,
  AppearanceSettings, Role,
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
    permissions: { kelolaBerita: true, kelolaBanner: true, kelolaSlider: true, kelolaJamPembinaan: false },
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

  return {
    users: [kurator, admin, juri, sanggar1, sanggar2, pelatih1, pelatih2, seniman1, seniman2, seniman3, senimanPending],
    news, banners, slider, latihan: [], iuran, pengajuanHonor, distribusi: [],
    transaksi: [], kas: kasEntries, kurasiMatrix: matrix, penugasanJuri,
    kurasiSubmissions: [], sertifikat: [], activity: [],
    jamPembinaan: { pagiMax: "08:00", siangStart: "13:00", siangEnd: "17:00", pulangStart: "17:00", pulangEnd: "21:00" },
    absensiPembinaan: [], pendaftaranPembinaan: [],
    appearance: { primaryHsl: "4 70% 38%", accentHsl: "41 75% 50%", dark: false },
    exportPassword: "kurator123",
    honorPerSesiDefault: 250_000,
  };
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
  try { cache = JSON.parse(raw) as DBShape; return cache; }
  catch { cache = seed(); localStorage.setItem(KEY, JSON.stringify(cache)); return cache; }
}

const subs = new Set<() => void>();
export function subscribe(fn: () => void) { subs.add(fn); return () => subs.delete(fn); }
function notify() { subs.forEach(fn => fn()); }

export function save(updater: (db: DBShape) => void) {
  const db = load();
  updater(db);
  localStorage.setItem(KEY, JSON.stringify(db));
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
