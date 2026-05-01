// =============================================================
// sewa-flow.ts
//
// Semua aksi alur "Pemesanan Sewa Jasa" (penyewa eksternal -> sanggar
// -> seniman/pelatih) berada di sini, terpisah dari kerjasama antar
// sanggar (lib/kerjasama.ts).
//
// Lifecycle status & otoritas:
//   menunggu_sanggar  -> sanggar (penyedia) dapat: terima/tolak/assign
//   menunggu_sdm      -> seniman/pelatih yang ditugaskan: terima/tolak
//   menunggu_ttd      -> ke-3 (atau ke-2 untuk barang/tempat) pihak
//                        klik "Setuju" -> begitu lengkap auto-pindah
//                        ke kontrak_aktif
//   kontrak_aktif     -> sanggar (penyedia) menerbitkan invoice
//   menunggu_bayar    -> penyewa upload bukti bayar
//   lunas             -> sanggar verifikasi bukti -> menunggu BAST
//   selesai           -> BAST difinalkan (penyedia)
//   ditolak / batal   -> alur dihentikan; tidak ada transisi keluar.
// =============================================================

import type {
  AnyUser, PelatihUser, SenimanUser, SanggarUser, SewaUser,
  PemesananSewa, PemesananSewaStatus, PihakSewa, TandaTanganSewa,
  Invoice, Payment, Bast, Role, AkomodasiMode, KerjasamaSumber,
} from "./types";
import { load, save, uid, logActivity, pushKas } from "./store";
import type { KatalogItem } from "./kerjasama";
import { getKatalogItem } from "./kerjasama";

type Actor = { id: string; role: Role };

// Counter penomoran (in-memory; identik gaya dengan kerjasama.ts).
let counter = 1;
function genNomor(prefix: string) {
  const y = new Date().getFullYear();
  const seq = String(counter++).padStart(3, "0");
  return `${prefix}/${y}/${Date.now().toString().slice(-4)}${seq}`;
}

// ============= LABEL & UTIL =============

export const STATUS_PEMESANAN_LABEL: Record<PemesananSewaStatus, string> = {
  menunggu_sanggar: "Menunggu Sanggar",
  menunggu_sdm: "Menunggu Seniman/Pelatih",
  menunggu_ttd: "Menunggu Tanda Tangan",
  kontrak_aktif: "Kontrak Aktif",
  menunggu_bayar: "Menunggu Pembayaran",
  lunas: "Lunas — Menunggu BAST",
  selesai: "Selesai",
  ditolak: "Ditolak",
  batal: "Dibatalkan",
};

export const STATUS_PEMESANAN_COLOR: Record<PemesananSewaStatus, string> = {
  menunggu_sanggar: "bg-amber-100 text-amber-800 border-amber-300",
  menunggu_sdm:     "bg-orange-100 text-orange-800 border-orange-300",
  menunggu_ttd:     "bg-sky-100 text-sky-800 border-sky-300",
  kontrak_aktif:    "bg-indigo-100 text-indigo-800 border-indigo-300",
  menunggu_bayar:   "bg-violet-100 text-violet-800 border-violet-300",
  lunas:            "bg-emerald-100 text-emerald-800 border-emerald-300",
  selesai:          "bg-emerald-200 text-emerald-900 border-emerald-400",
  ditolak:          "bg-rose-100 text-rose-800 border-rose-300",
  batal:            "bg-zinc-200 text-zinc-700 border-zinc-300",
};

export const AKOMODASI_LABEL: Record<AkomodasiMode, string> = {
  termasuk: "Termasuk akomodasi PP",
  diluar:   "Di luar akomodasi PP",
};

// Pihak yang wajib ttd untuk satu pemesanan, sesuai kategori sumber.
export function pihakWajib(p: PemesananSewa): PihakSewa[] {
  const isSdm = p.sumberType === "sdm-pelatih" || p.sumberType === "sdm-seniman";
  return isSdm ? ["sewa", "sanggar", "sdm"] : ["sewa", "sanggar"];
}

export function sudahTtd(p: PemesananSewa, pihak: PihakSewa): boolean {
  return p.ttd.some(t => t.pihak === pihak);
}

export function semuaSudahTtd(p: PemesananSewa): boolean {
  return pihakWajib(p).every(pihak => sudahTtd(p, pihak));
}

export function progressTtd(p: PemesananSewa): { selesai: number; total: number } {
  const wajib = pihakWajib(p);
  return { selesai: wajib.filter(pihak => sudahTtd(p, pihak)).length, total: wajib.length };
}

