import { pgTable, serial, text, integer, timestamp, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { designsTable } from "./designs";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  designId: integer("design_id").notNull().references(() => designsTable.id),
  designName: text("design_name").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  notes: text("notes"),
  withExtension: boolean("with_extension").notNull().default(false),
  finalPrice: numeric("final_price", { precision: 10, scale: 2 }).notNull().default("0"),
  durationHours: numeric("duration_hours", { precision: 4, scale: 2 }).notNull().default("0"),
  depositPaid: boolean("deposit_paid").notNull().default(false),
  paymentStatus: text("payment_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
