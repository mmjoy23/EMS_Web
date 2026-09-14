import { Router } from "express";
import { prisma } from "../db.js";
import {
  optionalAuth,
  requireAuth,
  requireEventManager,
  requireRole,
  userManagesEvent,
} from "../auth/middleware.js";
import { EVENT_STATUS, REGISTRATION_STATUS, ROLES } from "../lib/constants.js";
import {
  asyncHandler,
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../lib/http.js";
import { computeEventCounts, getEventCounts } from "../lib/seats.js";
import {
  serializeEvent,
  serializePerson,
  serializeRegistration,
} from "../lib/serialize.js";
import {
  createEventSchema,
  parseBody,
  updateEventSchema,
} from "../lib/validate.js";
import { sendCancellationEmail, toEventEmailData } from "../mail/mailer.js";

const router = Router();

const fullInclude = {
  category: true,
  host: true,
  coHosts: { include: { user: true } },
} as const;

function baseSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "event"
  );
}

/** Produce a slug not already used by another event. */
async function uniqueSlug(title: string): Promise<string> {
  const base = baseSlug(title);
  let slug = base;
  for (let i = 0; i < 50; i++) {
    const clash = await prisma.event.findUnique({ where: { slug } });
    if (!clash) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

async function resolveCategoryId(slug: string): Promise<string> {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) throw badRequest(`Unknown category: ${slug}`);
  return category.id;
}

/** Attach isRegistered to a serialized list for the current viewer (if any). */
async function withViewerFlags(
  events: ReturnType<typeof serializeEvent>[],
  userId: string | undefined,
) {
  if (!userId || events.length === 0) return events;
  const regs = await prisma.registration.findMany({
    where: {
      userId,
      eventId: { in: events.map((e) => e.id) },
      status: REGISTRATION_STATUS.REGISTERED,
    },
    select: { eventId: true },
  });
  const registered = new Set(regs.map((r) => r.eventId));
  return events.map((e) => ({ ...e, isRegistered: registered.has(e.id) }));
}

// ---------------------------------------------------------------------------
// GET /api/events — search / filter / sort
// ---------------------------------------------------------------------------
router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const categorySlug =
      typeof req.query.category === "string" ? req.query.category : "";
    const featured = req.query.featured === "true";
    const when = typeof req.query.when === "string" ? req.query.when : "";
    const mine = req.query.mine === "true";
    const now = new Date();

    const where: Record<string, unknown> = {};

    if (mine) {
      if (!req.user) throw forbidden("Sign in to view your events");
      // Events the viewer manages: host or co-host (admins see all elsewhere).
      where.OR = [
        { hostId: req.user.id },
        { coHosts: { some: { userId: req.user.id } } },
      ];
    } else {
      where.status = EVENT_STATUS.PUBLISHED;
    }

    if (q) {
      where.AND = [
        {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { location: { contains: q } },
          ],
        },
      ];
    }
    if (categorySlug && categorySlug !== "all") {
      where.category = { slug: categorySlug };
    }
    if (featured) where.featured = true;
    if (when === "upcoming") where.startsAt = { gte: now };
    if (when === "past") where.endsAt = { lt: now };

    const orderBy =
      when === "past"
        ? { startsAt: "desc" as const }
        : { startsAt: "asc" as const };

    const rows = await prisma.event.findMany({
      where,
      include: fullInclude,
      orderBy,
    });
    const counts = await computeEventCounts(rows.map((e) => e.id));
    const serialized = rows.map((e) => serializeEvent(e, counts.get(e.id)));
    const events = await withViewerFlags(serialized, req.user?.id);
    res.json({ events });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/events/featured — highlighted events for the homepage
// ---------------------------------------------------------------------------
router.get(
  "/featured",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const rows = await prisma.event.findMany({
      where: {
        status: EVENT_STATUS.PUBLISHED,
        featured: true,
        endsAt: { gte: now },
      },
      include: fullInclude,
      orderBy: { startsAt: "asc" },
      take: 6,
    });
    const counts = await computeEventCounts(rows.map((e) => e.id));
    const serialized = rows.map((e) => serializeEvent(e, counts.get(e.id)));
    const events = await withViewerFlags(serialized, req.user?.id);
    res.json({ events });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/events/:idOrSlug — one event (+ viewer's own registration)
// ---------------------------------------------------------------------------
router.get(
  "/:idOrSlug",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { idOrSlug } = req.params;
    const event = await prisma.event.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: fullInclude,
    });
    if (!event) throw notFound("Event not found");

    const counts = await getEventCounts(event.id);
    const serialized = serializeEvent(event, counts);

    let myRegistration = null;
    let canManage = false;
    if (req.user) {
      const reg = await prisma.registration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: req.user.id } },
      });
      if (reg) myRegistration = serializeRegistration(reg);
      canManage = await userManagesEvent(req.user.id, req.user.role, event.id);
    }

    res.json({
      event: {
        ...serialized,
        isRegistered: myRegistration?.status === "registered",
      },
      myRegistration,
      canManage,
    });
  }),
);