// Default akomodasi & biaya akomodasi dari item katalog.
export function defaultAkomodasi(item: KatalogItem): { mode: AkomodasiMode; biaya: number } {
  const db = load();
  let mode: AkomodasiMode = "diluar";
  let biaya = 0;
  if (item.sumberType === "sdm-pelatih") {
    const u = db.users.find(x => x.id === item.sumberId) as PelatihUser | undefined;
    if (u) { mode = u.akomodasiPP ?? "diluar"; biaya = u.biayaAkomodasi ?? 0; }
  } else if (item.sumberType === "sdm-seniman") {
    const u = db.users.find(x => x.id === item.sumberId) as SenimanUser | undefined;
    if (u) { mode = u.akomodasiPP ?? "diluar"; biaya = u.biayaAkomodasi ?? 0; }
  } else if (item.sumberType === "aset") {
    const a = db.aset.find(x => x.id === item.sumberId);
    if (a) { mode = a.akomodasiPP ?? "diluar"; biaya = a.biayaAkomodasi ?? 0; }
  } else if (item.sumberType === "sarpras") {
    // Tempat fisik biasanya tidak butuh akomodasi PP, tapi sanggar
    // tetap boleh menyetel default.
    const s = db.sarpras.find(x => x.id === item.sumberId);
    if (s) { mode = s.akomodasiPP ?? "termasuk"; biaya = s.biayaAkomodasi ?? 0; }
  }
  return { mode, biaya };
}

export function hitungTotal(input: {
  hargaDasar: number; jumlah: number;
  akomodasiPP: AkomodasiMode; biayaAkomodasi: number;
}): number {
  const subtotal = input.hargaDasar * Math.max(1, input.jumlah);
  const tambahan = input.akomodasiPP === "termasuk" ? 0 : Math.max(0, input.biayaAkomodasi);
  return subtotal + tambahan;
}

// ============= AUTHORIZATION =============

function isPenyedia(p: PemesananSewa, actor: Actor) {
  return actor.role === "sanggar" && p.sanggarId === actor.id;
}
function isPenyewa(p: PemesananSewa, actor: Actor) {
  return actor.role === "sewa" && p.sewaId === actor.id;
}
function isSdmTertugas(p: PemesananSewa, actor: Actor) {
  return (actor.role === "pelatih" || actor.role === "seniman") && p.sdmUserId === actor.id;
}
function isInvolved(p: PemesananSewa, actor: Actor) {
  if (actor.role === "kurator") return true;
  return isPenyedia(p, actor) || isPenyewa(p, actor) || isSdmTertugas(p, actor);
}

// ============= QUERY HELPERS =============

export function listPemesananForActor(actor: Actor): PemesananSewa[] {
  const db = load();
  return db.pemesananSewa.filter(p => {
    if (actor.role === "kurator") return true;
    if (actor.role === "sewa") return p.sewaId === actor.id;
    if (actor.role === "sanggar") return p.sanggarId === actor.id;
    if (actor.role === "pelatih" || actor.role === "seniman") return p.sdmUserId === actor.id;
    return false;
  });
}

// ============= ACTIONS =============

export interface CreatePemesananInput {
  katalog: KatalogItem;
  sewaId: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  jumlah: number;
  catatan: string;
  akomodasiPP: AkomodasiMode;
  biayaAkomodasi: number;
  actor: Actor;
}

