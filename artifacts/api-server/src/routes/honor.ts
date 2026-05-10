import { Router, type IRouter, type Request, type Response } from "express";
import { db, pengajuanHonorTable, distribusiHonorTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ============ PENGAJUAN HONOR ============
router.get("/pengajuan-honor", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, pelatihId } = req.query;
  const conds: any[] = [];
  if (sanggarId) conds.push(eq(pengajuanHonorTable.sanggarId, String(sanggarId)));
  if (pelatihId) conds.push(eq(pengajuanHonorTable.pelatihId, String(pelatihId)));
  const rows = await db.select().from(pengajuanHonorTable).where(and(...conds)).orderBy(desc(pengajuanHonorTable.createdAt));
  res.json(rows);
});

router.post("/pengajuan-honor", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, pelatihId, jumlahSesi, honorPerSesi, total } = req.body ?? {};
  if (!sanggarId || !pelatihId || !jumlahSesi || !honorPerSesi || !total) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(pengajuanHonorTable).values({
    sanggarId, pelatihId, jumlahSesi, honorPerSesi, total, status: "pending",
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/pengajuan-honor/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.buktiTransferUrl !== undefined) updates.buktiTransferUrl = req.body.buktiTransferUrl;
  if (req.body.status === "disetujui") updates.paidAt = new Date();
  const rows = await db.update(pengajuanHonorTable).set(updates).where(eq(pengajuanHonorTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

router.delete("/pengajuan-honor/:id", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.delete(pengajuanHonorTable).where(eq(pengajuanHonorTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

// ============ DISTRIBUSI HONOR ============
router.get("/distribusi-honor", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, penerimaId } = req.query;
  const conds: any[] = [];
  if (sanggarId) conds.push(eq(distribusiHonorTable.sanggarId, String(sanggarId)));
  if (penerimaId) conds.push(eq(distribusiHonorTable.penerimaId, String(penerimaId)));
  const rows = await db.select().from(distribusiHonorTable).where(and(...conds)).orderBy(desc(distribusiHonorTable.createdAt));
  res.json(rows);
});

router.post("/distribusi-honor", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, penerimaId, penerimaRole, judulJob, nominal } = req.body ?? {};
  if (!sanggarId || !penerimaId || !penerimaRole || !judulJob || !nominal) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(distribusiHonorTable).values({
    sanggarId, penerimaId, penerimaRole, judulJob, nominal, konfirmasi: false,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/distribusi-honor/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  if (req.body.konfirmasi !== undefined) updates.konfirmasi = req.body.konfirmasi;
  if (req.body.buktiTransferUrl !== undefined) updates.buktiTransferUrl = req.body.buktiTransferUrl;
  const rows = await db.update(distribusiHonorTable).set(updates).where(eq(distribusiHonorTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

export default router;