// ---------------------------------------------------------------------------
// POST /api/events — create (organizer or admin becomes the host)
// ---------------------------------------------------------------------------
router.post(
  "/",
  requireAuth,
  requireRole(ROLES.ORGANIZER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = parseBody(createEventSchema, req.body);
    if (data.endsAt <= data.startsAt)
      throw badRequest("Event must end after it starts");

    const categoryId = await resolveCategoryId(data.categorySlug);
    const slug = await uniqueSlug(data.title);

    // Validate co-hosts exist (ignore the host themselves / dupes).
    const coHostIds = [...new Set(data.coHostIds)].filter(
      (id) => id !== req.user!.id,
    );

    const event = await prisma.event.create({
      data: {
        slug,
        title: data.title,
        description: data.description ?? "",
        location: data.location,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        seatLimit: data.seatLimit,
        registrationDeadline: data.registrationDeadline ?? null,
        coverImage: data.coverImage ?? null,
        featured: data.featured ?? false,
        status: data.status ?? EVENT_STATUS.PUBLISHED,
        tags: JSON.stringify(data.tags ?? []),
        agenda: JSON.stringify(data.agenda ?? []),
        speakers: JSON.stringify(data.speakers ?? []),
        qrCheckinEnabled: data.qrCheckinEnabled,
        sendConfirmation: data.sendConfirmation,
        sendReminder: data.sendReminder,
        allowCancellation: data.allowCancellation,
        requireApproval: data.requireApproval,
        categoryId,
        hostId: req.user!.id,
        coHosts: coHostIds.length
          ? { create: coHostIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: fullInclude,
    });

    res
      .status(201)
      .json({ event: serializeEvent(event, { registered: 0, checkedIn: 0 }) });
  }),
);

// ---------------------------------------------------------------------------
// PATCH /api/events/:id — update (event manager)
// ---------------------------------------------------------------------------
router.patch(
  "/:id",
  requireAuth,
  requireEventManager("id"),
  asyncHandler(async (req, res) => {
    const data = parseBody(updateEventSchema, req.body);
    const id = req.params.id;

    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.location !== undefined) patch.location = data.location;
    if (data.startsAt !== undefined) patch.startsAt = data.startsAt;
    if (data.endsAt !== undefined) patch.endsAt = data.endsAt;
    if (data.seatLimit !== undefined) patch.seatLimit = data.seatLimit;
    if (data.registrationDeadline !== undefined)
      patch.registrationDeadline = data.registrationDeadline ?? null;
    if (data.coverImage !== undefined)
      patch.coverImage = data.coverImage ?? null;
    if (data.featured !== undefined) patch.featured = data.featured;
    if (data.status !== undefined) patch.status = data.status;
    if (data.tags !== undefined) patch.tags = JSON.stringify(data.tags);
    if (data.agenda !== undefined) patch.agenda = JSON.stringify(data.agenda);
    if (data.speakers !== undefined)
      patch.speakers = JSON.stringify(data.speakers);
    if (data.categorySlug !== undefined)
      patch.categoryId = await resolveCategoryId(data.categorySlug);

    const start = (patch.startsAt as Date) ?? undefined;
    const end = (patch.endsAt as Date) ?? undefined;
    if (start && end && end <= start)
      throw badRequest("Event must end after it starts");

    const event = await prisma.event.update({
      where: { id },
      data: patch,
      include: fullInclude,
    });
    const counts = await getEventCounts(id);
    res.json({ event: serializeEvent(event, counts) });
  }),
);

// ---------------------------------------------------------------------------
// POST /api/events/:id/cancel — cancel + notify registered attendees
// ---------------------------------------------------------------------------
router.post(
  "/:id/cancel",
  requireAuth,
  requireEventManager("id"),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason : null;

    const event = await prisma.event.update({
      where: { id },
      data: { status: EVENT_STATUS.CANCELLED },
      include: { category: true },
    });

    const regs = await prisma.registration.findMany({
      where: { eventId: id, status: REGISTRATION_STATUS.REGISTERED },
      include: { user: true },
    });
    for (const reg of regs) {
      await sendCancellationEmail({
        userId: reg.userId,
        user: { name: reg.user.name, email: reg.user.email },
        eventId: id,
        event: toEventEmailData(event),
        reason,
      });
    }

    res.json({ ok: true, notified: regs.length });
  }),
);

