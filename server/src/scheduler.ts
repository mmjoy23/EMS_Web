import { prisma } from "./db.js";
import { EMAIL_TYPE, EVENT_STATUS, REGISTRATION_STATUS } from "./lib/constants.js";
import {
  sendFeedbackRequestEmail,
  sendReminderEmail,
  toEventEmailData,
} from "./mail/mailer.js";

const DAY = 24 * 60 * 60 * 1000;

const eventInclude = { category: true } as const;

/** userIds that already received an email of `type` for this event. */
async function alreadyEmailed(eventId: string, type: string): Promise<Set<string>> {
  const rows = await prisma.emailMessage.findMany({
    where: { relatedEventId: eventId, type },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId).filter((id): id is string => !!id));
}

/**
 * Queue reminder emails for events starting within the next 24h.
 * Idempotent: skips attendees who already have a reminder for the event.
 */
export async function runReminderJob(now: Date = new Date()): Promise<number> {
  const windowEnd = new Date(now.getTime() + DAY);
  const events = await prisma.event.findMany({
    where: { status: EVENT_STATUS.PUBLISHED, startsAt: { gte: now, lte: windowEnd } },
    include: eventInclude,
  });

  let queued = 0;
  for (const event of events) {
    const [regs, sent] = await Promise.all([
      prisma.registration.findMany({
        where: { eventId: event.id, status: REGISTRATION_STATUS.REGISTERED },
        include: { user: true },
      }),
      alreadyEmailed(event.id, EMAIL_TYPE.REMINDER),
    ]);
    for (const reg of regs) {
      if (sent.has(reg.userId)) continue;
      await sendReminderEmail({
        userId: reg.userId,
        user: { name: reg.user.name, email: reg.user.email },
        eventId: event.id,
        event: toEventEmailData(event),
        ticketCode: reg.ticketCode,
      });
      queued++;
    }
  }
  return queued;
}

/**
 * Queue feedback-request emails for events that ended in the last 14 days.
 * Idempotent per attendee.
 */
export async function runFeedbackJob(now: Date = new Date()): Promise<number> {
  const windowStart = new Date(now.getTime() - 14 * DAY);
  const events = await prisma.event.findMany({
    where: { status: EVENT_STATUS.PUBLISHED, endsAt: { gte: windowStart, lt: now } },
    include: eventInclude,
  });

  let queued = 0;
  for (const event of events) {
    const [regs, sent] = await Promise.all([
      prisma.registration.findMany({
        where: { eventId: event.id, status: REGISTRATION_STATUS.REGISTERED },
        include: { user: true },
      }),
      alreadyEmailed(event.id, EMAIL_TYPE.FEEDBACK_REQUEST),
    ]);
    for (const reg of regs) {
      if (sent.has(reg.userId)) continue;
      await sendFeedbackRequestEmail({
        userId: reg.userId,
        user: { name: reg.user.name, email: reg.user.email },
        eventId: event.id,
        event: toEventEmailData(event),
      });
      queued++;
    }
  }
  return queued;
}

let running = false;

/** Run both jobs, guarding against overlapping runs. */
export async function runAllJobs(now: Date = new Date()) {
  if (running) return { reminders: 0, feedback: 0, skipped: true };
  running = true;
  try {
    const reminders = await runReminderJob(now);
    const feedback = await runFeedbackJob(now);
    return { reminders, feedback, skipped: false };
  } finally {
    running = false;
  }
}

/** Start the in-process scheduler: runs once on boot, then every 5 minutes. */
export function startScheduler() {
  const tick = async () => {
    try {
      const result = await runAllJobs();
      if (!result.skipped && (result.reminders || result.feedback)) {
        console.log(
          `[scheduler] queued ${result.reminders} reminder(s), ${result.feedback} feedback request(s)`,
        );
      }
    } catch (err) {
      console.error("[scheduler] job failed:", err);
    }
  };
  // Delay the first run briefly so it doesn't race server startup/seed.
  setTimeout(tick, 4000);
  return setInterval(tick, 5 * 60 * 1000);
}
