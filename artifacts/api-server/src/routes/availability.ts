import { Router } from "express";
import { db } from "@workspace/db";
import { availabilityTable, bookingsTable, designsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateAvailabilityBody,
  ListAvailabilityQueryParams,
  UpdateAvailabilityParams,
  UpdateAvailabilityBody,
  DeleteAvailabilityParams,
  GetAvailableSlotsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

router.get("/slots", async (req, res) => {
  const parsed = GetAvailableSlotsQueryParams.safeParse({
    date: req.query.date,
    designId: req.query.designId ? Number(req.query.designId) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "date and designId are required" });
    return;
  }
  const { date, designId } = parsed.data;

  const [design] = await db
    .select()
    .from(designsTable)
    .where(eq(designsTable.id, designId));
  if (!design) {
    res.status(400).json({ error: "Design not found" });
    return;
  }
  const durationHours = parseFloat(design.durationHours);
  const durationMinutes = durationHours * 60;

  const availability = await db
    .select()
    .from(availabilityTable)
    .where(eq(availabilityTable.date, date));

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.date, date));

  const slots: { startTime: string; endTime: string }[] = [];

  for (const range of availability) {
    const rangeStart = timeToMinutes(range.startTime);
    const rangeEnd = timeToMinutes(range.endTime);

    for (
      let start = rangeStart;
      start + durationMinutes <= rangeEnd;
      start += 60
    ) {
      const end = start + durationMinutes;
      const startStr = minutesToTime(start);
      const endStr = minutesToTime(end);

      const hasOverlap = bookings.some((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return start < bEnd && end > bStart;
      });

      if (!hasOverlap) {
        slots.push({ startTime: startStr, endTime: endStr });
      }
    }
  }

  res.json({
    date,
    designId,
    designName: design.name,
    durationHours,
    slots,
  });
});

router.get("/", async (req, res) => {
  const parsed = ListAvailabilityQueryParams.safeParse({ date: req.query.date });
  const conditions = [];
  if (parsed.success && parsed.data.date) {
    conditions.push(eq(availabilityTable.date, parsed.data.date));
  }

  const ranges =
    conditions.length > 0
      ? await db.select().from(availabilityTable).where(and(...conditions)).orderBy(availabilityTable.date, availabilityTable.startTime)
      : await db.select().from(availabilityTable).orderBy(availabilityTable.date, availabilityTable.startTime);

  res.json(
    ranges.map((r) => ({
      id: r.id,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/", async (req, res) => {
  const parsed = CreateAvailabilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const [range] = await db
    .insert(availabilityTable)
    .values(parsed.data)
    .returning();
  res.status(201).json({
    id: range.id,
    date: range.date,
    startTime: range.startTime,
    endTime: range.endTime,
    createdAt: range.createdAt.toISOString(),
  });
});

router.put("/:id", async (req, res) => {
  const paramsParsed = UpdateAvailabilityParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateAvailabilityBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const [updated] = await db
    .update(availabilityTable)
    .set(bodyParsed.data)
    .where(eq(availabilityTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Availability range not found" });
    return;
  }
  res.json({
    id: updated.id,
    date: updated.date,
    startTime: updated.startTime,
    endTime: updated.endTime,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteAvailabilityParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [deleted] = await db
    .delete(availabilityTable)
    .where(eq(availabilityTable.id, parsed.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Availability range not found" });
    return;
  }
  res.json({ message: "Availability range deleted" });
});

export default router;
