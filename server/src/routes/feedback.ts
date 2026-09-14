import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, userManagesEvent } from "../auth/middleware.js";
import { REGISTRATION_STATUS } from "../lib/constants.js";
import { asyncHandler, conflict, forbidden, notFound } from "../lib/http.js";
import { computeEventCounts } from "../lib/seats.js";
import { serializeEvent, serializePerson } from "../lib/serialize.js";
import { feedbackSchema, parseBody } from "../lib/validate.js";

const router = Router();

const eventInclude = { category: true, host: true, coHosts: { include: { user: true } } } as const;

// ---------------------------------------------------------------------------
// POST /api/feedback — submit feedback for an event the user attended
// ---------------------------------------------------------------------------
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId = typeof req.body?.eventId === "string" ? req.body.eventId : "";
    if (!eventId) throw conflict("eventId is required");
    const data = parseBody(feedbackSchema, req.body);
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw notFound("Event not found");

    const reg = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!reg || reg.status !== REGISTRATION_STATUS.REGISTERED) {
      throw forbidden("Only registered attendees can leave feedback");
    }
    if (event.endsAt > new Date()) throw conflict("You can leave feedback once the event has ended");

    const feedback = await prisma.feedback.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, rating: data.rating, comment: data.comment || null },
      update: { rating: data.rating, comment: data.comment || null },
    });

    res.status(201).json({
      feedback: {
        id: feedback.id,
        eventId,
        rating: feedback.rating,
        comment: feedback.comment,
        createdAt: feedback.createdAt.toISOString(),
      },
    });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/feedback/me — feedback the current user has submitted
// ---------------------------------------------------------------------------
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await prisma.feedback.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      feedback: rows.map((f) => ({
        id: f.id,
        eventId: f.eventId,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt.toISOString(),
      })),
    });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/feedback/pending — ended events the user hasn't rated yet
// ---------------------------------------------------------------------------
router.get(
  "/pending",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const now = new Date();
    const regs = await prisma.registration.findMany({
      where: {
        userId,
        status: REGISTRATION_STATUS.REGISTERED,
        event: { endsAt: { lt: now } },
      },
      include: { event: { include: eventInclude } },
      orderBy: { event: { endsAt: "desc" } },
    });
    const myFeedback = await prisma.feedback.findMany({
      where: { userId },
      select: { eventId: true },
    });
    const rated = new Set(myFeedback.map((f) => f.eventId));
    const pending = regs.filter((r) => !rated.has(r.eventId));
    const counts = await computeEventCounts(pending.map((r) => r.eventId));
    res.json({
      events: pending.map((r) => serializeEvent(r.event, counts.get(r.eventId))),
    });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/feedback/event/:eventId — all feedback for an event (manager)
// ---------------------------------------------------------------------------
router.get(
  "/event/:eventId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const allowed = await userManagesEvent(req.user!.id, req.user!.role, eventId);
    if (!allowed) throw forbidden("You do not manage this event");

    const rows = await prisma.feedback.findMany({
      where: { eventId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    const count = rows.length;
    const average = count ? rows.reduce((s, f) => s + f.rating, 0) / count : 0;
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: rows.filter((f) => f.rating === star).length,
    }));

    res.json({
      summary: { count, average: Math.round(average * 10) / 10, distribution },
      feedback: rows.map((f) => ({
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt.toISOString(),
        user: serializePerson(f.user),
      })),
    });
  }),
);

export default router;
