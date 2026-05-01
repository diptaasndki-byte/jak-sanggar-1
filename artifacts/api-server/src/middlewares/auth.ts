import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { User } from "@workspace/db";
import { SESSION_COOKIE, getSessionUser } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionToken?: string;
    }
  }
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const token = cookies?.[SESSION_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Belum login" });
    return;
  }
  const user = await getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: "Sesi tidak valid" });
    return;
  }
  req.user = user;
  req.sessionToken = token;
  next();
};

export function requireRole(roles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Belum login" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Tidak punya akses" });
      return;
    }
    next();
  };
}

export function paramId(req: Request, key = "id"): string {
  const v = req.params[key];
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}
