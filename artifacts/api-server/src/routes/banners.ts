import { Router, type IRouter, type Request, type Response } from "express";
import { db, bannersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/banners", async (_req: Request, res: Response) => {
  const rows = await db.select().from(bannersTable).orderBy(desc(bannersTable.createdAt));
  res.json(rows);
});

router.post("/banners", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { teks, start, end, active } = req.body ?? {};
  if (!teks) { res.status(400).json({ error: "Teks wajib diisi" }); return; }
  const inserted = await db.insert(bannersTable).values({
    teks, start: new Date(start), end: new Date(end), active: active ?? true,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/banners/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  if (req.body.teks !== undefined) updates.teks = req.body.teks;
  if (req.body.start !== undefined) updates.start = new Date(req.body.start);
  if (req.body.end !== undefined) updates.end = new Date(req.body.end);
  if (req.body.active !== undefined) updates.active = req.body.active;
  const rows = await db.update(bannersTable).set(updates).where(eq(bannersTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

router.delete("/banners/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const rows = await db.delete(bannersTable).where(eq(bannersTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

export default router;
