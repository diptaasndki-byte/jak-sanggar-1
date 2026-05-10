import { Router, type IRouter, type Request, type Response } from "express";
import { db, iuranTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/iuran", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  const conds = sanggarId ? [eq(iuranTable.sanggarId, String(sanggarId))] : [];
  const rows = await db.select().from(iuranTable).where(and(...conds)).orderBy(desc(iuranTable.createdAt));
  res.json(rows);
});

router.post("/iuran", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, senimanId, judul, nominal } = req.body ?? {};
  if (!sanggarId || !senimanId || !judul || !nominal) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(iuranTable).values({
    sanggarId, senimanId, judul, nominal, status: "pending",
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/iuran/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.buktiUrl !== undefined) updates.buktiUrl = req.body.buktiUrl;
  if (req.body.status === "lunas") updates.validatedAt = new Date();
  const rows = await db.update(iuranTable).set(updates).where(eq(iuranTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

router.delete("/iuran/:id", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.delete(iuranTable).where(eq(iuranTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

export default router;
