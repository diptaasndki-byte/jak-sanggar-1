import { Router, type IRouter, type Request, type Response } from "express";
import { db, kurasiMatrixTable, penugasanJuriTable, kurasiSubmissionTable, sertifikatTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ============ KURASI MATRIX ============
router.get("/kurasi-matrix", requireAuth, async (_req: Request, res: Response) => {
  const rows = await db.select().from(kurasiMatrixTable).limit(1);
  res.json(rows[0] ?? { indikator: [] });
});

router.put("/kurasi-matrix", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { indikator } = req.body ?? {};
  const existing = await db.select().from(kurasiMatrixTable).limit(1);
  if (existing[0]) {
    const rows = await db.update(kurasiMatrixTable).set({ indikator }).where(eq(kurasiMatrixTable.id, existing[0].id)).returning();
    res.json(rows[0]);
  } else {
    const rows = await db.insert(kurasiMatrixTable).values({ indikator }).returning();
    res.status(201).json(rows[0]);
  }
});

// ============ PENUGASAN JURI ============
router.get("/penugasan-juri", requireAuth, async (req: Request, res: Response) => {
  const { juriId, sanggarId } = req.query;
  const conds: any[] = [];
  if (juriId) conds.push(eq(penugasanJuriTable.juriId, String(juriId)));
  if (sanggarId) conds.push(eq(penugasanJuriTable.sanggarId, String(sanggarId)));
  const rows = await db.select().from(penugasanJuriTable).where(and(...conds)).orderBy(desc(penugasanJuriTable.createdAt));
  res.json(rows);
});

router.post("/penugasan-juri", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const { juriId, sanggarId, periode } = req.body ?? {};
  if (!juriId || !sanggarId || !periode) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(penugasanJuriTable).values({ juriId, sanggarId, periode }).returning();
  res.status(201).json(inserted[0]);
});

router.delete("/penugasan-juri/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !["kurator"].includes(req.user.role)) {
    res.status(403).json({ error: "Tidak punya akses" }); return;
  }
  const rows = await db.delete(penugasanJuriTable).where(eq(penugasanJuriTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.status(204).end();
});

// ============ KURASI SUBMISSIONS ============
router.get("/kurasi-submissions", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  const conds = sanggarId ? [eq(kurasiSubmissionTable.sanggarId, String(sanggarId))] : [];
  const rows = await db.select().from(kurasiSubmissionTable).where(and(...conds)).orderBy(desc(kurasiSubmissionTable.createdAt));
  res.json(rows);
});

router.post("/kurasi-submissions", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId, tahap1, tahap2VideoName } = req.body ?? {};
  if (!sanggarId) { res.status(400).json({ error: "sanggarId wajib" }); return; }
  const inserted = await db.insert(kurasiSubmissionTable).values({
    sanggarId, tahap1: tahap1 ?? {}, tahap2VideoName: tahap2VideoName || null,
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/kurasi-submissions/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Record<string, unknown> = {};
  if (req.body.tahap1 !== undefined) updates.tahap1 = req.body.tahap1;
  if (req.body.tahap2VideoName !== undefined) updates.tahap2VideoName = req.body.tahap2VideoName;
  if (req.body.scores !== undefined) updates.scores = req.body.scores;
  if (req.body.finalized !== undefined) updates.finalized = req.body.finalized;
  const rows = await db.update(kurasiSubmissionTable).set(updates).where(eq(kurasiSubmissionTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// ============ SERTIFIKAT ============
router.get("/sertifikat", requireAuth, async (req: Request, res: Response) => {
  const { pemilikId, sanggarId } = req.query;
  const conds: any[] = [];
  if (pemilikId) conds.push(eq(sertifikatTable.pemilikId, String(pemilikId)));
  if (sanggarId) conds.push(eq(sertifikatTable.sanggarId, String(sanggarId)));
  const rows = await db.select().from(sertifikatTable).where(and(...conds)).orderBy(desc(sertifikatTable.issuedAt));
  res.json(rows);
});

router.post("/sertifikat", requireAuth, async (req: Request, res: Response) => {
  const { pemilikId, pemilikNama, jenis, predikat, nilai, sanggarId } = req.body ?? {};
  if (!pemilikId || !pemilikNama || !jenis) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(sertifikatTable).values({
    pemilikId, pemilikNama, jenis, predikat: predikat || null,
    nilai: nilai ?? null, sanggarId: sanggarId || null,
  }).returning();
  res.status(201).json(inserted[0]);
});

export default router;
