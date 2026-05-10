import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const transaksiManualTable = pgTable("transaksi_manual", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  jenis: text("jenis").notNull(), // pemasukan | pengeluaran
  tanggal: text("tanggal").notNull(), // YYYY-MM-DD
  kategori: text("kategori").notNull(),
  nominal: integer("nominal").notNull(),
  sumberAtauTujuan: text("sumber_atau_tujuan").notNull().default(""),
  keterangan: text("keterangan").notNull().default(""),
  buktiUrl: text("bukti_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransaksiManualSchema = createInsertSchema(transaksiManualTable).omit({ id: true, createdAt: true });
export type InsertTransaksiManual = z.infer<typeof insertTransaksiManualSchema>;
export type TransaksiManual = typeof transaksiManualTable.$inferSelect;

export const kasTable = pgTable("kas", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tanggal: timestamp("tanggal", { withTimezone: true }).notNull().defaultNow(),
  keterangan: text("keterangan").notNull(),
  debit: integer("debit").notNull().default(0),
  kredit: integer("kredit").notNull().default(0),
  saldo: integer("saldo").notNull().default(0),
  refType: text("ref_type").notNull().default(""),
  refId: text("ref_id").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKasSchema = createInsertSchema(kasTable).omit({ id: true, createdAt: true });
export type InsertKas = z.infer<typeof insertKasSchema>;
export type Kas = typeof kasTable.$inferSelect;
