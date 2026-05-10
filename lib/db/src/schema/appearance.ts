import { pgTable, text, timestamp, uuid, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Pengaturan tampilan aplikasi — singleton (satu baris).
// Seluruh konfigurasi disimpan sebagai JSONB agar fleksibel.
export const appearanceTable = pgTable("appearance", {
  id: uuid("id").primaryKey().defaultRandom(),
  settings: jsonb("settings").notNull().default({}),
  exportPassword: text("export_password").notNull().default("kurator123"),
  honorPerSesiDefault: integer("honor_per_sesi_default").notNull().default(250000),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAppearanceSchema = createInsertSchema(appearanceTable).omit({ id: true, updatedAt: true });
export type InsertAppearance = z.infer<typeof insertAppearanceSchema>;
export type Appearance = typeof appearanceTable.$inferSelect;
