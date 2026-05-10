import { Router, type IRouter, type Request, type Response } from "express";
import { db, newsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// List all news (public)
router.get("/news", async (_req: Request, res: Response) => {
  const rows = await db.select().from(newsTable).orderBy(desc(newsTable.createdAt));
  res.json(rows);
});

// Create news (admin/kurator)
router.post("/news", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { judul, isi, imageUrl } = req.body ?? {};
  if (!judul || !isi) { res.status(400).json({ error: "Judul dan isi wajib diisi" }); return; }
  const inserted = await db.insert(newsTable).values({ judul, isi, imageUrl, authorId: req.user.id }).returning();
  res.status(201).json(inserted[0]);
});

// Update news
router.patch("/news/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { id } = req.params;
  const { judul, isi, imageUrl } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (judul !== undefined) updates.judul = judul;
  if (isi !== undefined) updates.isi = isi;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  const rows = await db.update(newsTable).set(updates).where(eq(newsTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// Delete news
router.delete("/news/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { id } = req.params;
  const rows = await db.delete(newsTable).where(eq(newsTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

export default router;
