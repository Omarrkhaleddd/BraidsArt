import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, designsTable } from "@workspace/db";
import { gte, sql } from "drizzle-orm";
import { GetUpcomingBookingsQueryParams } from "@workspace/api-zod";

const router = Router();

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
    .where(gte(bookingsTable.date, today));

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

  res.json({
    totalBookings: Number(totalBookingsResult?.count ?? 0),
    totalDesigns: Number(totalDesignsResult?.count ?? 0),
    upcomingBookings: Number(upcomingResult[0]?.count ?? 0),
    todayBookings: Number(todayResult[0]?.count ?? 0),
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

export default router;
