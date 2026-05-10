import { Router, type IRouter, type Request, type Response } from "express";
import { db, activityTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/activity", requireAuth, async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const rows = await db.select().from(activityTable).orderBy(desc(activityTable.ts)).limit(limit);
  res.json(rows);
});

router.post("/activity", requireAuth, async (req: Request, res: Response) => {
  const { actorId, actorRole, action, meta } = req.body ?? {};
  if (!actorId || !actorRole || !action) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(activityTable).values({
    actorId, actorRole, action, meta: meta ?? null,
  }).returning();
  res.status(201).json(inserted[0]);
});

// Trim old entries (keep latest 500)
router.post("/activity/trim", requireAuth, async (_req: Request, res: Response) => {
  await db.execute(sql`
    DELETE FROM activity WHERE id NOT IN (
      SELECT id FROM activity ORDER BY ts DESC LIMIT 500
    )
  `);
  res.json({ ok: true });
});

export default router;
