import { Router } from "express";

const router = Router();

router.post("/admin/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    res.status(500).json({ error: "Admin password not configured" });
    return;
  }

  if (password === adminPassword) {
    res.json({ success: true, token: Buffer.from(`admin:${adminPassword}`).toString("base64") });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

router.get("/admin/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const adminPassword = process.env.ADMIN_PASSWORD;
  const expected = Buffer.from(`admin:${adminPassword}`).toString("base64");

  if (token === expected) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