// ---------------------------------------------------------------------------
// POST /api/events/:id/duplicate — clone as a draft (event manager)
// ---------------------------------------------------------------------------
router.post(
  "/:id/duplicate",
  requireAuth,
  requireEventManager("id"),
  asyncHandler(async (req, res) => {
    const source = await prisma.event.findUnique({
      where: { id: req.params.id },
    });
    if (!source) throw notFound("Event not found");
    const slug = await uniqueSlug(`${source.title} copy`);
    const event = await prisma.event.create({
      data: {
        slug,
        title: `${source.title} (Copy)`,
        description: source.description,
        location: source.location,
        startsAt: source.startsAt,
        endsAt: source.endsAt,
        seatLimit: source.seatLimit,
        registrationDeadline: source.registrationDeadline,
        coverImage: source.coverImage,
        featured: false,
        status: EVENT_STATUS.DRAFT,
        tags: source.tags,
        agenda: source.agenda,
        speakers: source.speakers,
        categoryId: source.categoryId,
        hostId: req.user!.id,
      },
      include: fullInclude,
    });
    res
      .status(201)
      .json({ event: serializeEvent(event, { registered: 0, checkedIn: 0 }) });
  }),
);

// ---------------------------------------------------------------------------
// Co-hosts — only the host or an admin may change the co-host list
// ---------------------------------------------------------------------------
async function assertHostOrAdmin(
  req: { user?: { id: string; role: string } },
  eventId: string,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { hostId: true },
  });
  if (!event) throw notFound("Event not found");
  if (req.user!.role !== ROLES.ADMIN && event.hostId !== req.user!.id) {
    throw forbidden("Only the host or an admin can manage co-hosts");
  }
}

router.get(
  "/:id/cohosts",
  requireAuth,
  requireEventManager("id"),
  asyncHandler(async (req, res) => {
    const rows = await prisma.eventCoHost.findMany({
      where: { eventId: req.params.id },
      include: { user: true },
    });
    res.json({ coHosts: rows.map((r) => serializePerson(r.user)) });
  }),
);

router.post(
  "/:id/cohosts",
  requireAuth,
  asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    await assertHostOrAdmin(req, eventId);
    const userId = typeof req.body?.userId === "string" ? req.body.userId : "";
    if (!userId) throw badRequest("userId is required");

    const [event, user] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        select: { hostId: true },
      }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!user) throw notFound("User not found");
    if (event!.hostId === userId)
      throw conflict("The host is already a manager");

    await prisma.eventCoHost.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId },
      update: {},
    });
    res.status(201).json({ coHost: serializePerson(user) });
  }),
);

router.delete(
  "/:id/cohosts/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { id: eventId, userId } = req.params;
    await assertHostOrAdmin(req, eventId);
    await prisma.eventCoHost
      .delete({ where: { eventId_userId: { eventId, userId } } })
      .catch(() => undefined);
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/events/:id/participants — full list (event manager)
// ---------------------------------------------------------------------------
router.get(
  "/:id/participants",
  requireAuth,
  requireEventManager("id"),
  asyncHandler(async (req, res) => {
    const rows = await prisma.registration.findMany({
      where: { eventId: req.params.id },
      include: { user: true },
      orderBy: [{ status: "asc" }, { seatNumber: "asc" }],
    });
    res.json({
      participants: rows.map((r) => ({
        ...serializeRegistration(r, { includeTicket: true }),
        user: serializePerson(r.user),
      })),
    });
  }),
);

// ---------------------------------------------------------------------------
// GET /api/events/:id/report — registered vs attended (event manager)
// ---------------------------------------------------------------------------
router.get(
  "/:id/report",
  requireAuth,
  requireEventManager("id"),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const event = await prisma.event.findUnique({
      where: { id },
      include: fullInclude,
    });
    if (!event) throw notFound("Event not found");

    const registrations = await prisma.registration.findMany({
      where: { eventId: id, status: REGISTRATION_STATUS.REGISTERED },
      include: { user: true },
      orderBy: { seatNumber: "asc" },
    });
    const attended = registrations.filter((r) => r.checkedInAt != null);
    const registeredCount = registrations.length;
    const attendedCount = attended.length;
    const attendanceRate = registeredCount
      ? Math.round((attendedCount / registeredCount) * 100)
      : 0;

    res.json({
      event: serializeEvent(event, {
        registered: registeredCount,
        checkedIn: attendedCount,
      }),
      report: {
        registeredCount,
        attendedCount,
        noShowCount: registeredCount - attendedCount,
        attendanceRate,
        capacity: event.seatLimit,
        fillRate: event.seatLimit
          ? Math.round((registeredCount / event.seatLimit) * 100)
          : 0,
        attendees: registrations.map((r) => ({
          id: r.id,
          seatNumber: r.seatNumber,
          checkedIn: r.checkedInAt != null,
          checkedInAt: r.checkedInAt ? r.checkedInAt.toISOString() : null,
          user: serializePerson(r.user),
        })),
      },
    });
  }),
);

export default router;