export function createPemesanan(input: CreatePemesananInput): { ok: boolean; reason?: string; pemesanan?: PemesananSewa } {
  if (input.actor.role !== "sewa" || input.actor.id !== input.sewaId) {
    return { ok: false, reason: "Hanya akun penyewa yang dapat membuat pesanan." };
  }
  if (input.jumlah <= 0) return { ok: false, reason: "Jumlah tidak valid." };
  if (!input.tanggalMulai || !input.tanggalSelesai) return { ok: false, reason: "Tanggal wajib diisi." };
  if (input.tanggalMulai > input.tanggalSelesai) return { ok: false, reason: "Tanggal mulai harus sebelum tanggal selesai." };
  if (!input.lokasi.trim()) return { ok: false, reason: "Lokasi acara wajib diisi." };

  // Re-resolve katalog dari DB agar tidak terpengaruh snapshot lama / payload tampered.
  const fresh = getKatalogItem(input.katalog.id);
  if (!fresh) {
    return { ok: false, reason: "Item sudah tidak tersedia di katalog." };
  }
  // Pastikan identitas inti tidak berubah.
  if (
    fresh.sanggarId !== input.katalog.sanggarId ||
    fresh.sumberId !== input.katalog.sumberId ||
    fresh.sumberType !== input.katalog.sumberType ||
    fresh.kategori !== input.katalog.kategori
  ) {
    return { ok: false, reason: "Item katalog telah berubah, silakan muat ulang." };
  }
  // Penyewa tidak boleh mengirim biaya akomodasi negatif.
  if (input.biayaAkomodasi < 0) return { ok: false, reason: "Biaya akomodasi tidak valid." };

  const total = hitungTotal({
    hargaDasar: fresh.hargaSewa,
    jumlah: input.jumlah,
    akomodasiPP: input.akomodasiPP,
    biayaAkomodasi: input.biayaAkomodasi,
  });

  // Untuk sumber SDM, kalau item katalog spesifik ke seseorang
  // (sumberType "sdm-pelatih"/"sdm-seniman"), assign langsung.
  let sdmUserId: string | undefined;
  if (fresh.sumberType === "sdm-pelatih" || fresh.sumberType === "sdm-seniman") {
    sdmUserId = fresh.sumberId;
  }

  const p: PemesananSewa = {
    id: uid(),
    nomor: genNomor("SEWA"),
    katalogItemId: fresh.id,
    sumberType: fresh.sumberType as KerjasamaSumber,
    sumberId: fresh.sumberId,
    sewaId: input.sewaId,
    sanggarId: fresh.sanggarId,
    sdmUserId,
    judul: fresh.judul,
    kategori: fresh.kategori,
    tanggalMulai: input.tanggalMulai,
    tanggalSelesai: input.tanggalSelesai,
    lokasi: input.lokasi,
    jumlah: input.jumlah,
    satuanHarga: fresh.satuanHarga,
    catatan: input.catatan,
    hargaDasar: fresh.hargaSewa,
    akomodasiPP: input.akomodasiPP,
    biayaAkomodasi: input.biayaAkomodasi,
    nilaiTotal: total,
    status: "menunggu_sanggar",
    ttd: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  save(db => { db.pemesananSewa.unshift(p); });
  logActivity(input.actor.id, input.actor.role, "pemesanan-create", { nomor: p.nomor });
  return { ok: true, pemesanan: p };
}

// Sanggar: tolak pesanan.
export function tolakPemesanan(id: string, alasan: string, actor: Actor): { ok: boolean; reason?: string } {
  let result: { ok: boolean; reason?: string } = { ok: false };
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === id);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (!isPenyedia(p, actor)) { result = { ok: false, reason: "Hanya sanggar penyedia yang dapat menolak." }; return; }
    if (!["menunggu_sanggar", "menunggu_sdm"].includes(p.status)) {
      result = { ok: false, reason: "Status saat ini tidak bisa ditolak." }; return;
    }
    p.status = "ditolak";
    p.alasanTolak = alasan;
    p.updatedAt = Date.now();
    result = { ok: true };
  });
  if (result.ok) logActivity(actor.id, actor.role, "pemesanan-tolak", { id });
  return result;
}

// Penyewa: batalkan pesanan (selama belum jalan).
export function batalkanPemesanan(id: string, actor: Actor): { ok: boolean; reason?: string } {
  let result: { ok: boolean; reason?: string } = { ok: false };
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === id);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (!isPenyewa(p, actor)) { result = { ok: false, reason: "Hanya penyewa yang dapat membatalkan." }; return; }
    // Hanya boleh batal sebelum kontrak aktif / invoice terbit.
    const bolehBatal: PemesananSewa["status"][] = ["menunggu_sanggar", "menunggu_sdm", "menunggu_ttd"];
    if (!bolehBatal.includes(p.status)) {
      result = { ok: false, reason: "Pesanan tidak bisa dibatalkan setelah kontrak aktif. Silakan koordinasi dengan sanggar." }; return;
    }
    p.status = "batal";
    p.updatedAt = Date.now();
    result = { ok: true };
  });
  if (result.ok) logActivity(actor.id, actor.role, "pemesanan-batal", { id });
  return result;
}

