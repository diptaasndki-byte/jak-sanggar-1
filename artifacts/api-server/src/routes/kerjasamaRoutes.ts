import { Router, type IRouter, type Request, type Response } from "express";
import {
  db, kerjasamaTable, chatMessageTable, negosiasiTable,
  invoiceTable, paymentTable, contractTable, bastTable, ratingTable,
} from "@workspace/db";
import { eq, desc, and, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ============ KERJASAMA ============
router.get("/kerjasama", requireAuth, async (req: Request, res: Response) => {
  const { sanggarId } = req.query;
  let rows;
  if (sanggarId) {
    rows = await db.select().from(kerjasamaTable).where(
      or(eq(kerjasamaTable.sanggarPenyediaId, String(sanggarId)),
         eq(kerjasamaTable.sanggarPeminjamId, String(sanggarId)))
    ).orderBy(desc(kerjasamaTable.createdAt));
  } else {
    rows = await db.select().from(kerjasamaTable).orderBy(desc(kerjasamaTable.createdAt));
  }
  res.json(rows);
});

router.post("/kerjasama", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.nomor || !b.sanggarPenyediaId || !b.sanggarPeminjamId) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(kerjasamaTable).values(b).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/kerjasama/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const b = req.body ?? {};
  const updates: Record<string, unknown> = {};
  const fields = ["status", "nilaiTotal", "hargaAwal", "jumlah", "lokasi",
    "tanggalMulai", "tanggalSelesai", "deskripsi"];
  for (const f of fields) { if (b[f] !== undefined) updates[f] = b[f]; }
  const rows = await db.update(kerjasamaTable).set(updates).where(eq(kerjasamaTable.id, id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// ============ CHAT MESSAGES ============
router.get("/chat-messages", requireAuth, async (req: Request, res: Response) => {
  const { kerjasamaId } = req.query;
  if (!kerjasamaId) { res.status(400).json({ error: "kerjasamaId wajib" }); return; }
  const rows = await db.select().from(chatMessageTable)
    .where(eq(chatMessageTable.kerjasamaId, String(kerjasamaId)))
    .orderBy(chatMessageTable.ts);
  res.json(rows);
});

router.post("/chat-messages", requireAuth, async (req: Request, res: Response) => {
  const { kerjasamaId, senderId, senderName, senderRole, message } = req.body ?? {};
  if (!kerjasamaId || !senderId || !message) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(chatMessageTable).values({
    kerjasamaId, senderId, senderName: senderName ?? "", senderRole: senderRole ?? "", message,
  }).returning();
  res.status(201).json(inserted[0]);
});

// ============ NEGOSIASI ============
router.get("/negosiasi", requireAuth, async (req: Request, res: Response) => {
  const { kerjasamaId } = req.query;
  if (!kerjasamaId) { res.status(400).json({ error: "kerjasamaId wajib" }); return; }
  const rows = await db.select().from(negosiasiTable)
    .where(eq(negosiasiTable.kerjasamaId, String(kerjasamaId)))
    .orderBy(desc(negosiasiTable.createdAt));
  res.json(rows);
});

router.post("/negosiasi", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.kerjasamaId || !b.pengirimSanggarId || !b.hargaTawar) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(negosiasiTable).values({
    kerjasamaId: b.kerjasamaId, pengirimSanggarId: b.pengirimSanggarId,
    pengirimUserId: b.pengirimUserId ?? "", hargaTawar: b.hargaTawar,
    catatan: b.catatan ?? "", status: "diajukan",
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/negosiasi/:id", requireAuth, async (req: Request, res: Response) => {
  const updates: Record<string, unknown> = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  const rows = await db.update(negosiasiTable).set(updates).where(eq(negosiasiTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// ============ INVOICES ============
router.get("/invoices", requireAuth, async (req: Request, res: Response) => {
  const { kerjasamaId } = req.query;
  const conds = kerjasamaId ? [eq(invoiceTable.kerjasamaId, String(kerjasamaId))] : [];
  const rows = await db.select().from(invoiceTable).where(and(...conds)).orderBy(desc(invoiceTable.createdAt));
  res.json(rows);
});

router.post("/invoices", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.nomor || !b.total || !b.batasPembayaran) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(invoiceTable).values({
    kerjasamaId: b.kerjasamaId || null, nomor: b.nomor, total: b.total,
    status: "terhutang", batasPembayaran: new Date(b.batasPembayaran),
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/invoices/:id", requireAuth, async (req: Request, res: Response) => {
  const updates: Record<string, unknown> = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  const rows = await db.update(invoiceTable).set(updates).where(eq(invoiceTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// ============ PAYMENTS ============
router.get("/payments", requireAuth, async (req: Request, res: Response) => {
  const { invoiceId } = req.query;
  const conds = invoiceId ? [eq(paymentTable.invoiceId, String(invoiceId))] : [];
  const rows = await db.select().from(paymentTable).where(and(...conds)).orderBy(desc(paymentTable.createdAt));
  res.json(rows);
});

router.post("/payments", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.invoiceId || !b.nominal) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(paymentTable).values({
    invoiceId: b.invoiceId, nominal: b.nominal,
    buktiUrl: b.buktiUrl || null, status: "menunggu",
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/payments/:id", requireAuth, async (req: Request, res: Response) => {
  const updates: Record<string, unknown> = {};
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.catatanVerifikator !== undefined) updates.catatanVerifikator = req.body.catatanVerifikator;
  if (req.body.buktiUrl !== undefined) updates.buktiUrl = req.body.buktiUrl;
  const rows = await db.update(paymentTable).set(updates).where(eq(paymentTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// ============ CONTRACTS ============
router.get("/contracts", requireAuth, async (req: Request, res: Response) => {
  const { kerjasamaId } = req.query;
  const conds = kerjasamaId ? [eq(contractTable.kerjasamaId, String(kerjasamaId))] : [];
  const rows = await db.select().from(contractTable).where(and(...conds)).orderBy(desc(contractTable.createdAt));
  res.json(rows);
});

router.post("/contracts", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.kerjasamaId || !b.nomor) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(contractTable).values({
    kerjasamaId: b.kerjasamaId, nomor: b.nomor,
  }).returning();
  res.status(201).json(inserted[0]);
});

// ============ BAST ============
router.get("/bast", requireAuth, async (req: Request, res: Response) => {
  const { kerjasamaId } = req.query;
  const conds = kerjasamaId ? [eq(bastTable.kerjasamaId, String(kerjasamaId))] : [];
  const rows = await db.select().from(bastTable).where(and(...conds)).orderBy(desc(bastTable.createdAt));
  res.json(rows);
});

router.post("/bast", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.kerjasamaId || !b.nomor) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(bastTable).values({
    kerjasamaId: b.kerjasamaId, nomor: b.nomor, status: "draft",
  }).returning();
  res.status(201).json(inserted[0]);
});

router.patch("/bast/:id", requireAuth, async (req: Request, res: Response) => {
  const updates: Record<string, unknown> = {};
  if (req.body.status !== undefined) {
    updates.status = req.body.status;
    if (req.body.status === "final") updates.finalAt = new Date();
  }
  const rows = await db.update(bastTable).set(updates).where(eq(bastTable.id, req.params.id)).returning();
  if (!rows[0]) { res.status(404).json({ error: "Tidak ditemukan" }); return; }
  res.json(rows[0]);
});

// ============ RATINGS ============
router.get("/ratings", requireAuth, async (req: Request, res: Response) => {
  const { kerjasamaId } = req.query;
  const conds = kerjasamaId ? [eq(ratingTable.kerjasamaId, String(kerjasamaId))] : [];
  const rows = await db.select().from(ratingTable).where(and(...conds)).orderBy(desc(ratingTable.createdAt));
  res.json(rows);
});

router.post("/ratings", requireAuth, async (req: Request, res: Response) => {
  const b = req.body ?? {};
  if (!b.kerjasamaId || !b.dariSanggarId || !b.rating) {
    res.status(400).json({ error: "Data tidak lengkap" }); return;
  }
  const inserted = await db.insert(ratingTable).values({
    kerjasamaId: b.kerjasamaId, dariSanggarId: b.dariSanggarId,
    rating: b.rating, ulasan: b.ulasan ?? "",
  }).returning();
  res.status(201).json(inserted[0]);
});

export default router;
