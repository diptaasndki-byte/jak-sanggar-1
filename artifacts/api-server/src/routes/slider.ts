import { Router, type IRouter, type Request, type Response } from "express";
import { db, sliderTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/slider", async (_req: Request, res: Response) => {
  const rows = await db.select().from(sliderTable).orderBy(desc(sliderTable.createdAt));
  res.json(rows);
});

router.post("/slider", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { imageUrl, caption } = req.body ?? {};
  if (!imageUrl) { res.status(400).json({ error: "imageUrl wajib diisi" }); return; }
  const inserted = await db.insert(sliderTable).values({ imageUrl, caption: caption ?? "" }).returning();
  res.status(201).json(inserted[0]);
});

router.delete("/slider/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["admin", "kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const rows = await db.delete(sliderTable).where(eq(sliderTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

export default router;
