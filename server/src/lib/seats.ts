import { prisma } from "../db.js";
import { REGISTRATION_STATUS } from "./constants.js";
import { conflict } from "./http.js";

export type EventCounts = { registered: number; checkedIn: number };

/** Remaining seats never goes below zero even if data is inconsistent. */
export function remainingSeats(seatLimit: number, registeredCount: number): number {
  return Math.max(0, seatLimit - registeredCount);
}

/**
 * Compute registered + checked-in counts for many events in two grouped queries
 * (avoids an N+1 when serializing event lists).
 */
export async function computeEventCounts(eventIds: string[]): Promise<Map<string, EventCounts>> {
  const map = new Map<string, EventCounts>();
  if (eventIds.length === 0) return map;
  for (const id of eventIds) map.set(id, { registered: 0, checkedIn: 0 });

  const [registered, checkedIn] = await Promise.all([
    prisma.registration.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds }, status: REGISTRATION_STATUS.REGISTERED },
      _count: { _all: true },
    }),
    prisma.registration.groupBy({
      by: ["eventId"],
      where: {
        eventId: { in: eventIds },
        status: REGISTRATION_STATUS.REGISTERED,
        checkedInAt: { not: null },
      },
      _count: { _all: true },
    }),
  ]);

  for (const row of registered) {
    const entry = map.get(row.eventId);
    if (entry) entry.registered = row._count._all;
  }
  for (const row of checkedIn) {
    const entry = map.get(row.eventId);
    if (entry) entry.checkedIn = row._count._all;
  }
  return map;
}

/** Convenience for a single event. */
export async function getEventCounts(eventId: string): Promise<EventCounts> {
  const map = await computeEventCounts([eventId]);
  return map.get(eventId) ?? { registered: 0, checkedIn: 0 };
}

/**
 * Guard used inside the register transaction. Throws a 409 when the event is
 * full or its registration window has closed.
 */
export function assertOpenForRegistration(opts: {
  seatLimit: number;
  registeredCount: number;
  registrationDeadline: Date | null;
  startsAt: Date;
  now?: Date;
}): void {
  const now = opts.now ?? new Date();
  const deadline = opts.registrationDeadline ?? opts.startsAt;
  if (now > deadline) throw conflict("Registration for this event has closed");
  if (remainingSeats(opts.seatLimit, opts.registeredCount) <= 0) {
    throw conflict("This event is sold out");
  }
}
