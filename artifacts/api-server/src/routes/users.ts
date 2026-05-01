import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateUserBody, UpdateUserBody } from "@workspace/api-zod";
import { hashPassword, toAuthUser } from "../lib/auth";
import { paramId, requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();
const ADMINS = ["kurator", "admin"];

router.use("/users", requireAuth);

router.get(
  "/users",
  requireRole(ADMINS),
  async (_req: Request, res: Response) => {
    const rows = await db.select().from(usersTable);
    res.json(rows.map(toAuthUser));
  },
);

router.post(
  "/users",
  requireRole(ADMINS),
  async (req: Request, res: Response) => {
    const parsed = CreateUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Permintaan tidak valid" });
      return;
    }
    const { username, password, role, status, profile } = parsed.data;
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (existing[0]) {
      res.status(409).json({ error: "Username sudah dipakai" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const inserted = await db
      .insert(usersTable)
      .values({
        username,
        passwordHash,
        role,
        status: status ?? "aktif",
        profile: (profile ?? {}) as Record<string, unknown>,
      })
      .returning();
    res.status(201).json(toAuthUser(inserted[0]!));
  },
);

router.get("/users/:id", async (req: Request, res: Response) => {
  const id = paramId(req);
  const me = req.user!;
  if (!ADMINS.includes(me.role) && me.id !== id) {
    res.status(403).json({ error: "Tidak punya akses" });
    return;
  }
  const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  const user = rows[0];
  if (!user) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }
  res.json(toAuthUser(user));
});

router.patch("/users/:id", async (req: Request, res: Response) => {
  const id = paramId(req);
  const me = req.user!;
  if (!ADMINS.includes(me.role) && me.id !== id) {
    res.status(403).json({ error: "Tidak punya akses" });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Permintaan tidak valid" });
    return;
  }
  const { password, status, profile } = parsed.data;
  const update: Partial<typeof usersTable.$inferInsert> = {};
  if (typeof password === "string") {
    update.passwordHash = await hashPassword(password);
  }
  if (typeof status === "string" && ADMINS.includes(me.role)) {
    update.status = status;
  }
  if (profile && typeof profile === "object") {
    update.profile = profile as Record<string, unknown>;
  }
  if (Object.keys(update).length === 0) {
    const rows = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);
    const user = rows[0];
    if (!user) {
      res.status(404).json({ error: "Tidak ditemukan" });
      return;
    }
    res.json(toAuthUser(user));
    return;
  }
  const updated = await db
    .update(usersTable)
    .set(update)
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated[0]) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }
  res.json(toAuthUser(updated[0]));
});

router.delete(
  "/users/:id",
  requireRole(ADMINS),
  async (req: Request, res: Response) => {
    const id = paramId(req);
    if (id === req.user!.id) {
      res.status(400).json({ error: "Tidak bisa menghapus akun sendiri" });
      return;
    }
    const deleted = await db
      .delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning();
    if (!deleted[0]) {
      res.status(404).json({ error: "Tidak ditemukan" });
      return;
    }
    res.status(204).end();
  },
);

export default router;
