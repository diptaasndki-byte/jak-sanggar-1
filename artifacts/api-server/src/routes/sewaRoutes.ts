import { Router, type IRouter, type Request, type Response } from "express";
import { db, pemesananSewaTable } from "@workspace/db";
import { eq, desc, and, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/pemesanan-sewa", requireAuth, async (req: Request, res: Response) => {
  const { sewaId, sanggarId, sdmUserId } = req.query;
  const conds: any[] = [];
  if (sewaId) conds.push(eq(pemesananSewaTable.sewaId, String(sewaId)));
  if (sanggarId) conds.push(eq(pemesananSewaTable.sanggarId, String(sanggarId)));
  if (sdmUserId) conds.push(eq(pemesananSewaTable.sdmUserId, String(sdmUserId)));
  const rows = await db.select().from(pemesananSewaTable).where(and(...conds)).orderBy(desc(pemesananSewaTable.createdAt));
  res.json(rows);
});

router.post("/pemesanan-sewa", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.nomor || !b.sewaId || !b.sanggarId) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(pemesananSewaTable).values({
    nomor: b.nomor,
    katalogItemId: b.katalogItemId ?? "",
    sumberType: b.sumberType ?? "",
    sumberId: b.sumberId ?? "",
    sewaId: b.sewaId,
    sanggarId: b.sanggarId,
    sdmUserId: b.sdmUserId || null,
    judul: b.judul ?? "",
    kategori: b.kategori ?? "",
    tanggalMulai: b.tanggalMulai ?? "",
    tanggalSelesai: b.tanggalSelesai ?? "",
    lokasi: b.lokasi ?? "",
    jumlah: b.jumlah ?? 1,
    satuanHarga: b.satuanHarga ?? "per_hari",
    catatan: b.catatan ?? "",
    hargaDasar: b.hargaDasar ?? 0,
    akomodasiPP: b.akomodasiPP ?? "diluar",
    biayaAkomodasi: b.biayaAkomodasi ?? 0,
    nilaiTotal: b.nilaiTotal ?? 0,
    status: "menunggu_sanggar",
    ttd: b.ttd ?? [],
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/pemesanan-sewa/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const b = req.body ?? {};
  const updates: Record<string, unknown> = {};
  const fields = ["status", "sdmUserId", "alasanTolak", "ttd",
    "invoiceId", "bastId", "nilaiTotal"];
  for (const f of fields) { if (b[f] !== undefined) updates[f] = b[f]; }
  const rows = await db.update(pemesananSewaTable).set(updates).where(eq(pemesananSewaTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

export default router;
