import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../auth/middleware.js";
import {
  COMPLAINT_STATUS,
  EVENT_APPROVAL_STATUS,
  EVENT_STATUS,
  FINE_STATUS,
  REGISTRATION_STATUS,
  ROLES,
} from "../lib/constants.js";
import {
  asyncHandler,
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../lib/http.js";
import { serializeEvent, serializePerson } from "../lib/serialize.js";
import { getEventCounts } from "../lib/seats.js";

const router = Router();
const adminOnly = [requireAuth, requireRole(ROLES.ADMIN)] as const;
const eventInclude = {
  category: true,
  host: true,
  coHosts: { include: { user: true } },
} as const;
const COMPLAINT_CATEGORIES = [
  "event_cancelled",
  "misleading_information",
  "organizer_misconduct",
  "venue_problem",
  "registration_problem",
  "poor_management",
  "payment_issue",
  "other",
] as const;
const MAX_EVIDENCE_LENGTH = 2 * 1024 * 1024 * 1.4;

function validateEvidence(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.length > MAX_EVIDENCE_LENGTH) {
    throw badRequest("Evidence must be smaller than 2MB");
  }
  const match = value.match(
    /^data:(image\/(?:png|jpeg)|application\/pdf|text\/plain);base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match)
    throw badRequest("Evidence must be a PNG, JPEG, PDF, or text file");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 2 * 1024 * 1024)
    throw badRequest("Evidence must be smaller than 2MB");
  const validMagic =
    (match[1] === "image/png" &&
      bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") ||
    (match[1] === "image/jpeg" &&
      bytes.subarray(0, 3).toString("hex") === "ffd8ff") ||
    (match[1] === "application/pdf" &&
      bytes.subarray(0, 4).toString() === "%PDF") ||
    match[1] === "text/plain";
  if (!validMagic) throw badRequest("Evidence file content is invalid");
  return value;
}

function participantComplaint(row: any) {
  const complaint = serializeComplaint(row);
  return {
    id: complaint.id,
    category: row.category ?? "other",
    subject: complaint.subject,
    description: complaint.description,
    evidencePath: complaint.evidencePath,
    status: complaint.status,
    adminNote: complaint.adminNote,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    reviewedAt: complaint.reviewedAt,
    event: complaint.event,
    fineOutcome: row.fine
      ? "Your complaint was reviewed and an administrative action was taken."
      : null,
  };
}

function serializeComplaint(row: any) {
  return {
    id: row.id,
    category: row.category ?? "other",
    subject: row.subject,
    description: row.description,
    evidencePath: row.evidencePath,
    status: row.status,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    event: row.event ? serializeEvent(row.event, row.eventCounts) : undefined,
    participant: row.participant ? serializePerson(row.participant) : undefined,
    reviewedBy: row.reviewedBy ? serializePerson(row.reviewedBy) : null,
    fine: row.fine
      ? {
          id: row.fine.id,
          amount: row.fine.amount,
          reason: row.fine.reason,
          status: row.fine.status,
          issuedAt: row.fine.issuedAt.toISOString(),
          issuedBy: row.fine.issuedBy
            ? serializePerson(row.fine.issuedBy)
            : null,
        }
      : null,
  };
}

function serializeFine(row: any) {
  return {
    id: row.id,
    complaintId: row.complaintId,
    eventId: row.eventId,
    amount: row.amount,
    reason: row.reason,
    status: row.status,
    issuedAt: row.issuedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    event: row.event ? serializeEvent(row.event, row.eventCounts) : undefined,
    eventCreator: row.eventCreator
      ? serializePerson(row.eventCreator)
      : undefined,
    issuedBy: row.issuedBy ? serializePerson(row.issuedBy) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Event request review
// ---------------------------------------------------------------------------
router.get(
  "/event-requests",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const status =
      typeof req.query.status === "string" ? req.query.status : "all";
    const where = status === "all" ? {} : { approvalStatus: status };
    const rows = await prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: { createdAt: "desc" },
    });
    const counts = await Promise.all(rows.map((row) => getEventCounts(row.id)));
    res.json({
      requests: rows.map((row, index) => serializeEvent(row, counts[index])),
    });
  }),
);

