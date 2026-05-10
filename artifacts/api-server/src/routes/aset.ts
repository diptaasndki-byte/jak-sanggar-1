import { Router, type IRouter, type Request, type Response } from "express";
import { db, asetTable, sarprasTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ============ ASET ============
router.get("/aset", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  const conds = sanggarId ? [eq(asetTable.sanggarId, String(sanggarId))] : [];
  const rows = await db.select().from(asetTable).where(and(...conds)).orderBy(desc(asetTable.createdAt));
  res.json(rows);
});

router.post("/aset", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.sanggarId || !b.nama || !b.kategori) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(asetTable).values({
    sanggarId: b.sanggarId, kategori: b.kategori, nama: b.nama,
    jenis: b.jenis ?? "", jumlahTotal: b.jumlahTotal ?? 1,
    jumlahTersedia: b.jumlahTersedia ?? 1, kondisi: b.kondisi ?? "baik",
    fotoUrl: b.fotoUrl || null, hargaSewa: b.hargaSewa ?? 0,
    satuanHarga: b.satuanHarga ?? "per_hari",
    statusPublish: b.statusPublish ?? false,
    akomodasiPP: b.akomodasiPP ?? "diluar",
    biayaAkomodasi: b.biayaAkomodasi ?? 0,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/aset/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const b = req.body ?? {};
  const updates: Record<string, unknown> = {};
  const fields = ["kategori", "nama", "jenis", "jumlahTotal", "jumlahTersedia",
    "kondisi", "fotoUrl", "hargaSewa", "satuanHarga", "statusPublish",
    "akomodasiPP", "biayaAkomodasi"];
  for (const f of fields) { if (b[f] !== undefined) updates[f] = b[f]; }
  const rows = await db.update(asetTable).set(updates).where(eq(asetTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

router.delete("/aset/:id", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.delete(asetTable).where(eq(asetTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

// ============ SARPRAS ============
router.get("/sarpras", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  const conds = sanggarId ? [eq(sarprasTable.sanggarId, String(sanggarId))] : [];
  const rows = await db.select().from(sarprasTable).where(and(...conds)).orderBy(desc(sarprasTable.createdAt));
  res.json(rows);
});

router.post("/sarpras", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.sanggarId || !b.namaTempat || !b.jenisTempat) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(sarprasTable).values({
    sanggarId: b.sanggarId, namaTempat: b.namaTempat,
    jenisTempat: b.jenisTempat, kapasitas: b.kapasitas ?? 0,
    fasilitas: b.fasilitas ?? "", alamat: b.alamat ?? "",
    fotoUrl: b.fotoUrl || null, hargaSewa: b.hargaSewa ?? 0,
    satuanHarga: b.satuanHarga ?? "per_jam",
    statusPublish: b.statusPublish ?? false,
    akomodasiPP: b.akomodasiPP ?? "diluar",
    biayaAkomodasi: b.biayaAkomodasi ?? 0,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/sarpras/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const b = req.body ?? {};
  const updates: Record<string, unknown> = {};
  const fields = ["namaTempat", "jenisTempat", "kapasitas", "fasilitas",
    "alamat", "fotoUrl", "hargaSewa", "satuanHarga", "statusPublish",
    "akomodasiPP", "biayaAkomodasi"];
  for (const f of fields) { if (b[f] !== undefined) updates[f] = b[f]; }
  const rows = await db.update(sarprasTable).set(updates).where(eq(sarprasTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

router.delete("/sarpras/:id", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.delete(sarprasTable).where(eq(sarprasTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

export default router;
