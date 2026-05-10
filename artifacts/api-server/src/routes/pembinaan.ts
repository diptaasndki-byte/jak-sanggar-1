import { Router, type IRouter, type Request, type Response } from "express";
import { db, jamPembinaanTable, absensiPembinaanTable, pendaftaranPembinaanTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ============ JAM PEMBINAAN ============
router.get("/jam-pembinaan", requireAuth, async (_req: Request, res: Response) => {
  const rows = await db.select().from(jamPembinaanTable).limit(1);
  res.json(rows[0] ?? { pagiMax: "08:00", siangStart: "13:00", siangEnd: "17:00", pulangStart: "17:00", pulangEnd: "21:00" });
});

router.put("/jam-pembinaan", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["kurator", "admin"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { pagiMax, siangStart, siangEnd, pulangStart, pulangEnd } = req.body ?? {};
  const existing = await db.select().from(jamPembinaanTable).limit(1);
  if (existing[0]) {
    const rows = await db.update(jamPembinaanTable).set({
      pagiMax, siangStart, siangEnd, pulangStart, pulangEnd,
    }).where(eq(jamPembinaanTable.id, existing[0].id)).returning();
    res.json(rows[0]);
  } else {
    const rows = await db.insert(jamPembinaanTable).values({
      pagiMax, siangStart, siangEnd, pulangStart, pulangEnd,
    }).returning();
    res.status(201).json(rows[0]);
  }
});

// ============ ABSENSI PEMBINAAN ============
router.get("/absensi-pembinaan", requireAuth, async (req: Request, res: Response) => {
  const { pesertaId } = req.query;
  const conds = pesertaId ? [eq(absensiPembinaanTable.pesertaId, String(pesertaId))] : [];
  const rows = await db.select().from(absensiPembinaanTable).where(and(...conds)).orderBy(desc(absensiPembinaanTable.ts));
  res.json(rows);
});

router.post("/absensi-pembinaan", requireAuth, async (req: Request, res: Response) => {
  const { pesertaId, slot, fotoUrl } = req.body ?? {};
  if (!pesertaId || !slot) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(absensiPembinaanTable).values({
    pesertaId, slot, fotoUrl: fotoUrl || null,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/absensi-pembinaan/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  if (req.body.validatedByAdminId !== undefined) updates.validatedByAdminId = req.body.validatedByAdminId;
  const rows = await db.update(absensiPembinaanTable).set(updates).where(eq(absensiPembinaanTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// ============ PENDAFTARAN PEMBINAAN ============
router.get("/pendaftaran-pembinaan", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  const conds = sanggarId ? [eq(pendaftaranPembinaanTable.sanggarId, String(sanggarId))] : [];
  const rows = await db.select().from(pendaftaranPembinaanTable).where(and(...conds)).orderBy(desc(pendaftaranPembinaanTable.createdAt));
  res.json(rows);
});

router.post("/pendaftaran-pembinaan", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, delegasiId, barcode } = req.body ?? {};
  if (!sanggarId || !delegasiId || !barcode) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(pendaftaranPembinaanTable).values({
    sanggarId, delegasiId, setuju: false, barcode,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/pendaftaran-pembinaan/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  if (req.body.setuju !== undefined) updates.setuju = req.body.setuju;
  const rows = await db.update(pendaftaranPembinaanTable).set(updates).where(eq(pendaftaranPembinaanTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

export default router;
