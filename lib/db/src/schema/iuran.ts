import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const iuranTable = pgTable("iuran", {
  id: uuid("id").primaryKey().defaultRandom(),
  sanggarId: uuid("sanggar_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  senimanId: uuid("seniman_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  judul: text("judul").notNull(),
  nominal: integer("nominal").notNull(),
  buktiUrl: text("bukti_url"),
  status: text("status").notNull().default("pending"), // pending | lunas | ditolak
  validatedAt: timestamp("validated_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertIuranSchema = createInsertSchema(iuranTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertIuran = z.infer<typeof insertIuranSchema>;
export type Iuran = typeof iuranTable.$inferSelect;
