import { Router } from "express";
import { db } from "@workspace/db";
import { designsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateDesignBody,
  GetDesignParams,
  UpdateDesignParams,
  UpdateDesignBody,
  DeleteDesignParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const designs = await db.select().from(designsTable).orderBy(designsTable.id);
  const formatted = designs.map((d) => ({
    id: d.id,
    name: d.name,
    price: parseFloat(d.price),
    durationHours: parseFloat(d.durationHours),
    imageUrl: d.imageUrl ?? null,
    description: d.description ?? null,
    createdAt: d.createdAt.toISOString(),
  }));
  res.json(formatted);
});

router.post("/", async (req, res) => {
  const parsed = CreateDesignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name, price, durationHours, imageUrl, description } = parsed.data;
  const [design] = await db
    .insert(designsTable)
    .values({
      name,
      price: price.toString(),
      durationHours: durationHours.toString(),
      imageUrl: imageUrl ?? null,
      description: description ?? null,
    })
    .returning();
  res.status(201).json({
    id: design.id,
    name: design.name,
    price: parseFloat(design.price),
    durationHours: parseFloat(design.durationHours),
    imageUrl: design.imageUrl ?? null,
    description: design.description ?? null,
    createdAt: design.createdAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const parsed = GetDesignParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [design] = await db
    .select()
    .from(designsTable)
    .where(eq(designsTable.id, parsed.data.id));
  if (!design) {
    res.status(404).json({ error: "Design not found" });
    return;
  }
  res.json({
    id: design.id,
    name: design.name,
    price: parseFloat(design.price),
    durationHours: parseFloat(design.durationHours),
    imageUrl: design.imageUrl ?? null,
    description: design.description ?? null,
    createdAt: design.createdAt.toISOString(),
  });
});

router.put("/:id", async (req, res) => {
  const paramsParsed = UpdateDesignParams.safeParse({ id: Number(req.params.id) });
  const bodyParsed = UpdateDesignBody.safeParse(req.body);
  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { name, price, durationHours, imageUrl, description } = bodyParsed.data;
  const [updated] = await db
    .update(designsTable)
    .set({
      name,
      price: price.toString(),
      durationHours: durationHours.toString(),
      imageUrl: imageUrl ?? null,
      description: description ?? null,
    })
    .where(eq(designsTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Design not found" });
    return;
  }
  res.json({
    id: updated.id,
    name: updated.name,
    price: parseFloat(updated.price),
    durationHours: parseFloat(updated.durationHours),
    imageUrl: updated.imageUrl ?? null,
    description: updated.description ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteDesignParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [deleted] = await db
    .delete(designsTable)
    .where(eq(designsTable.id, parsed.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Design not found" });
    return;
  }
  res.json({ message: "Design deleted successfully" });
});

export default router;
