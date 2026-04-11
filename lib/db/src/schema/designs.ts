import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const designsTable = pgTable("designs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationHours: numeric("duration_hours", { precision: 4, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDesignSchema = createInsertSchema(designsTable).omit({ id: true, createdAt: true });
export type InsertDesign = z.infer<typeof insertDesignSchema>;
export type Design = typeof designsTable.$inferSelect;