// Sanggar: terima pesanan. Untuk SDM yg belum ada sdmUserId (jarang),
// bisa pass `assignSdmUserId` untuk menugaskan seniman/pelatih spesifik.
export function terimaPemesanan(input: {
  id: string; assignSdmUserId?: string; actor: Actor;
}): { ok: boolean; reason?: string } {
  let result: { ok: boolean; reason?: string } = { ok: false };
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === input.id);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (!isPenyedia(p, input.actor)) { result = { ok: false, reason: "Hanya sanggar penyedia yang dapat menerima." }; return; }
    if (p.status !== "menunggu_sanggar") { result = { ok: false, reason: "Pesanan sudah diproses." }; return; }
    const isSdm = p.sumberType === "sdm-pelatih" || p.sumberType === "sdm-seniman";
    if (isSdm) {
      const target = input.assignSdmUserId ?? p.sdmUserId;
      if (!target) { result = { ok: false, reason: "Seniman/pelatih wajib ditugaskan terlebih dahulu." }; return; }
      // Validasi bahwa target benar-benar anggota sanggar ini.
      const u = db.users.find(x => x.id === target);
      if (!u) { result = { ok: false, reason: "SDM tidak ditemukan." }; return; }
      if (u.role !== "pelatih" && u.role !== "seniman") { result = { ok: false, reason: "Hanya pelatih/seniman yang dapat ditugaskan." }; return; }
      const member = u as PelatihUser | SenimanUser;
      if (member.sanggarId !== p.sanggarId) { result = { ok: false, reason: "SDM bukan anggota sanggar ini." }; return; }
      p.sdmUserId = target;
      p.status = "menunggu_sdm";
    } else {
      // Bukan SDM -> langsung lompat ke menunggu_ttd (penyewa & sanggar).
      p.status = "menunggu_ttd";
    }
    p.updatedAt = Date.now();
    result = { ok: true };
  });
  if (result.ok) logActivity(input.actor.id, input.actor.role, "pemesanan-terima", { id: input.id });
  return result;
}

// Seniman/Pelatih: konfirmasi penugasan.
export function konfirmasiSdm(id: string, terima: boolean, alasan: string | undefined, actor: Actor): { ok: boolean; reason?: string } {
  let result: { ok: boolean; reason?: string } = { ok: false };
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === id);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (!isSdmTertugas(p, actor)) { result = { ok: false, reason: "Anda bukan SDM yang ditugaskan untuk pesanan ini." }; return; }
    if (p.status !== "menunggu_sdm") { result = { ok: false, reason: "Status pesanan tidak menunggu konfirmasi SDM." }; return; }
    if (terima) {
      p.status = "menunggu_ttd";
    } else {
      p.status = "ditolak";
      p.alasanTolak = alasan ?? "Ditolak oleh seniman/pelatih.";
    }
    p.updatedAt = Date.now();
    result = { ok: true };
  });
  if (result.ok) logActivity(actor.id, actor.role, "pemesanan-sdm-konfirm", { id, terima });
  return result;
}

// Tanda tangan ("Setuju") salah satu pihak.
export function tandaTangan(input: { id: string; actor: Actor }): { ok: boolean; reason?: string; semuaTtd?: boolean } {
  let result: { ok: boolean; reason?: string; semuaTtd?: boolean } = { ok: false };
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === input.id);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (p.status !== "menunggu_ttd") { result = { ok: false, reason: "Belum siap ditandatangani." }; return; }
    let pihak: PihakSewa | null = null;
    let nama = "";
    if (isPenyewa(p, input.actor)) {
      pihak = "sewa";
      const u = db.users.find(x => x.id === input.actor.id) as SewaUser | undefined;
      nama = u?.nama ?? "Penyewa";
    } else if (isPenyedia(p, input.actor)) {
      pihak = "sanggar";
      const u = db.users.find(x => x.id === input.actor.id) as SanggarUser | undefined;
      nama = u?.namaSanggar ?? "Sanggar";
    } else if (isSdmTertugas(p, input.actor)) {
      pihak = "sdm";
      const u = db.users.find(x => x.id === input.actor.id) as PelatihUser | SenimanUser | undefined;
      nama = u?.nama ?? "Seniman/Pelatih";
    }
    if (!pihak) { result = { ok: false, reason: "Anda bukan pihak yang berwenang menandatangani." }; return; }
    // Pihak SDM tidak boleh ttd untuk pesanan non-SDM.
    if (pihak === "sdm" && !pihakWajib(p).includes("sdm")) {
      result = { ok: false, reason: "Pesanan ini tidak melibatkan SDM." }; return;
    }
    if (sudahTtd(p, pihak)) { result = { ok: false, reason: "Anda sudah menandatangani." }; return; }
    const t: TandaTanganSewa = { pihak, userId: input.actor.id, nama, ts: Date.now() };
    p.ttd.push(t);
    // Auto-promote ke kontrak_aktif kalau semua pihak sudah TTD.
    const lengkap = pihakWajib(p).every(pi => p.ttd.some(x => x.pihak === pi));
    if (lengkap) p.status = "kontrak_aktif";
    p.updatedAt = Date.now();
    result = { ok: true, semuaTtd: lengkap };
  });
  if (result.ok) logActivity(input.actor.id, input.actor.role, "pemesanan-ttd", { id: input.id });
  return result;
}

