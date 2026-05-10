import { Router, type IRouter, type Request, type Response } from "express";
import { db, infoBudayaTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/info-budaya", async (_req: Request, res: Response) => {
  const rows = await db.select().from(infoBudayaTable).orderBy(infoBudayaTable.order);
  res.json(rows);
});

router.post("/info-budaya", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const b = req.body ?? {};
  if (!b.judul || !b.isi || !b.kategori) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(infoBudayaTable).values({
    judul: b.judul, ringkasan: b.ringkasan ?? "", isi: b.isi,
    imageUrl: b.imageUrl || null, kategori: b.kategori,
    sumber: b.sumber || null, active: b.active ?? true,
    order: b.order ?? 0, authorId: req.user.id,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/info-budaya/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { id } = req.params;
  const b = req.body ?? {};
  const updates: Record<string, unknown> = {};
  const fields = ["judul", "ringkasan", "isi", "imageUrl", "kategori",
    "sumber", "active", "order"];
  for (const f of fields) { if (b[f] !== undefined) updates[f] = b[f]; }
  const rows = await db.update(infoBudayaTable).set(updates).where(eq(infoBudayaTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

router.delete("/info-budaya/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const rows = await db.delete(infoBudayaTable).where(eq(infoBudayaTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

export default router;
