import { Router, type IRouter, type Request, type Response } from "express";
import { db, appearanceTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/appearance", requireAuth, async (_req: Request, res: Response) => {
  const rows = await db.select().from(appearanceTable).limit(1);
  res.json(rows[0] ?? { settings: {}, exportPassword: "kurator123", honorPerSesiDefault: 250000 });
});

router.put("/appearance", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["kurator", "admin"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const b = req.body ?? {};
  const existing = await db.select().from(appearanceTable).limit(1);
  if (existing[0]) {
    const updates: Record<string, unknown> = {};
    if (b.settings !== undefined) updates.settings = b.settings;
    if (b.exportPassword !== undefined) updates.exportPassword = b.exportPassword;
    if (b.honorPerSesiDefault !== undefined) updates.honorPerSesiDefault = b.honorPerSesiDefault;
    const rows = await db.update(appearanceTable).set(updates).where(eq(appearanceTable.id, existing[0].id)).returning();
    res.json(rows[0]);
  } else {
    const rows = await db.insert(appearanceTable).values({
      settings: b.settings ?? {},
      exportPassword: b.exportPassword ?? "kurator123",
      honorPerSesiDefault: b.honorPerSesiDefault ?? 250000,
    }).returning();
    res.status(201).json(rows[0]);
  }
});

export default router;