router.post(
  "/event-requests/:id/decision",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const decision = req.body?.decision;
    if (
      decision !== EVENT_APPROVAL_STATUS.ACCEPTED &&
      decision !== EVENT_APPROVAL_STATUS.REJECTED
    ) {
      throw badRequest("decision must be accepted or rejected");
    }
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (decision === EVENT_APPROVAL_STATUS.REJECTED && !reason) {
      throw badRequest("A rejection reason is required");
    }
    const current = await prisma.event.findUnique({
      where: { id: String(req.params.id) },
    });
    if (!current) throw notFound("Event request not found");
    if (current.approvalStatus !== EVENT_APPROVAL_STATUS.PENDING) {
      throw conflict("Only pending event requests can be reviewed");
    }
    const event = await prisma.event.update({
      where: { id: current.id },
      data: {
        approvalStatus: decision,
        status:
          decision === EVENT_APPROVAL_STATUS.ACCEPTED
            ? EVENT_STATUS.PUBLISHED
            : EVENT_STATUS.DRAFT,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
        rejectionReason:
          decision === EVENT_APPROVAL_STATUS.REJECTED ? reason : null,
      },
      include: eventInclude,
    });
    res.json({ event: serializeEvent(event, await getEventCounts(event.id)) });
  }),
);

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------
router.post(
  "/complaints",
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId =
      typeof req.body?.eventId === "string" ? req.body.eventId : "";
    const subject =
      typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
    const description =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : "";
    const category =
      typeof req.body?.category === "string" ? req.body.category.trim() : "";
    const evidencePath = validateEvidence(req.body?.evidencePath);
    if (!eventId || !category || !subject || !description)
      throw badRequest("event, category, subject and description are required");
    if (
      !COMPLAINT_CATEGORIES.includes(
        category as (typeof COMPLAINT_CATEGORIES)[number],
      )
    )
      throw badRequest("Invalid complaint category");
    if (
      category.length > 40 ||
      subject.length > 160 ||
      description.length > 5000
    )
      throw badRequest("Complaint fields exceed the allowed length");
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw notFound("Event not found");
    const registration = await prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId: req.user!.id } },
    });
    if (
      !registration ||
      registration.status !== REGISTRATION_STATUS.REGISTERED
    ) {
      throw forbidden(
        "Only registered participants can submit an event complaint",
      );
    }
    const complaint = await prisma.complaint.create({
      data: {
        eventId,
        participantId: req.user!.id,
        category,
        subject,
        description,
        evidencePath,
      },
      include: {
        event: { include: eventInclude },
        participant: true,
        reviewedBy: true,
        fine: true,
      },
    });
    res.status(201).json({ complaint: participantComplaint(complaint) });
  }),
);

router.get(
  "/complaints/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await prisma.complaint.findMany({
      where: { participantId: req.user!.id },
      include: {
        event: { include: eventInclude },
        participant: true,
        reviewedBy: true,
        fine: { include: { issuedBy: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const complaints = rows.map(participantComplaint);
    res.json({
      complaints,
      summary: {
        total: complaints.length,
        underReview: complaints.filter(
          (item) => item.status === COMPLAINT_STATUS.UNDER_REVIEW,
        ).length,
        resolved: complaints.filter(
          (item) => item.status === COMPLAINT_STATUS.RESOLVED,
        ).length,
      },
    });
  }),
);

router.get(
  "/complaints/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const row = await prisma.complaint.findFirst({
      where: { id: String(req.params.id), participantId: req.user!.id },
      include: {
        event: { include: eventInclude },
        participant: true,
        reviewedBy: true,
        fine: { include: { issuedBy: true } },
      },
    });
    if (!row) throw notFound("Complaint not found");
    res.json({ complaint: participantComplaint(row) });
  }),
);

