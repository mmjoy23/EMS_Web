import type { EventCounts } from "./seats.js";
import { remainingSeats } from "./seats.js";

// ---- JSON column helpers (tags/agenda/speakers are stored as JSON text) ----

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type AgendaItem = { time: string; title: string; speaker?: string };
export type Speaker = { name: string; role?: string; initials?: string };

// ---- People ----

type UserLike = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  studentId?: string | null;
  avatarColor?: string | null;
  createdAt?: Date;
};

/** Full user (own profile / auth responses). Never includes passwordHash. */
export function serializeUser(user: UserLike) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department ?? null,
    studentId: user.studentId ?? null,
    avatarColor: user.avatarColor ?? null,
    createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
  };
}

/** Compact person shape embedded in events/registrations. */
export function serializePerson(user: UserLike) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarColor: user.avatarColor ?? null,
    department: user.department ?? null,
  };
}

// ---- Category ----

type CategoryLike = {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
};

export function serializeCategory(category: CategoryLike, eventCount?: number) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    color: category.color,
    icon: category.icon,
    ...(eventCount === undefined ? {} : { eventCount }),
  };
}

// ---- Event ----

type EventLike = {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  seatLimit: number;
  priceCents?: number;
  registrationDeadline: Date | null;
  coverImage: string | null;
  featured: boolean;
  status: string;
  approvalStatus?: string;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  allowCancellation?: boolean;
  tags: string | null;
  agenda: string | null;
  speakers: string | null;
  createdAt: Date;
  updatedAt: Date;
  category?: CategoryLike | null;
  host?: UserLike | null;
  coHosts?: { user: UserLike }[];
};

export function serializeEvent(event: EventLike, counts?: EventCounts) {
  const registeredCount = counts?.registered ?? 0;
  const checkedInCount = counts?.checkedIn ?? 0;
  const remaining = remainingSeats(event.seatLimit, registeredCount);
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    registrationDeadline: event.registrationDeadline
      ? event.registrationDeadline.toISOString()
      : null,
    seatLimit: event.seatLimit,
    priceCents: event.priceCents ?? 0,
    registeredCount,
    remaining,
    checkedInCount,
    soldOut: remaining <= 0,
    coverImage: event.coverImage ?? null,
    featured: event.featured,
    status: event.status,
    approvalStatus: event.approvalStatus ?? "accepted",
    reviewedById: event.reviewedById ?? null,
    reviewedAt: event.reviewedAt ? event.reviewedAt.toISOString() : null,
    rejectionReason: event.rejectionReason ?? null,
    allowCancellation: event.allowCancellation ?? false,
    tags: parseJson<string[]>(event.tags, []),
    agenda: parseJson<AgendaItem[]>(event.agenda, []),
    speakers: parseJson<Speaker[]>(event.speakers, []),
    category: event.category ? serializeCategory(event.category) : null,
    host: event.host ? serializePerson(event.host) : null,
    coHosts: (event.coHosts ?? []).map((c) => serializePerson(c.user)),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

// ---- Registration ----

type RegistrationLike = {
  id: string;
  eventId: string;
  userId: string;
  status: string;
  ticketCode: string;
  seatNumber: number | null;
  checkedInAt: Date | null;
  createdAt: Date;
  event?: EventLike | null;
  user?: UserLike | null;
};

export function serializeRegistration(
  reg: RegistrationLike,
  opts?: { event?: ReturnType<typeof serializeEvent>; includeTicket?: boolean },
) {
  const includeTicket = opts?.includeTicket ?? true;
  return {
    id: reg.id,
    eventId: reg.eventId,
    userId: reg.userId,
    status: reg.status,
    ticketCode: includeTicket ? reg.ticketCode : undefined,
    seatNumber: reg.seatNumber ?? null,
    checkedIn: reg.checkedInAt != null,
    checkedInAt: reg.checkedInAt ? reg.checkedInAt.toISOString() : null,
    createdAt: reg.createdAt.toISOString(),
    event: opts?.event ?? undefined,
    user: reg.user ? serializePerson(reg.user) : undefined,
  };
}

// ---- Email (Outbox) ----

type EmailLike = {
  id: string;
  to: string;
  toName: string | null;
  subject: string;
  type: string;
  html: string;
  relatedEventId: string | null;
  userId: string | null;
  createdAt: Date;
};

export function serializeEmail(
  msg: EmailLike,
  opts?: { includeHtml?: boolean },
) {
  const includeHtml = opts?.includeHtml ?? true;
  return {
    id: msg.id,
    to: msg.to,
    toName: msg.toName ?? null,
    subject: msg.subject,
    type: msg.type,
    html: includeHtml ? msg.html : undefined,
    relatedEventId: msg.relatedEventId ?? null,
    userId: msg.userId ?? null,
    createdAt: msg.createdAt.toISOString(),
  };
}
