import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const pengajuanHonorTable = pgTable("pengajuan_honor", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  pelatihId: uuid("pelatih_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  jumlahSesi: integer("jumlah_sesi").notNull(),
  honorPerSesi: integer("honor_per_sesi").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("pending"), // pending | disetujui | ditolak
  buktiTransferUrl: text("bukti_transfer_url"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPengajuanHonorSchema = createInsertSchema(pengajuanHonorTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPengajuanHonor = z.infer<typeof insertPengajuanHonorSchema>;
export type PengajuanHonor = typeof pengajuanHonorTable.$inferSelect;

export const distribusiHonorTable = pgTable("distribusi_honor", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  penerimaId: uuid("penerima_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  penerimaRole: text("penerima_role").notNull(), // pelatih | seniman
  judulJob: text("judul_job").notNull(),
  nominal: integer("nominal").notNull(),
  buktiTransferUrl: text("bukti_transfer_url"),
  konfirmasi: boolean("konfirmasi").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDistribusiHonorSchema = createInsertSchema(distribusiHonorTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDistribusiHonor = z.infer<typeof insertDistribusiHonorSchema>;
export type DistribusiHonor = typeof distribusiHonorTable.$inferSelect;
