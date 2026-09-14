import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole, userManagesEvent } from "../auth/middleware.js";
import { REGISTRATION_STATUS, ROLES } from "../lib/constants.js";
import { asyncHandler, forbidden } from "../lib/http.js";
import { getEventCounts } from "../lib/seats.js";
import { checkinSchema, parseBody } from "../lib/validate.js";
import { serializePerson } from "../lib/serialize.js";

const router = Router();

/**
 * POST /api/checkin — scan a ticket QR (or paste its code) to check a person in.
 *
 * Returns HTTP 200 with a typed `result` for every recognised outcome so the
 * scanner UI can render the right state without treating them as errors:
 *   success | already_checked_in | cancelled | wrong_event | invalid
 */
router.post(
  "/",
  requireAuth,
  requireRole(ROLES.ORGANIZER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { code, eventId } = parseBody(checkinSchema, req.body);

    const reg = await prisma.registration.findUnique({
      where: { ticketCode: code.trim() },
      include: { user: true, event: { include: { category: true } } },
    });

    if (!reg) {
      return res.json({ result: "invalid", message: "Ticket not recognised" });
    }

    // The scanner must manage the event this ticket belongs to.
    const canManage = await userManagesEvent(req.user!.id, req.user!.role, reg.eventId);
    if (!canManage) throw forbidden("You don't manage this event");

    const eventSummary = {
      id: reg.event.id,
      title: reg.event.title,
      startsAt: reg.event.startsAt.toISOString(),
      location: reg.event.location,
    };
    const attendee = {
      ...serializePerson(reg.user),
      seatNumber: reg.seatNumber,
      ticketCode: reg.ticketCode,
    };

    if (eventId && eventId !== reg.eventId) {
      return res.json({
        result: "wrong_event",
        message: `This ticket is for "${reg.event.title}"`,
        attendee,
        event: eventSummary,
      });
    }

    if (reg.status === REGISTRATION_STATUS.CANCELLED) {
      return res.json({
        result: "cancelled",
        message: "This registration was cancelled",
        attendee,
        event: eventSummary,
      });
    }

    if (reg.checkedInAt) {
      const counts = await getEventCounts(reg.eventId);
      return res.json({
        result: "already_checked_in",
        message: "Already checked in",
        attendee,
        event: eventSummary,
        checkedInAt: reg.checkedInAt.toISOString(),
        counts: { registered: counts.registered, checkedIn: counts.checkedIn },
      });
    }

    const now = new Date();
    await prisma.registration.update({
      where: { id: reg.id },
      data: { checkedInAt: now },
    });
    const counts = await getEventCounts(reg.eventId);

    return res.json({
      result: "success",
      message: "Checked in",
      attendee,
      event: eventSummary,
      checkedInAt: now.toISOString(),
      counts: { registered: counts.registered, checkedIn: counts.checkedIn },
    });
  }),
);

export default router;
