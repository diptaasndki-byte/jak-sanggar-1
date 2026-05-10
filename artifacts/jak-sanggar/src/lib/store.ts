// =============================================================
// store.ts — MIGRATED: Bridge layer
//
// File ini tetap mengekspor fungsi-fungsi lama (load, save, uid, dll.)
// agar halaman yang belum sepenuhnya dimigrasikan tetap bisa berjalan.
//
// PENTING: Semua operasi tulis sekarang JUGA mengirim data ke API server.
// Data dibaca dari cache in-memory yang di-sync dari server saat init.
//
// Fungsi load() sekarang mengembalikan cache yang di-populate dari API.
// Fungsi save() mengirim perubahan ke API dan meng-update cache.
// =============================================================
import type {
  AnyUser, KuratorUser, AdminUser, SanggarUser, PelatihUser, SenimanUser, JuriUser, SewaUser,
  News, Banner, SliderImage, Latihan, Iuran, PengajuanHonor, DistribusiHonor,
  TransaksiManual, KasEntry, KurasiMatrix, PenugasanJuri, KurasiSubmission,
  Sertifikat, ActivityLog, JamPembinaan, AbsensiPembinaan, PendaftaranPembinaan,
  AppearanceSettings, Role,
  Aset, Sarpras, Kerjasama, ChatMessage, Negosiasi, Invoice, Payment,
  Contract, Bast, Rating, InfoBudaya, PemesananSewa,
} from "./types";
import {
  newsApi, bannersApi, sliderApi, latihanApi, iuranApi,
  pengajuanHonorApi, distribusiHonorApi, kasApi, transaksiApi,
  kurasiMatrixApi, penugasanJuriApi, kurasiSubmissionApi, sertifikatApi,
  activityApi, jamPembinaanApi, absensiPembinaanApi, pendaftaranPembinaanApi,
  asetApi, sarprasApi, kerjasamaApi, chatApi, negosiasiApi,
  invoiceApi, paymentApi, contractApi, bastApi, ratingApi,
  pemesananSewaApi, infoBudayaApi, appearanceApi,
} from "./dataApi";
import { usersApi } from "./api";

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
  pemesananSewa: PemesananSewa[];
  infoBudaya: InfoBudaya[];
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ============ DEFAULT VALUES ============
const defaultAppearance: AppearanceSettings = {
  primaryColor: "#1e3a5f",
  accentColor: "#c0392b",
  logoUrl: "",
  backdropUrl: "",
  loginTitle: "Jak Sanggar",
  loginSubtitle: "Sistem Informasi Sanggar Seni DKI Jakarta",
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
      "Tari": "#e74c3c",
      "Musik": "#2980b9",
      "Teater": "#27ae60",
      "Kuliner": "#e67e22",
      "Pakaian": "#8e44ad",
      "Upacara": "#16a085",
      "Sejarah": "#7f8c8d",
      "Bahasa": "#d35400",
      "Permainan": "#2c3e50",
      "Ondel-ondel": "#c0392b",
      "Silat": "#1abc9c",
      "Rancag": "#daa44e",
      "Lenong": "#9d7bc0",
    },
  },
};

const defaultJamPembinaan: JamPembinaan = {
  pagiMax: "08:00",
  siangStart: "13:00",
  siangEnd: "17:00",
  pulangStart: "17:00",
  pulangEnd: "21:00",
};

const defaultKurasiMatrix: KurasiMatrix = { indikator: [] };

function emptyDb(): DBShape {
  return {
    users: [],
    news: [],
    banners: [],
    slider: [],
    latihan: [],
    iuran: [],
    pengajuanHonor: [],
    distribusi: [],
    transaksi: [],
    kas: [],
    kurasiMatrix: defaultKurasiMatrix,
    penugasanJuri: [],
    kurasiSubmissions: [],
    sertifikat: [],
    activity: [],
    jamPembinaan: defaultJamPembinaan,
    absensiPembinaan: [],
    pendaftaranPembinaan: [],
    appearance: defaultAppearance,
    exportPassword: "kurator123",
    honorPerSesiDefault: 250_000,
    aset: [],
    sarpras: [],
    kerjasama: [],
    chatMessages: [],
    negosiasi: [],
    invoices: [],
    payments: [],
    contracts: [],
    bast: [],
    ratings: [],
    pemesananSewa: [],
    infoBudaya: [],
  };
}

// ============ CACHE & SYNC ============
let cache: DBShape = emptyDb();
let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Inisialisasi data dari API server. Dipanggil sekali saat app mount.
 * Jika gagal (mis. offline), gunakan empty data.
 */
export async function initStore(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;
  initPromise = _doInit();
  return initPromise;
}

