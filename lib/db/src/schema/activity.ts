import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityTable = pgTable("activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  meta: jsonb("meta"),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, ts: true });
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
