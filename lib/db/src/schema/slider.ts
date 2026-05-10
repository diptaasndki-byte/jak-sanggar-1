import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sliderTable = pgTable("slider", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSliderSchema = createInsertSchema(sliderTable).omit({ id: true, createdAt: true });
export type InsertSlider = z.infer<typeof insertSliderSchema>;
export type Slider = typeof sliderTable.$inferSelect;
