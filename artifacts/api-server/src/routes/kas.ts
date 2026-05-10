import { Router, type IRouter, type Request, type Response } from "express";
import { db, kasTable, transaksiManualTable, usersTable } from "@workspace/db";
import { eq, desc, and, sum, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ============ KAS ============
router.get("/kas", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  const conds = sanggarId ? [eq(kasTable.sanggarId, String(sanggarId))] : [];
  const rows = await db.select().from(kasTable).where(and(...conds)).orderBy(desc(kasTable.tanggal));
  res.json(rows);
});

router.post("/kas", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, keterangan, debit, kredit, refType, refId } = req.body ?? {};
  if (!sanggarId || !keterangan) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  // Hitung saldo terakhir
  const existing = await db.select().from(kasTable)
    .where(eq(kasTable.sanggarId, sanggarId))
    .orderBy(desc(kasTable.tanggal));
  const lastSaldo = existing.reduce((s, k) => s + (k.debit ?? 0) - (k.kredit ?? 0), 0);
  const saldo = lastSaldo + (debit ?? 0) - (kredit ?? 0);

  const inserted = await db.insert(kasTable).values({
    sanggarId, keterangan, debit: debit ?? 0, kredit: kredit ?? 0,
    saldo, refType: refType ?? "", refId: refId ?? "",
  }).returning();

  // Update saldo di profile user sanggar
  await db.update(usersTable).set({
    profile: sql`jsonb_set(COALESCE(${usersTable.profile}, '{}'), '{saldo}', ${JSON.stringify(saldo)}::jsonb)`,
  }).where(eq(usersTable.id, sanggarId));

  res.status(201).json(inserted[0]);
});

// Recompute saldo
router.post("/kas/recompute/:sanggarId", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.params;
  const entries = await db.select().from(kasTable)
    .where(eq(kasTable.sanggarId, sanggarId))
    .orderBy(kasTable.tanggal);
  let saldo = 0;
  for (const e of entries) {
    saldo += (e.debit ?? 0) - (e.kredit ?? 0);
    await db.update(kasTable).set({ saldo }).where(eq(kasTable.id, e.id));
  }
  // Update user profile saldo
  await db.update(usersTable).set({
    profile: sql`jsonb_set(COALESCE(${usersTable.profile}, '{}'), '{saldo}', ${JSON.stringify(saldo)}::jsonb)`,
  }).where(eq(usersTable.id, sanggarId));

  res.json({ saldo });
});

router.delete("/kas/:id", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.delete(kasTable).where(eq(kasTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

// ============ TRANSAKSI MANUAL ============
router.get("/transaksi", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  const conds = sanggarId ? [eq(transaksiManualTable.sanggarId, String(sanggarId))] : [];
  const rows = await db.select().from(transaksiManualTable).where(and(...conds)).orderBy(desc(transaksiManualTable.createdAt));
  res.json(rows);
});

router.post("/transaksi", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, jenis, tanggal, kategori, nominal, sumberAtauTujuan, keterangan, buktiUrl } = req.body ?? {};
  if (!sanggarId || !jenis || !tanggal || !kategori || !nominal) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(transaksiManualTable).values({
    sanggarId, jenis, tanggal, kategori, nominal,
    sumberAtauTujuan: sumberAtauTujuan ?? "", keterangan: keterangan ?? "",
    buktiUrl: buktiUrl || null,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.delete("/transaksi/:id", requireAuth, async (req: Request, res: Response) => {
  const rows = await db.delete(transaksiManualTable).where(eq(transaksiManualTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

export default router;
