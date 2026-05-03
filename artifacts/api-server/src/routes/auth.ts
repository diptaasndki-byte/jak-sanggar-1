import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AuthLoginBody } from "@workspace/api-zod";
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  hashPassword,
  toAuthUser,
  verifyPassword,
} from "../lib/auth";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// VPS saat ini diakses lewat http://IP, belum HTTPS.
// Cookie dengan secure=true tidak akan disimpan/dikirim browser di HTTP,
// akibatnya setelah refresh user keluar ke halaman login.
// Kalau nanti sudah pakai HTTPS/domain SSL, set FORCE_SECURE_COOKIES=true.
const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env["FORCE_SECURE_COOKIES"] === "true",
  path: "/",
};

const PUBLIC_REGISTER_ROLES = new Set(["sanggar", "pelatih", "seniman", "sewa"]);

function cleanUsername(v: unknown) {
  return String(v ?? "").trim();
}

function cleanPassword(v: unknown) {
  return String(v ?? "");
}

function normalizePhone(phone: unknown): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

router.post("/auth/register", async (req: Request, res: Response) => {
  const username = cleanUsername(req.body?.username);
  const password = cleanPassword(req.body?.password);
  const role = String(req.body?.role ?? "").trim();
  const rawProfile = req.body?.profile;
  const profile = rawProfile && typeof rawProfile === "object" && !Array.isArray(rawProfile)
    ? { ...(rawProfile as Record<string, unknown>) }
    : {};

  if (username.length < 3 || password.length < 6 || !PUBLIC_REGISTER_ROLES.has(role)) {
    res.status(400).json({ error: "Data pendaftaran tidak valid" });
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

  // Seniman hanya boleh aktif/mendaftar pada satu sanggar berdasarkan NIK KTP.
  if (role === "seniman") {
    const nikKtp = String(profile["nikKtp"] ?? "").replace(/\D/g, "");
    if (!/^\d{16}$/.test(nikKtp)) {
      res.status(400).json({ error: "NIK KTP wajib berisi tepat 16 angka" });
      return;
    }
    profile["nikKtp"] = nikKtp;
    const rows = await db.select().from(usersTable).where(eq(usersTable.role, "seniman"));
    const duplicate = rows.some((u) => {
      const p = (u.profile ?? {}) as Record<string, unknown>;
      const existingNik = String(p["nikKtp"] ?? "").replace(/\D/g, "");
      const membershipStatus = String(p["status"] ?? "aktif");
      return existingNik === nikKtp && membershipStatus !== "ditolak" && membershipStatus !== "keluar";
    });
    if (duplicate) {
      res.status(409).json({ error: "Seniman tidak dapat mendaftarkan diri di lebih dari 1 sanggar" });
      return;
    }
  }

  if (profile["noHp"]) {
    profile["noHp"] = normalizePhone(profile["noHp"]);
  }

  const passwordHash = await hashPassword(password);
  const inserted = await db
    .insert(usersTable)
    .values({
      username,
      passwordHash,
      role,
      status: "aktif",
      profile,
    })
    .returning();

  const user = inserted[0]!;
  const { token, expiresAt } = await createSession(user.id);
  res.cookie(SESSION_COOKIE, token, { ...SESSION_COOKIE_OPTS, expires: expiresAt });
  res.status(201).json(toAuthUser(user));
});

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
