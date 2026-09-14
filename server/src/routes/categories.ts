import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { ROLES } from "../lib/constants.js";
import { asyncHandler, badRequest, conflict } from "../lib/http.js";
import { serializeCategory } from "../lib/serialize.js";

const router = Router();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// GET /api/categories — list with a published-event count for filters/calendar.
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { events: true } } },
    });
    res.json({
      categories: categories.map((c) => serializeCategory(c, c._count.events)),
    });
  }),
);

// POST /api/categories — admin creates a category.
router.post(
  "/",
  requireAuth,
  requireRole(ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { name, color, icon } = req.body ?? {};
    if (!name || !color || !icon) throw badRequest("name, color and icon are required");
    const slug = slugify(String(name));
    const existing = await prisma.category.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (existing) throw conflict("A category with this name already exists");
    const category = await prisma.category.create({
      data: { name: String(name), slug, color: String(color), icon: String(icon) },
    });
    res.status(201).json({ category: serializeCategory(category, 0) });
  }),
);

export default router;
