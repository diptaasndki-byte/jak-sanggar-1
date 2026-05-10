import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const asetTable = pgTable("aset", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  kategori: text("kategori").notNull(),       // alat_musik | kostum
  nama: text("nama").notNull(),
  jenis: text("jenis").notNull().default(""),
  jumlahTotal: integer("jumlah_total").notNull().default(1),
  jumlahTersedia: integer("jumlah_tersedia").notNull().default(1),
  kondisi: text("kondisi").notNull().default("baik"), // baik | perlu_perbaikan
  fotoUrl: text("foto_url"),
  hargaSewa: integer("harga_sewa").notNull().default(0),
  satuanHarga: text("satuan_harga").notNull().default("per_hari"), // per_jam | per_hari | per_event
  statusPublish: boolean("status_publish").notNull().default(false),
  akomodasiPP: text("akomodasi_pp").default("diluar"),
  biayaAkomodasi: integer("biaya_akomodasi").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAsetSchema = createInsertSchema(asetTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAset = z.infer<typeof insertAsetSchema>;
export type Aset = typeof asetTable.$inferSelect;

export const sarprasTable = pgTable("sarpras", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  namaTempat: text("nama_tempat").notNull(),
  jenisTempat: text("jenis_tempat").notNull(), // tempat_latihan | aula | studio
  kapasitas: integer("kapasitas").notNull().default(0),
  fasilitas: text("fasilitas").notNull().default(""),
  alamat: text("alamat").notNull().default(""),
  fotoUrl: text("foto_url"),
  hargaSewa: integer("harga_sewa").notNull().default(0),
  satuanHarga: text("satuan_harga").notNull().default("per_jam"),
  statusPublish: boolean("status_publish").notNull().default(false),
  akomodasiPP: text("akomodasi_pp").default("diluar"),
  biayaAkomodasi: integer("biaya_akomodasi").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSarprasSchema = createInsertSchema(sarprasTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSarpras = z.infer<typeof insertSarprasSchema>;
export type Sarpras = typeof sarprasTable.$inferSelect;
