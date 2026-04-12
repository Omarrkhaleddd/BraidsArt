import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, designsTable } from "@workspace/db";
import { eq, gte, sql, isNotNull } from "drizzle-orm";
import { GetUpcomingBookingsQueryParams } from "@workspace/api-zod";

const router = Router();

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

router.get("/summary", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const [totalBookingsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingsTable);

  const [totalDesignsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(designsTable);

  const upcomingResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingsTable)
    .where(gte(bookingsTable.date, today));

  const todayResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingsTable)
    .where(eq(bookingsTable.date, today));

  const popularDesignsResult = await db
    .select({
      designId: bookingsTable.designId,
      designName: bookingsTable.designName,
      bookingCount: sql<number>`count(*)`,
    })
    .from(bookingsTable)
    .groupBy(bookingsTable.designId, bookingsTable.designName)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  const [pendingPaymentsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookingsTable)
    .where(eq(bookingsTable.paymentStatus, "pending"));

  res.json({
    totalBookings: Number(totalBookingsResult?.count ?? 0),
    totalDesigns: Number(totalDesignsResult?.count ?? 0),
    upcomingBookings: Number(upcomingResult[0]?.count ?? 0),
    todayBookings: Number(todayResult[0]?.count ?? 0),
    pendingPayments: Number(pendingPaymentsResult?.count ?? 0),
    popularDesigns: popularDesignsResult.map((r) => ({
      designId: r.designId,
      designName: r.designName,
      bookingCount: Number(r.bookingCount),
    })),
  });
});

router.get("/upcoming", async (req, res) => {
  const parsed = GetUpcomingBookingsQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  const today = new Date().toISOString().split("T")[0];
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 10;

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(gte(bookingsTable.date, today))
    .orderBy(bookingsTable.date, bookingsTable.startTime)
    .limit(limit);

  res.json(bookings.map(serializeBooking));
});

// List all pending payment proofs for admin review
router.get("/payments", async (req, res) => {
  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.paymentStatus, "pending"))
    .orderBy(bookingsTable.createdAt);

  res.json(bookings.map(serializeBooking));
});

// Verify a payment (approve)
router.post("/payments/:id/verify", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }
  const [updated] = await db
    .update(bookingsTable)
    .set({ paymentStatus: "verified", depositPaid: true })
    .where(eq(bookingsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(serializeBooking(updated));
});

// Reject a payment
router.post("/payments/:id/reject", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    res.status(400).json({ error: "Invalid booking ID" });
    return;
  }
  const [updated] = await db
    .update(bookingsTable)
    .set({ paymentStatus: "rejected", depositPaid: false })
    .where(eq(bookingsTable.id, id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(serializeBooking(updated));
});

export default router;
