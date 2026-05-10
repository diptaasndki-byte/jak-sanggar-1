import { pgTable, text, timestamp, uuid, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const latihanTable = pgTable("latihan", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tanggal: text("tanggal").notNull(), // YYYY-MM-DD
  jam: text("jam").notNull(),         // HH:mm
  tempat: text("tempat").notNull(),
  kurikulum: text("kurikulum").notNull().default(""),
  ciriAdat: text("ciri_adat").notNull().default(""),
  pelatihId: uuid("pelatih_id").references(() => usersTable.id, { onDelete: "set null" }),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  // Laporan: foto, timestamp, koordinat GPS
  laporanFotoUrl: text("laporan_foto_url"),
  laporanTimestamp: timestamp("laporan_timestamp", { withTimezone: true }),
  laporanLat: doublePrecision("laporan_lat"),
  laporanLng: doublePrecision("laporan_lng"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLatihanSchema = createInsertSchema(latihanTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLatihan = z.infer<typeof insertLatihanSchema>;
export type Latihan = typeof latihanTable.$inferSelect;
