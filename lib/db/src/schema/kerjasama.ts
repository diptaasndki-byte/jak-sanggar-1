import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const kerjasamaTable = pgTable("kerjasama", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomor: text("nomor").notNull(),
  sumberType: text("sumber_type").notNull(), // sdm-pelatih | sdm-seniman | sdm-juri | aset | sarpras
  sumberId: text("sumber_id").notNull(),
  sanggarPenyediaId: uuid("sanggar_penyedia_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sanggarPeminjamId: uuid("sanggar_peminjam_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  kategori: text("kategori").notNull(), // sdm | alat_musik | kostum | tempat_latihan
  judul: text("judul").notNull(),
  tanggalMulai: text("tanggal_mulai").notNull(),
  tanggalSelesai: text("tanggal_selesai").notNull(),
  lokasi: text("lokasi").notNull().default(""),
  jumlah: integer("jumlah").notNull().default(1),
  satuanHarga: text("satuan_harga").notNull().default("per_hari"),
  deskripsi: text("deskripsi").notNull().default(""),
  hargaAwal: integer("harga_awal").notNull().default(0),
  nilaiTotal: integer("nilai_total").notNull().default(0),
  status: text("status").notNull().default("menunggu"), // menunggu | diterima | ditolak | negosiasi | berjalan | selesai | batal
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertKerjasamaSchema = createInsertSchema(kerjasamaTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKerjasama = z.infer<typeof insertKerjasamaSchema>;
export type Kerjasama = typeof kerjasamaTable.$inferSelect;

export const chatMessageTable = pgTable("chat_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  kerjasamaId: uuid("kerjasama_id").notNull().references(() => kerjasamaTable.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  senderRole: text("sender_role").notNull(),
  message: text("message").notNull(),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessageTable).omit({ id: true, ts: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessageTable.$inferSelect;

export const negosiasiTable = pgTable("negosiasi", {
  id: uuid("id").primaryKey().defaultRandom(),
  kerjasamaId: uuid("kerjasama_id").notNull().references(() => kerjasamaTable.id, { onDelete: "cascade" }),
  pengirimSanggarId: uuid("pengirim_sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  pengirimUserId: text("pengirim_user_id").notNull(),
  hargaTawar: integer("harga_tawar").notNull(),
  catatan: text("catatan").notNull().default(""),
  status: text("status").notNull().default("diajukan"), // diajukan | diterima | ditolak
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNegosiasiSchema = createInsertSchema(negosiasiTable).omit({ id: true, createdAt: true });
export type InsertNegosiasi = z.infer<typeof insertNegosiasiSchema>;
export type Negosiasi = typeof negosiasiTable.$inferSelect;

export const invoiceTable = pgTable("invoice", {
  id: uuid("id").primaryKey().defaultRandom(),
  kerjasamaId: uuid("kerjasama_id").references(() => kerjasamaTable.id, { onDelete: "set null" }),
  nomor: text("nomor").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("terhutang"), // terhutang | lunas
  batasPembayaran: timestamp("batas_pembayaran", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoiceTable).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoiceTable.$inferSelect;

export const paymentTable = pgTable("payment", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoiceTable.id, { onDelete: "cascade" }),
  nominal: integer("nominal").notNull(),
  tanggalBayar: timestamp("tanggal_bayar", { withTimezone: true }).notNull().defaultNow(),
  buktiUrl: text("bukti_url"),
  status: text("status").notNull().default("menunggu"), // menunggu | disetujui | ditolak
  catatanVerifikator: text("catatan_verifikator"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentTable.$inferSelect;

export const contractTable = pgTable("contract", {
  id: uuid("id").primaryKey().defaultRandom(),
  kerjasamaId: uuid("kerjasama_id").notNull().references(() => kerjasamaTable.id, { onDelete: "cascade" }),
  nomor: text("nomor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContractSchema = createInsertSchema(contractTable).omit({ id: true, createdAt: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contractTable.$inferSelect;

export const bastTable = pgTable("bast", {
  id: uuid("id").primaryKey().defaultRandom(),
  kerjasamaId: uuid("kerjasama_id").notNull().references(() => kerjasamaTable.id, { onDelete: "cascade" }),
  nomor: text("nomor").notNull(),
  status: text("status").notNull().default("draft"), // draft | final
  finalAt: timestamp("final_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBastSchema = createInsertSchema(bastTable).omit({ id: true, createdAt: true });
export type InsertBast = z.infer<typeof insertBastSchema>;
export type Bast = typeof bastTable.$inferSelect;

export const ratingTable = pgTable("rating", {
  id: uuid("id").primaryKey().defaultRandom(),
  kerjasamaId: uuid("kerjasama_id").notNull().references(() => kerjasamaTable.id, { onDelete: "cascade" }),
  dariSanggarId: uuid("dari_sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  ulasan: text("ulasan").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRatingSchema = createInsertSchema(ratingTable).omit({ id: true, createdAt: true });
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratingTable.$inferSelect;
