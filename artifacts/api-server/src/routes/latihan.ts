import { Router, type IRouter, type Request, type Response } from "express";
import { db, latihanTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// List latihan — filter by sanggarId (query param)
router.get("/latihan", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  const conds = sanggarId ? [eq(latihanTable.sanggarId, String(sanggarId))] : [];
  const rows = await db.select().from(latihanTable).where(and(...conds)).orderBy(desc(latihanTable.createdAt));
  res.json(rows);
});

// Create latihan
router.post("/latihan", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, tanggal, jam, tempat, kurikulum, ciriAdat, pelatihId } = req.body ?? {};
  if (!sanggarId || !tanggal || !jam || !tempat) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(latihanTable).values({
    sanggarId, tanggal, jam, tempat,
    kurikulum: kurikulum ?? "", ciriAdat: ciriAdat ?? "",
    pelatihId: pelatihId || null,
  }).returning();
  res.status(201).json(inserted[0]);
});

// Update latihan
router.patch("/latihan/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  const fields = ["tanggal", "jam", "tempat", "kurikulum", "ciriAdat", "pelatihId",
    "laporanFotoUrl", "laporanTimestamp", "laporanLat", "laporanLng"];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      if (f === "laporanTimestamp") updates[f] = req.body[f] ? new Date(req.body[f]) : null;
      else updates[f] = req.body[f];
    }
  }
  if (Object.keys(updates).length > 0) updates.editedAt = new Date();
  const rows = await db.update(latihanTable).set(updates).where(eq(latihanTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// Delete latihan
router.delete("/latihan/:id", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.delete(latihanTable).where(eq(latihanTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

export default router;