// Sanggar: terbitkan invoice (setelah kontrak aktif).
export function terbitkanInvoice(id: string, dueDays: number, actor: Actor): { ok: boolean; reason?: string; invoice?: Invoice } {
  let result: { ok: boolean; reason?: string; invoice?: Invoice } = { ok: false };
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === id);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (!isPenyedia(p, actor)) { result = { ok: false, reason: "Hanya sanggar penyedia yang dapat menerbitkan invoice." }; return; }
    if (p.status !== "kontrak_aktif") { result = { ok: false, reason: "Kontrak belum aktif." }; return; }
    if (p.invoiceId) { result = { ok: false, reason: "Invoice sudah pernah diterbitkan." }; return; }
    const inv: Invoice = {
      id: uid(),
      // Re-use Invoice; field "kerjasamaId" kita pakai untuk menyimpan
      // pemesananSewa.id (skema generik 1 invoice per pesanan).
      kerjasamaId: p.id,
      nomor: genNomor("INV"),
      total: p.nilaiTotal,
      status: "terhutang",
      batasPembayaran: Date.now() + Math.max(1, dueDays) * 86400000,
      createdAt: Date.now(),
    };
    db.invoices.unshift(inv);
    p.invoiceId = inv.id;
    p.status = "menunggu_bayar";
    p.updatedAt = Date.now();
    result = { ok: true, invoice: inv };
  });
  if (result.ok) logActivity(actor.id, actor.role, "pemesanan-invoice", { id });
  return result;
}

// Penyewa: upload bukti pembayaran.
export function uploadBuktiBayar(input: {
  pemesananId: string; nominal: number; tanggalBayar: number; buktiDataUrl?: string;
  actor: Actor;
}): { ok: boolean; reason?: string; payment?: Payment } {
  let result: { ok: boolean; reason?: string; payment?: Payment } = { ok: false };
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === input.pemesananId);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (!isPenyewa(p, input.actor)) { result = { ok: false, reason: "Hanya penyewa yang dapat mengirim bukti bayar." }; return; }
    if (p.status !== "menunggu_bayar" || !p.invoiceId) { result = { ok: false, reason: "Belum siap pembayaran." }; return; }
    const inv = db.invoices.find(i => i.id === p.invoiceId);
    if (!inv) { result = { ok: false, reason: "Invoice tidak ditemukan." }; return; }
    if (inv.status === "lunas") { result = { ok: false, reason: "Invoice sudah lunas." }; return; }
    if (input.nominal <= 0) { result = { ok: false, reason: "Nominal tidak valid." }; return; }
    if (!input.buktiDataUrl) { result = { ok: false, reason: "Bukti pembayaran wajib diunggah." }; return; }
    if (db.payments.some(x => x.invoiceId === inv.id && (x.status === "menunggu" || x.status === "disetujui"))) {
      result = { ok: false, reason: "Sudah ada bukti bayar yang menunggu/disetujui." }; return;
    }
    const pay: Payment = {
      id: uid(),
      invoiceId: inv.id,
      nominal: input.nominal,
      tanggalBayar: input.tanggalBayar,
      buktiDataUrl: input.buktiDataUrl,
      status: "menunggu",
      createdAt: Date.now(),
    };
    db.payments.unshift(pay);
    result = { ok: true, payment: pay };
  });
  if (result.ok) logActivity(input.actor.id, input.actor.role, "pemesanan-bayar", { id: input.pemesananId });
  return result;
}

