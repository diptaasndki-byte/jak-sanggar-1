// =============================================================
// dataApi.ts — API client untuk semua modul data (menggantikan localStorage)
//
// Setiap modul memiliki fungsi CRUD yang memanggil backend API.
// Menggunakan apiFetch dari api.ts yang sudah ada.
// =============================================================
import { apiFetch } from "./api";

// ============ GENERIC HELPERS ============
function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries).toString();
}

// ============ NEWS ============
export const newsApi = {
  list: () => apiFetch<any[]>("/api/news"),
  create: (body: { judul: string; isi: string; imageUrl?: string }) =>
    apiFetch<any>("/api/news", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ judul: string; isi: string; imageUrl: string }>) =>
    apiFetch<any>(`/api/news/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/news/${id}`, { method: "DELETE" }),
};

// ============ BANNERS ============
export const bannersApi = {
  list: () => apiFetch<any[]>("/api/banners"),
  create: (body: { teks: string; start: string; end: string; active?: boolean }) =>
    apiFetch<any>("/api/banners", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ teks: string; start: string; end: string; active: boolean }>) =>
    apiFetch<any>(`/api/banners/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/banners/${id}`, { method: "DELETE" }),
};

// ============ SLIDER ============
export const sliderApi = {
  list: () => apiFetch<any[]>("/api/slider"),
  create: (body: { imageUrl: string; caption?: string }) =>
    apiFetch<any>("/api/slider", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/slider/${id}`, { method: "DELETE" }),
};

// ============ LATIHAN ============
export const latihanApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/latihan${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/latihan", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/latihan/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/latihan/${id}`, { method: "DELETE" }),
};

// ============ IURAN ============
export const iuranApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/iuran${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/iuran", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/iuran/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/iuran/${id}`, { method: "DELETE" }),
};

// ============ PENGAJUAN HONOR ============
export const pengajuanHonorApi = {
  list: (params?: { sanggarId?: string; pelatihId?: string }) =>
    apiFetch<any[]>(`/api/pengajuan-honor${qs(params ?? {})}`),
  create: (body: any) => apiFetch<any>("/api/pengajuan-honor", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/pengajuan-honor/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/pengajuan-honor/${id}`, { method: "DELETE" }),
};

// ============ DISTRIBUSI HONOR ============
export const distribusiHonorApi = {
  list: (params?: { sanggarId?: string; penerimaId?: string }) =>
    apiFetch<any[]>(`/api/distribusi-honor${qs(params ?? {})}`),
  create: (body: any) => apiFetch<any>("/api/distribusi-honor", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/distribusi-honor/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ KAS ============
export const kasApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/kas${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/kas", { method: "POST", body: JSON.stringify(body) }),
  recompute: (sanggarId: string) => apiFetch<{ saldo: number }>(`/api/kas/recompute/${sanggarId}`, { method: "POST" }),
  remove: (id: string) => apiFetch<null>(`/api/kas/${id}`, { method: "DELETE" }),
};

// ============ TRANSAKSI MANUAL ============
export const transaksiApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/transaksi${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/transaksi", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/transaksi/${id}`, { method: "DELETE" }),
};

// ============ KURASI MATRIX ============
export const kurasiMatrixApi = {
  get: () => apiFetch<any>("/api/kurasi-matrix"),
  update: (indikator: any) => apiFetch<any>("/api/kurasi-matrix", { method: "PUT", body: JSON.stringify({ indikator }) }),
};