router.get(
  "/complaints/managed",
  requireAuth,
  requireRole(ROLES.ORGANIZER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const rows = await prisma.complaint.findMany({
      where: {
        event: {
          OR: [
            { hostId: req.user!.id },
            { coHosts: { some: { userId: req.user!.id } } },
          ],
        },
      },
      include: {
        event: { include: eventInclude },
        participant: true,
        reviewedBy: true,
        fine: { include: { issuedBy: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ complaints: rows.map(serializeComplaint) });
  }),
);

router.get(
  "/complaints",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const status =
      typeof req.query.status === "string" ? req.query.status : "all";
    const rows = await prisma.complaint.findMany({
      where: status === "all" ? {} : { status },
      include: {
        event: { include: eventInclude },
        participant: true,
        reviewedBy: true,
        fine: { include: { issuedBy: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ complaints: rows.map(serializeComplaint) });
  }),
);

router.patch(
  "/complaints/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const status = req.body?.status;
    if (!Object.values(COMPLAINT_STATUS).includes(status))
      throw badRequest("Invalid complaint status");
    const adminNote =
      typeof req.body?.adminNote === "string"
        ? req.body.adminNote.trim()
        : null;
    const complaint = await prisma.complaint.update({
      where: { id: String(req.params.id) },
      data: {
        status,
        adminNote,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
      },
      include: {
        event: { include: eventInclude },
        participant: true,
        reviewedBy: true,
        fine: { include: { issuedBy: true } },
      },
    });
    res.json({ complaint: serializeComplaint(complaint) });
  }),
);

// ---------------------------------------------------------------------------
// Fines
// ---------------------------------------------------------------------------
router.get(
  "/fines",
  requireAuth,
  asyncHandler(async (req, res) => {
    const where =
      req.user!.role === ROLES.ADMIN ? {} : { eventCreatorId: req.user!.id };
    const rows = await prisma.fine.findMany({
      where,
      include: {
        event: { include: eventInclude },
        eventCreator: true,
        issuedBy: true,
      },
      orderBy: { issuedAt: "desc" },
    });
    res.json({ fines: rows.map(serializeFine) });
  }),
);

router.post(
  "/fines",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const complaintId =
      typeof req.body?.complaintId === "string" ? req.body.complaintId : "";
    const amount = Number(req.body?.amount);
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!complaintId || !Number.isInteger(amount) || amount <= 0 || !reason) {
      throw badRequest(
        "complaintId, a positive integer amount and reason are required",
      );
    }
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { event: true, fine: true },
    });
    if (!complaint) throw notFound("Complaint not found");
    if (complaint.status !== COMPLAINT_STATUS.RESOLVED)
      throw conflict("Resolve the complaint before issuing a fine");
    if (complaint.fine)
      throw conflict("A fine has already been issued for this complaint");
    const fine = await prisma.fine.create({
      data: {
        complaintId,
        eventId: complaint.eventId,
        eventCreatorId: complaint.event.hostId,
        issuedById: req.user!.id,
        amount,
        reason,
      },
      include: {
        event: { include: eventInclude },
        eventCreator: true,
        issuedBy: true,
      },
    });
    res.status(201).json({ fine: serializeFine(fine) });
  }),
);

router.patch(
  "/fines/:id",
  ...adminOnly,
  asyncHandler(async (req, res) => {
    const status = req.body?.status;
    if (
      ![FINE_STATUS.PAID, FINE_STATUS.WAIVED, FINE_STATUS.ISSUED].includes(
        status,
      )
    )
      throw badRequest("Invalid fine status");
    const fine = await prisma.fine.update({
      where: { id: String(req.params.id) },
      data: { status },
      include: {
        event: { include: eventInclude },
        eventCreator: true,
        issuedBy: true,
      },
    });
    res.json({ fine: serializeFine(fine) });
  }),
);

export default router;
