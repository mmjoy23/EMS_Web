import { randomUUID } from "node:crypto";
import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { EVENT_STATUS, REGISTRATION_STATUS } from "../lib/constants.js";
import { asyncHandler, badRequest, conflict, notFound } from "../lib/http.js";
import { assertOpenForRegistration, computeEventCounts } from "../lib/seats.js";
import { serializeEvent, serializeRegistration } from "../lib/serialize.js";
import { sendConfirmationEmail, toEventEmailData } from "../mail/mailer.js";
import {
  calculateCancellation,
  cancellationRefundStatus,
} from "../lib/cancellation.js";

const router = Router();

const newTicketCode = () =>
  `UEV-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;

const eventInclude = {
  category: true,
  host: true,
  coHosts: { include: { user: true } },
} as const;

// ---------------------------------------------------------------------------
// POST /api/registrations — register the current user for an event
// ---------------------------------------------------------------------------
router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId =
      typeof req.body?.eventId === "string" ? req.body.eventId : "";
    if (!eventId) throw badRequest("eventId is required");
    const userId = req.user!.id;

    // Serialized transaction guards against overselling the last seat.
    const registration = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event) throw notFound("Event not found");
      if (event.status !== EVENT_STATUS.PUBLISHED) {
        throw conflict("This event is not open for registration");
      }

      const existing = await tx.registration.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });
      if (existing && existing.status === REGISTRATION_STATUS.REGISTERED) {
        throw conflict("You're already registered for this event");
      }

      const registeredCount = await tx.registration.count({
        where: { eventId, status: REGISTRATION_STATUS.REGISTERED },
      });
      assertOpenForRegistration({
        seatLimit: event.seatLimit,
        registeredCount,
        registrationDeadline: event.registrationDeadline,
        startsAt: event.startsAt,
      });

      const maxSeat = await tx.registration.aggregate({
        where: { eventId, status: REGISTRATION_STATUS.REGISTERED },
        _max: { seatNumber: true },
      });
      const seatNumber = (maxSeat._max.seatNumber ?? 0) + 1;

      if (existing) {
        return tx.registration.update({
          where: { id: existing.id },
          data: {
            status: REGISTRATION_STATUS.REGISTERED,
            seatNumber,
            checkedInAt: null,
            ticketCode: existing.ticketCode || newTicketCode(),
            paymentStatus: event.priceCents > 0 ? "pending" : "succeeded",
          },
        });
      }
      return tx.registration.create({
        data: {
          eventId,
          userId,
          status: REGISTRATION_STATUS.REGISTERED,
          ticketCode: newTicketCode(),
          seatNumber,
          paymentStatus: event.priceCents > 0 ? "pending" : "succeeded",
        },
      });
    });

    // Confirmation email (Outbox) — outside the transaction.
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { category: true },
    });
    if (event) {
      await sendConfirmationEmail({
        userId,
        user: { name: req.user!.name, email: req.user!.email },
        eventId,
        event: toEventEmailData(event),
        ticketCode: registration.ticketCode,
        seatNumber: registration.seatNumber,
      });
    }

    res.status(201).json({ registration: serializeRegistration(registration) });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/registrations/:eventId/cancellation-preview — preview only
// ---------------------------------------------------------------------------
router.get(
  "/:eventId/cancellation-preview",
  requireAuth,
  asyncHandler(async (req, res) => {
    const registration = await prisma.registration.findUnique({
      where: {
        eventId_userId: { eventId: req.params.eventId, userId: req.user!.id },
      },
      include: { event: true },
    });
    if (!registration || registration.status !== REGISTRATION_STATUS.REGISTERED)
      throw conflict("You're not registered for this event");
    if (
      registration.paidAmountCents > 0 &&
      !registration.event.allowCancellation
    )
      throw conflict("Cancellation is not allowed for this event");
    const calculation = calculateCancellation(
      registration.event.startsAt,
      registration.paidAmountCents,
      registration.paymentStatus,
    );
    res.json({
      event: {
        id: registration.event.id,
        title: registration.event.title,
        startsAt: registration.event.startsAt.toISOString(),
      },
      paidAmountCents: registration.paidAmountCents,
      paymentStatus: registration.paymentStatus,
      ...calculation,
      refundStatus: cancellationRefundStatus(
        registration.paidAmountCents,
        registration.paymentStatus,
        calculation.refundAmountCents,
      ),
    });
  }),
);

// ---------------------------------------------------------------------------
// POST /api/registrations/:eventId/cancel — confirm cancellation
// ---------------------------------------------------------------------------
router.post(
  "/:eventId/cancel",
  requireAuth,
  asyncHandler(async (req, res) => {
    const registration = await prisma.registration.findUnique({
      where: {
        eventId_userId: { eventId: req.params.eventId, userId: req.user!.id },
      },
      include: { event: true, cancellation: true },
    });
    if (!registration || registration.status !== REGISTRATION_STATUS.REGISTERED)
      throw conflict("You're not registered for this event");
    if (
      registration.paidAmountCents > 0 &&
      !registration.event.allowCancellation
    )
      throw conflict("Cancellation is not allowed for this event");
    if (registration.cancellation)
      throw conflict("This registration has already been cancelled");
    const calculation = calculateCancellation(
      registration.event.startsAt,
      registration.paidAmountCents,
      registration.paymentStatus,
    );
    const refundStatus = cancellationRefundStatus(
      registration.paidAmountCents,
      registration.paymentStatus,
      calculation.refundAmountCents,
    );
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.registration.updateMany({
        where: { id: registration.id, status: REGISTRATION_STATUS.REGISTERED },
        data: { status: REGISTRATION_STATUS.CANCELLED, checkedInAt: null },
      });
      if (updated.count !== 1)
        throw conflict("Registration is no longer active");
      await tx.cancellation.create({
        data: {
          registrationId: registration.id,
          originalPaidAmountCents: registration.paidAmountCents,
          penaltyPercentage: calculation.penaltyPercentage,
          penaltyAmountCents: calculation.penaltyAmountCents,
          refundAmountCents: calculation.refundAmountCents,
          refundStatus,
        },
      });
      return tx.registration.findUnique({ where: { id: registration.id } });
    });
    res.json({
      registration: serializeRegistration(result!),
      cancellation: { ...calculation, refundStatus },
    });
  }),
);

// ---------------------------------------------------------------------------
// DELETE /api/registrations/:eventId — legacy immediate cancellation disabled
// ---------------------------------------------------------------------------
router.delete(
  "/:eventId",
  requireAuth,
  asyncHandler(async (req, res) => {
    throw conflict("Cancellation requires a preview and confirmation");
  }),
);

// ---------------------------------------------------------------------------
// GET /api/registrations/me — the current user's registrations (+ events)
// ---------------------------------------------------------------------------
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      include: { event: { include: eventInclude } },
      orderBy: { event: { startsAt: "asc" } },
    });
    const counts = await computeEventCounts(rows.map((r) => r.eventId));
    const registrations = rows.map((r) =>
      serializeRegistration(r, {
        event: serializeEvent(r.event, counts.get(r.eventId)),
      }),
    );
    res.json({ registrations });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/registrations/:eventId/ticket — QR pass data for one event
// ---------------------------------------------------------------------------
router.get(
  "/:eventId/ticket",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const reg = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId: req.user!.id } },
      include: { event: { include: eventInclude } },
    });
    if (!reg || reg.status !== REGISTRATION_STATUS.REGISTERED) {
      throw notFound("No active registration found for this event");
    }
    const counts = await computeEventCounts([eventId]);
    res.json({
      ticket: {
        ticketCode: reg.ticketCode,
        seatNumber: reg.seatNumber,
        checkedIn: reg.checkedInAt != null,
        checkedInAt: reg.checkedInAt ? reg.checkedInAt.toISOString() : null,
        holderName: req.user!.name,
        event: serializeEvent(reg.event, counts.get(eventId)),
      },
    });
  }),
);

export default router;
