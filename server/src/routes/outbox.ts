import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { ROLES } from "../lib/constants.js";
import { asyncHandler, forbidden, notFound } from "../lib/http.js";
import { serializeEmail } from "../lib/serialize.js";

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/outbox — the current user's emails (admins may request scope=all)
// ---------------------------------------------------------------------------
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const isAdmin = req.user!.role === ROLES.ADMIN;
    const wantsAll = req.query.scope === "all" && isAdmin;
    const type = typeof req.query.type === "string" ? req.query.type : "";

    const where: Record<string, unknown> = {};
    if (!wantsAll) where.OR = [{ userId: req.user!.id }, { to: req.user!.email }];
    if (type && type !== "all") where.type = type;

    const rows = await prisma.emailMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ messages: rows.map((m) => serializeEmail(m, { includeHtml: false })) });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/outbox/:id — one rendered email (HTML included)
// ---------------------------------------------------------------------------
router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const msg = await prisma.emailMessage.findUnique({ where: { id: req.params.id } });
    if (!msg) throw notFound("Message not found");
    const isAdmin = req.user!.role === ROLES.ADMIN;
    const isOwner = msg.userId === req.user!.id || msg.to === req.user!.email;
    if (!isAdmin && !isOwner) throw forbidden();
    res.json({ message: serializeEmail(msg, { includeHtml: true }) });
  }),
);

export default router;
