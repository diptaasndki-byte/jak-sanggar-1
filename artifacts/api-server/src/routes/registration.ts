import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateUserBody } from "@workspace/api-zod";
import { hashPassword, toAuthUser } from "../lib/auth";

const router: IRouter = Router();

router.post("/register", async (req: Request, res: Response) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Permintaan tidak valid" });
    return;
  }

  const { username, password, role, profile } = parsed.data;
  if (!["sanggar", "pelatih", "seniman"].includes(role)) {
    res.status(400).json({ error: "Role pendaftaran tidak valid" });
    return;
  }

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
      status: "pending",
      profile: (profile ?? {}) as Record<string, unknown>,
    })
    .returning();

  res.status(201).json(toAuthUser(inserted[0]!));
});

export default router;
