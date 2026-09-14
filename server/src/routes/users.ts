import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { ROLES } from "../lib/constants.js";
import { asyncHandler } from "../lib/http.js";
import { serializePerson } from "../lib/serialize.js";

const router = Router();

// GET /api/users — directory for co-host pickers and admin views.
// Organizers/admins only; supports ?q= and ?role= filters.
router.get(
  "/",
  requireAuth,
  requireRole(ROLES.ORGANIZER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const role = typeof req.query.role === "string" ? req.query.role : "";

    const where: Record<string, unknown> = {};
    if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }];
    if (role && role !== "all") where.role = role;

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      take: 100,
    });
    res.json({ users: users.map((u) => serializePerson(u)) });
  }),
);

export default router;
