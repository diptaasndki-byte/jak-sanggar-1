import { pgTable, text, timestamp, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const infoBudayaTable = pgTable("info_budaya", {
  id: uuid("id").primaryKey().defaultRandom(),
  judul: text("judul").notNull(),
  ringkasan: text("ringkasan").notNull().default(""),
  isi: text("isi").notNull(),
  imageUrl: text("image_url"),
  kategori: text("kategori").notNull(), // Tari | Musik | Teater | Kuliner | Pakaian | Upacara | Sejarah | Bahasa | Permainan
  sumber: text("sumber"),
  active: boolean("active").notNull().default(true),
  "order": integer("order").notNull().default(0),
  authorId: uuid("author_id").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInfoBudayaSchema = createInsertSchema(infoBudayaTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInfoBudaya = z.infer<typeof insertInfoBudayaSchema>;
export type InfoBudaya = typeof infoBudayaTable.$inferSelect;
