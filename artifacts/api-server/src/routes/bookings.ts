import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, designsTable } from "@workspace/db";
import { eq, and, gte } from "drizzle-orm";
import {
  CreateBookingBody,
  ListBookingsQueryParams,
  GetBookingParams,
  DeleteBookingParams,
} from "@workspace/api-zod";
import { sendBookingNotification } from "../lib/mailer";

const router = Router();

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

router.get("/", async (req, res) => {
  const parsed = ListBookingsQueryParams.safeParse({
    date: req.query.date,
    designId: req.query.designId ? Number(req.query.designId) : undefined,
  });

  const conditions = [];
  if (parsed.success) {
    if (parsed.data.date) conditions.push(eq(bookingsTable.date, parsed.data.date));
    if (parsed.data.designId) conditions.push(eq(bookingsTable.designId, parsed.data.designId));
  }

  const bookings =
    conditions.length > 0
      ? await db.select().from(bookingsTable).where(and(...conditions)).orderBy(bookingsTable.date, bookingsTable.startTime)
      : await db.select().from(bookingsTable).orderBy(bookingsTable.date, bookingsTable.startTime);

  res.json(
    bookings.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      customerPhone: b.customerPhone ?? null,
      customerEmail: b.customerEmail ?? null,
      designId: b.designId,
      designName: b.designName,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      notes: b.notes ?? null,
      createdAt: b.createdAt.toISOString(),
    }))
  );
});

router.post("/", async (req, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { customerName, customerPhone, customerEmail, designId, date, startTime, notes } = parsed.data;

  const [design] = await db.select().from(designsTable).where(eq(designsTable.id, designId));
  if (!design) {
    res.status(400).json({ error: "Design not found" });
    return;
  }
  const durationMinutes = parseFloat(design.durationHours) * 60;
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

  const existingBookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.date, date));

  const hasConflict = existingBookings.some((b) => {
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime);
    return startMinutes < bEnd && endMinutes > bStart;
  });

  if (hasConflict) {
    res.status(409).json({ error: "This time slot conflicts with an existing booking" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      customerName,
      customerPhone: customerPhone ?? null,
      customerEmail: customerEmail ?? null,
      designId,
      designName: design.name,
      date,
      startTime,
      endTime,
      notes: notes ?? null,
    })
    .returning();

  sendBookingNotification({
    customerName,
    customerPhone,
    customerEmail,
    designName: design.name,
    date,
    startTime,
    endTime,
    notes,
  }).catch(() => {});

  res.status(201).json({
    id: booking.id,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone ?? null,
    customerEmail: booking.customerEmail ?? null,
    designId: booking.designId,
    designName: booking.designName,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    notes: booking.notes ?? null,
    createdAt: booking.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetBookingParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, parsed.data.id));
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json({
    id: booking.id,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone ?? null,
    customerEmail: booking.customerEmail ?? null,
    designId: booking.designId,
    designName: booking.designName,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    notes: booking.notes ?? null,
    createdAt: booking.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteBookingParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [deleted] = await db
    .delete(bookingsTable)
    .where(eq(bookingsTable.id, parsed.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json({ message: "Booking cancelled successfully" });
});

export default router;
