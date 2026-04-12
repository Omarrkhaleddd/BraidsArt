import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, designsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateBookingBody,
  ListBookingsQueryParams,
  GetBookingParams,
  DeleteBookingParams,
} from "@workspace/api-zod";
import { sendBookingNotification } from "../lib/mailer";

const EXTENSION_PRICE = 400;
const EXTENSION_HOURS = 1;
const DEPOSIT_PERCENT = 0.2;

const router = Router();

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function serializeBooking(b: typeof bookingsTable.$inferSelect) {
  return {
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
    withExtension: b.withExtension,
    finalPrice: parseFloat(b.finalPrice),
    depositAmount: parseFloat(b.depositAmount),
    durationHours: parseFloat(b.durationHours),
    paymentProof: b.paymentProof ?? null,
    paymentStatus: b.paymentStatus,
    createdAt: b.createdAt.toISOString(),
  };
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

  res.json(bookings.map(serializeBooking));
});

router.post("/", async (req, res) => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const {
    customerName,
    customerPhone,
    customerEmail,
    designId,
    date,
    startTime,
    notes,
    withExtension = false,
    paymentProof,
    paymentStatus = "pending",
  } = parsed.data;

  const [design] = await db.select().from(designsTable).where(eq(designsTable.id, designId));
  if (!design) {
    res.status(400).json({ error: "Design not found" });
    return;
  }

  const baseDurationHours = parseFloat(design.durationHours);
  const effectiveDurationHours = withExtension
    ? baseDurationHours + EXTENSION_HOURS
    : baseDurationHours;
  const durationMinutes = effectiveDurationHours * 60;

  const basePrice = parseFloat(design.price);
  const finalPrice = withExtension ? basePrice + EXTENSION_PRICE : basePrice;
  const depositAmount = Math.round(finalPrice * DEPOSIT_PERCENT * 100) / 100;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

  // Only check conflicts against non-rejected bookings
  const existingBookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.date, date));

  const hasConflict = existingBookings
    .filter((b) => b.paymentStatus !== "rejected")
    .some((b) => {
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
      withExtension: withExtension ?? false,
      finalPrice: finalPrice.toFixed(2),
      depositAmount: depositAmount.toFixed(2),
      durationHours: effectiveDurationHours.toFixed(2),
      paymentProof: paymentProof ?? null,
      depositPaid: false,
      paymentStatus: paymentStatus ?? "pending",
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
    withExtension: withExtension ?? false,
    finalPrice,
    depositPaid: false,
  }).catch(() => {});

  res.status(201).json(serializeBooking(booking));
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
  res.json(serializeBooking(booking));
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