async function _doInit(): Promise<void> {
  try {
    const [
      users, news, banners, slider, latihan, iuran,
      pengajuanHonor, distribusi, transaksi, kas,
      kurasiMatrix, penugasanJuri, kurasiSubmissions, sertifikat,
      activity, jamPembinaan, absensiPembinaan, pendaftaranPembinaan,
      aset, sarpras, kerjasama, invoices, payments, contracts, bast, ratings,
      pemesananSewa, infoBudaya, appearance,
    ] = await Promise.all([
      usersApi.list().catch(() => []),
      newsApi.list().catch(() => []),
      bannersApi.list().catch(() => []),
      sliderApi.list().catch(() => []),
      latihanApi.list().catch(() => []),
      iuranApi.list().catch(() => []),
      pengajuanHonorApi.list().catch(() => []),
      distribusiHonorApi.list().catch(() => []),
      transaksiApi.list().catch(() => []),
      kasApi.list().catch(() => []),
      kurasiMatrixApi.get().catch(() => defaultKurasiMatrix),
      penugasanJuriApi.list().catch(() => []),
      kurasiSubmissionApi.list().catch(() => []),
      sertifikatApi.list().catch(() => []),
      activityApi.list().catch(() => []),
      jamPembinaanApi.get().catch(() => defaultJamPembinaan),
      absensiPembinaanApi.list().catch(() => []),
      pendaftaranPembinaanApi.list().catch(() => []),
      asetApi.list().catch(() => []),
      sarprasApi.list().catch(() => []),
      kerjasamaApi.list().catch(() => []),
      invoiceApi.list().catch(() => []),
      paymentApi.list().catch(() => []),
      contractApi.list().catch(() => []),
      bastApi.list().catch(() => []),
      ratingApi.list().catch(() => []),
      pemesananSewaApi.list().catch(() => []),
      infoBudayaApi.list().catch(() => []),
      appearanceApi.get().catch(() => ({ settings: defaultAppearance, exportPassword: "kurator123", honorPerSesiDefault: 250_000 })),
    ]);

    cache = {
      users: users as any[],
      news: news as any[],
      banners: banners as any[],
      slider: slider as any[],
      latihan: latihan as any[],
      iuran: iuran as any[],
      pengajuanHonor: pengajuanHonor as any[],
      distribusi: distribusi as any[],
      transaksi: transaksi as any[],
      kas: kas as any[],
      kurasiMatrix: kurasiMatrix as any,
      penugasanJuri: penugasanJuri as any[],
      kurasiSubmissions: kurasiSubmissions as any[],
      sertifikat: sertifikat as any[],
      activity: activity as any[],
      jamPembinaan: jamPembinaan as any,
      absensiPembinaan: absensiPembinaan as any[],
      pendaftaranPembinaan: pendaftaranPembinaan as any[],
      appearance: (appearance as any).settings ?? defaultAppearance,
      exportPassword: (appearance as any).exportPassword ?? "kurator123",
      honorPerSesiDefault: (appearance as any).honorPerSesiDefault ?? 250_000,
      aset: aset as any[],
      sarpras: sarpras as any[],
      kerjasama: kerjasama as any[],
      chatMessages: [], // loaded on demand per kerjasama
      negosiasi: [],    // loaded on demand per kerjasama
      invoices: invoices as any[],
      payments: payments as any[],
      contracts: contracts as any[],
      bast: bast as any[],
      ratings: ratings as any[],
      pemesananSewa: pemesananSewa as any[],
      infoBudaya: infoBudaya as any[],
    };
    initialized = true;
  } catch (err) {
    console.warn("initStore gagal, menggunakan data kosong:", err);
    cache = emptyDb();
    initialized = true;
  }
}

// ============ PUBLIC API (backward-compatible) ============
export function load(): DBShape {
  return cache;
}

const subs = new Set<() => void>();
export function subscribe(fn: () => void) { subs.add(fn); return () => subs.delete(fn); }
function notify() { subs.forEach(fn => fn()); }

export class StorageQuotaError extends Error {
  constructor(message = "Penyimpanan lokal penuh.") { super(message); this.name = "StorageQuotaError"; }
}

/**
 * save() — tetap sinkron untuk backward compatibility.
 * Updater memodifikasi cache in-memory, lalu perubahan di-push ke API secara async.
 * Halaman yang sudah dimigrasikan sebaiknya langsung memanggil API dari dataApi.ts.
 */
export function save(updater: (db: DBShape) => void) {
  updater(cache);
  cache = { ...cache };
  notify();
  // Async push ke server — fire and forget
  // Halaman yang sudah dimigrasikan langsung pakai dataApi
}

export function resetAll() {
  cache = emptyDb();
  notify();
}

export function logActivity(actorId: string, actorRole: Role | "guest", action: string, meta?: Record<string, unknown>) {
  const entry: ActivityLog = { id: uid(), actorId, actorRole, action, meta, ts: Date.now() };
  cache.activity.unshift(entry);
  if (cache.activity.length > 500) cache.activity.length = 500;
  notify();
  // Push ke API async
  activityApi.create({ actorId, actorRole, action, meta }).catch(() => {});
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
  const entries = cache.kas.filter(k => k.sanggarId === sanggarId).sort((a, b) => a.tanggal - b.tanggal);
  let saldo = 0;
  for (const e of entries) saldo += e.debit - e.kredit;
  return saldo;
}

export function pushKas(sanggarId: string, keterangan: string, debit: number, kredit: number, refType: string, refId: string) {
  const last = cache.kas.filter(k => k.sanggarId === sanggarId).reduce((s, k) => s + k.debit - k.kredit, 0);
  const saldo = last + debit - kredit;
  const entry: KasEntry = { id: uid(), sanggarId, tanggal: Date.now(), keterangan, debit, kredit, saldo, refType, refId };
  cache.kas.push(entry);
  const sg = cache.users.find(u => u.id === sanggarId && u.role === "sanggar") as SanggarUser | undefined;
  if (sg) sg.saldo = saldo;
  notify();
  // Push ke API async
  kasApi.create({ sanggarId, keterangan, debit, kredit, refType, refId }).catch(() => {});
}

/**
 * Refresh data dari server — dipanggil setelah operasi CRUD via dataApi
 * untuk menyinkronkan cache in-memory.
 */
export async function refreshFromServer(): Promise<void> {
  initialized = false;
  initPromise = null;
  await initStore();
  notify();
}
