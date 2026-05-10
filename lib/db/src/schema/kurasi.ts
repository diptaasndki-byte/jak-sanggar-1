import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// Matriks kurasi disimpan sebagai satu baris JSON karena strukturnya hierarkis
// (indikator -> variabel -> subVariabel) dan jarang berubah.
export const kurasiMatrixTable = pgTable("kurasi_matrix", {
  id: uuid("id").primaryKey().defaultRandom(),
  indikator: jsonb("indikator").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertKurasiMatrixSchema = createInsertSchema(kurasiMatrixTable).omit({ id: true, updatedAt: true });
export type InsertKurasiMatrix = z.infer<typeof insertKurasiMatrixSchema>;
export type KurasiMatrix = typeof kurasiMatrixTable.$inferSelect;

export const penugasanJuriTable = pgTable("penugasan_juri", {
  id: uuid("id").primaryKey().defaultRandom(),
  juriId: uuid("juri_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  periode: text("periode").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPenugasanJuriSchema = createInsertSchema(penugasanJuriTable).omit({ id: true, createdAt: true });
export type InsertPenugasanJuri = z.infer<typeof insertPenugasanJuriSchema>;
export type PenugasanJuri = typeof penugasanJuriTable.$inferSelect;

export const kurasiSubmissionTable = pgTable("kurasi_submission", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tahap1: jsonb("tahap1").notNull().default({}),           // Record<string, string>
  tahap2VideoName: text("tahap2_video_name"),
  scores: jsonb("scores").notNull().default({}),            // Record<juriId, Record<variabelId, number>>
  finalized: jsonb("finalized").notNull().default({}),      // Record<juriId, timestamp>
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertKurasiSubmissionSchema = createInsertSchema(kurasiSubmissionTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKurasiSubmission = z.infer<typeof insertKurasiSubmissionSchema>;
export type KurasiSubmission = typeof kurasiSubmissionTable.$inferSelect;

export const sertifikatTable = pgTable("sertifikat", {
  id: uuid("id").primaryKey().defaultRandom(),
  pemilikId: uuid("pemilik_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  pemilikNama: text("pemilik_nama").notNull(),
  jenis: text("jenis").notNull(),
  predikat: text("predikat"),
  nilai: integer("nilai"),
  sanggarId: uuid("sanggar_id").references(() => usersTable.id, { onDelete: "set null" }),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSertifikatSchema = createInsertSchema(sertifikatTable).omit({ id: true, createdAt: true });
export type InsertSertifikat = z.infer<typeof insertSertifikatSchema>;
export type Sertifikat = typeof sertifikatTable.$inferSelect;
