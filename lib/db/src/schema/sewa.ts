import { pgTable, text, timestamp, uuid, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { invoiceTable, bastTable } from "./kerjasama";

export const pemesananSewaTable = pgTable("pemesanan_sewa", {
  id: uuid("id").primaryKey().defaultRandom(),
  nomor: text("nomor").notNull(),
  katalogItemId: text("katalog_item_id").notNull(),
  sumberType: text("sumber_type").notNull(), // sdm-pelatih | sdm-seniman | aset | sarpras
  sumberId: text("sumber_id").notNull(),
  sewaId: uuid("sewa_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sdmUserId: uuid("sdm_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  judul: text("judul").notNull(),
  kategori: text("kategori").notNull(),
  tanggalMulai: text("tanggal_mulai").notNull(),
  tanggalSelesai: text("tanggal_selesai").notNull(),
  lokasi: text("lokasi").notNull().default(""),
  jumlah: integer("jumlah").notNull().default(1),
  satuanHarga: text("satuan_harga").notNull().default("per_hari"),
  catatan: text("catatan").notNull().default(""),
  hargaDasar: integer("harga_dasar").notNull().default(0),
  akomodasiPP: text("akomodasi_pp").notNull().default("diluar"),
  biayaAkomodasi: integer("biaya_akomodasi").notNull().default(0),
  nilaiTotal: integer("nilai_total").notNull().default(0),
  status: text("status").notNull().default("menunggu_sanggar"),
  alasanTolak: text("alasan_tolak"),
  ttd: jsonb("ttd").notNull().default([]),  // TandaTanganSewa[]
  invoiceId: uuid("invoice_id").references(() => invoiceTable.id, { onDelete: "set null" }),
  bastId: uuid("bast_id").references(() => bastTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPemesananSewaSchema = createInsertSchema(pemesananSewaTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPemesananSewa = z.infer<typeof insertPemesananSewaSchema>;
export type PemesananSewa = typeof pemesananSewaTable.$inferSelect;