// Sanggar: verifikasi pembayaran.
export function verifikasiPembayaran(input: {
  pemesananId: string; paymentId: string; terima: boolean; catatan?: string; actor: Actor;
}): { ok: boolean; reason?: string } {
  let result: { ok: boolean; reason?: string } = { ok: false };
  let kasInfo: { sanggarId: string; sewaId: string; total: number; nomor: string; pemesananId: string } | null = null;
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === input.pemesananId);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (!isPenyedia(p, input.actor)) { result = { ok: false, reason: "Hanya sanggar penyedia yang dapat memverifikasi." }; return; }
    const pay = db.payments.find(x => x.id === input.paymentId);
    if (!pay) { result = { ok: false, reason: "Pembayaran tidak ditemukan." }; return; }
    if (pay.status !== "menunggu") { result = { ok: false, reason: "Pembayaran sudah diproses." }; return; }
    const inv = db.invoices.find(i => i.id === pay.invoiceId);
    if (!inv || inv.id !== p.invoiceId) { result = { ok: false, reason: "Invoice tidak cocok." }; return; }
    if (input.terima && pay.nominal < inv.total) {
      result = { ok: false, reason: `Nominal kurang (Rp${pay.nominal} < Rp${inv.total}).` }; return;
    }
    pay.status = input.terima ? "disetujui" : "ditolak";
    pay.catatanVerifikator = input.catatan;
    if (input.terima) {
      inv.status = "lunas";
      p.status = "lunas";
      p.updatedAt = Date.now();
      kasInfo = { sanggarId: p.sanggarId, sewaId: p.sewaId, total: inv.total, nomor: p.nomor, pemesananId: p.id };
    }
    result = { ok: true };
  });
  const ki = kasInfo as { sanggarId: string; sewaId: string; total: number; nomor: string; pemesananId: string } | null;
  if (ki) {
    pushKas(ki.sanggarId, `Pembayaran sewa ${ki.nomor}`, ki.total, 0, "pemesanan-in", ki.pemesananId);
  }
  if (result.ok) logActivity(input.actor.id, input.actor.role, "pemesanan-verifikasi", { id: input.pemesananId, terima: input.terima });
  return result;
}

// Sanggar: finalisasi BAST -> selesai.
export function finalkanBast(id: string, actor: Actor): { ok: boolean; reason?: string; bast?: Bast } {
  let result: { ok: boolean; reason?: string; bast?: Bast } = { ok: false };
  save(db => {
    const p = db.pemesananSewa.find(x => x.id === id);
    if (!p) { result = { ok: false, reason: "Pesanan tidak ditemukan." }; return; }
    if (!isPenyedia(p, actor)) { result = { ok: false, reason: "Hanya sanggar penyedia yang dapat memfinalkan BAST." }; return; }
    if (p.status !== "lunas") { result = { ok: false, reason: "Status pesanan belum lunas." }; return; }
    let bast = p.bastId ? db.bast.find(b => b.id === p.bastId) : undefined;
    if (!bast) {
      bast = { id: uid(), kerjasamaId: p.id, nomor: genNomor("BAST"), status: "final", createdAt: Date.now(), finalAt: Date.now() };
      db.bast.unshift(bast);
      p.bastId = bast.id;
    } else {
      bast.status = "final";
      bast.finalAt = Date.now();
    }
    p.status = "selesai";
    p.updatedAt = Date.now();
    result = { ok: true, bast };
  });
  if (result.ok) logActivity(actor.id, actor.role, "pemesanan-bast", { id });
  return result;
}

// Lookup nama pihak (untuk UI kontrak).
export function namaPihak(p: PemesananSewa, pihak: PihakSewa): string {
  const db = load();
  if (pihak === "sewa") {
    const u = db.users.find(x => x.id === p.sewaId) as SewaUser | undefined;
    return u?.nama ?? "Penyewa";
  }
  if (pihak === "sanggar") {
    const u = db.users.find(x => x.id === p.sanggarId) as SanggarUser | undefined;
    return u?.namaSanggar ?? "Sanggar";
  }
  if (pihak === "sdm") {
    if (!p.sdmUserId) return "Belum ditugaskan";
    const u = db.users.find(x => x.id === p.sdmUserId) as PelatihUser | SenimanUser | undefined;
    return u?.nama ?? "Seniman/Pelatih";
  }
  return "-";
}

// Lookup user record yang memesan / penyedia / SDM.
export function pihakUser(p: PemesananSewa, pihak: PihakSewa): AnyUser | undefined {
  const db = load();
  if (pihak === "sewa") return db.users.find(x => x.id === p.sewaId);
  if (pihak === "sanggar") return db.users.find(x => x.id === p.sanggarId);
  if (pihak === "sdm" && p.sdmUserId) return db.users.find(x => x.id === p.sdmUserId);
  return undefined;
}