// ============ PENUGASAN JURI ============
export const penugasanJuriApi = {
  list: (params?: { juriId?: string; sanggarId?: string }) =>
    apiFetch<any[]>(`/api/penugasan-juri${qs(params ?? {})}`),
  create: (body: any) => apiFetch<any>("/api/penugasan-juri", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/penugasan-juri/${id}`, { method: "DELETE" }),
};

// ============ KURASI SUBMISSIONS ============
export const kurasiSubmissionApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/kurasi-submissions${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/kurasi-submissions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/kurasi-submissions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ SERTIFIKAT ============
export const sertifikatApi = {
  list: (params?: { pemilikId?: string; sanggarId?: string }) =>
    apiFetch<any[]>(`/api/sertifikat${qs(params ?? {})}`),
  create: (body: any) => apiFetch<any>("/api/sertifikat", { method: "POST", body: JSON.stringify(body) }),
};

// ============ ACTIVITY ============
export const activityApi = {
  list: (limit?: number) => apiFetch<any[]>(`/api/activity${qs({ limit: limit?.toString() })}`),
  create: (body: { actorId: string; actorRole: string; action: string; meta?: any }) =>
    apiFetch<any>("/api/activity", { method: "POST", body: JSON.stringify(body) }),
  trim: () => apiFetch<{ ok: boolean }>("/api/activity/trim", { method: "POST" }),
};

// ============ JAM PEMBINAAN ============
export const jamPembinaanApi = {
  get: () => apiFetch<any>("/api/jam-pembinaan"),
  update: (body: any) => apiFetch<any>("/api/jam-pembinaan", { method: "PUT", body: JSON.stringify(body) }),
};

// ============ ABSENSI PEMBINAAN ============
export const absensiPembinaanApi = {
  list: (pesertaId?: string) => apiFetch<any[]>(`/api/absensi-pembinaan${qs({ pesertaId })}`),
  create: (body: any) => apiFetch<any>("/api/absensi-pembinaan", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/absensi-pembinaan/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ PENDAFTARAN PEMBINAAN ============
export const pendaftaranPembinaanApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/pendaftaran-pembinaan${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/pendaftaran-pembinaan", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/pendaftaran-pembinaan/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ ASET ============
export const asetApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/aset${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/aset", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/aset/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/aset/${id}`, { method: "DELETE" }),
};

// ============ SARPRAS ============
export const sarprasApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/sarpras${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/sarpras", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/sarpras/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/sarpras/${id}`, { method: "DELETE" }),
};

// ============ KERJASAMA ============
export const kerjasamaApi = {
  list: (sanggarId?: string) => apiFetch<any[]>(`/api/kerjasama${qs({ sanggarId })}`),
  create: (body: any) => apiFetch<any>("/api/kerjasama", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/kerjasama/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ CHAT MESSAGES ============
export const chatApi = {
  list: (kerjasamaId: string) => apiFetch<any[]>(`/api/chat-messages${qs({ kerjasamaId })}`),
  create: (body: any) => apiFetch<any>("/api/chat-messages", { method: "POST", body: JSON.stringify(body) }),
};

// ============ NEGOSIASI ============
export const negosiasiApi = {
  list: (kerjasamaId: string) => apiFetch<any[]>(`/api/negosiasi${qs({ kerjasamaId })}`),
  create: (body: any) => apiFetch<any>("/api/negosiasi", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/negosiasi/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ INVOICES ============
export const invoiceApi = {
  list: (kerjasamaId?: string) => apiFetch<any[]>(`/api/invoices${qs({ kerjasamaId })}`),
  create: (body: any) => apiFetch<any>("/api/invoices", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/invoices/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ PAYMENTS ============
export const paymentApi = {
  list: (invoiceId?: string) => apiFetch<any[]>(`/api/payments${qs({ invoiceId })}`),
  create: (body: any) => apiFetch<any>("/api/payments", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/payments/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ CONTRACTS ============
export const contractApi = {
  list: (kerjasamaId?: string) => apiFetch<any[]>(`/api/contracts${qs({ kerjasamaId })}`),
  create: (body: any) => apiFetch<any>("/api/contracts", { method: "POST", body: JSON.stringify(body) }),
};

// ============ BAST ============
export const bastApi = {
  list: (kerjasamaId?: string) => apiFetch<any[]>(`/api/bast${qs({ kerjasamaId })}`),
  create: (body: any) => apiFetch<any>("/api/bast", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/bast/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ RATINGS ============
export const ratingApi = {
  list: (kerjasamaId?: string) => apiFetch<any[]>(`/api/ratings${qs({ kerjasamaId })}`),
  create: (body: any) => apiFetch<any>("/api/ratings", { method: "POST", body: JSON.stringify(body) }),
};

// ============ PEMESANAN SEWA ============
export const pemesananSewaApi = {
  list: (params?: { sewaId?: string; sanggarId?: string; sdmUserId?: string }) =>
    apiFetch<any[]>(`/api/pemesanan-sewa${qs(params ?? {})}`),
  create: (body: any) => apiFetch<any>("/api/pemesanan-sewa", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/pemesanan-sewa/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

// ============ INFO BUDAYA ============
export const infoBudayaApi = {
  list: () => apiFetch<any[]>("/api/info-budaya"),
  create: (body: any) => apiFetch<any>("/api/info-budaya", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: any) => apiFetch<any>(`/api/info-budaya/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => apiFetch<null>(`/api/info-budaya/${id}`, { method: "DELETE" }),
};

// ============ APPEARANCE ============
export const appearanceApi = {
  get: () => apiFetch<any>("/api/appearance"),
  update: (body: any) => apiFetch<any>("/api/appearance", { method: "PUT", body: JSON.stringify(body) }),
};
