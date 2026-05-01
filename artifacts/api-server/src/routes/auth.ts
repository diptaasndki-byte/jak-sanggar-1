import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AuthLoginBody } from "@workspace/api-zod";
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  toAuthUser,
  verifyPassword,
} from "../lib/auth";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env["NODE_ENV"] === "production",
  path: "/",
};

router.post("/auth/login", async (req: Request, res: Response) => {
  const parsed = AuthLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Permintaan tidak valid" });
    return;
  }
  const { username, password } = parsed.data;
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  const user = rows[0];
  if (!user) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }
  if (user.status !== "aktif") {
    res.status(401).json({ error: "Akun tidak aktif" });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }
  const { token, expiresAt } = await createSession(user.id);
  res.cookie(SESSION_COOKIE, token, {
    ...SESSION_COOKIE_OPTS,
    expires: expiresAt,
  });
  res.json(toAuthUser(user));
});

router.post("/auth/logout", async (req: Request, res: Response) => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const token = cookies?.[SESSION_COOKIE];
  if (token) {
    await destroySession(token);
  }
  res.clearCookie(SESSION_COOKIE, SESSION_COOKIE_OPTS);
  res.status(204).end();
});

router.get("/auth/me", requireAuth, (req: Request, res: Response) => {
  res.json(toAuthUser(req.user!));
});

export default router;
