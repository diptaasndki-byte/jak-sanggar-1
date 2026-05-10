import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

// Pengaturan jam pembinaan (singleton-like, satu baris)
export const jamPembinaanTable = pgTable("jam_pembinaan", {
  id: uuid("id").primaryKey().defaultRandom(),
  pagiMax: text("pagi_max").notNull().default("08:00"),
  siangStart: text("siang_start").notNull().default("13:00"),
  siangEnd: text("siang_end").notNull().default("17:00"),
  pulangStart: text("pulang_start").notNull().default("17:00"),
  pulangEnd: text("pulang_end").notNull().default("21:00"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJamPembinaanSchema = createInsertSchema(jamPembinaanTable).omit({ id: true, updatedAt: true });
export type InsertJamPembinaan = z.infer<typeof insertJamPembinaanSchema>;
export type JamPembinaan = typeof jamPembinaanTable.$inferSelect;

export const absensiPembinaanTable = pgTable("absensi_pembinaan", {
  id: uuid("id").primaryKey().defaultRandom(),
  pesertaId: uuid("peserta_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  slot: text("slot").notNull(), // pagi | siang | pulang
  fotoUrl: text("foto_url"),
  validatedByAdminId: uuid("validated_by_admin_id").references(() => usersTable.id, { onDelete: "set null" }),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAbsensiPembinaanSchema = createInsertSchema(absensiPembinaanTable).omit({ id: true, ts: true });
export type InsertAbsensiPembinaan = z.infer<typeof insertAbsensiPembinaanSchema>;
export type AbsensiPembinaan = typeof absensiPembinaanTable.$inferSelect;

export const pendaftaranPembinaanTable = pgTable("pendaftaran_pembinaan", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  delegasiId: uuid("delegasi_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  setuju: boolean("setuju").notNull().default(false),
  barcode: text("barcode").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPendaftaranPembinaanSchema = createInsertSchema(pendaftaranPembinaanTable).omit({ id: true, createdAt: true });
export type InsertPendaftaranPembinaan = z.infer<typeof insertPendaftaranPembinaanSchema>;
export type PendaftaranPembinaan = typeof pendaftaranPembinaanTable.$inferSelect;
