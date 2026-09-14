import QRCode from "qrcode";
import { prisma } from "../db.js";
import { env } from "../env.js";
import { EMAIL_TYPE, type EmailType } from "../lib/constants.js";
import {
  cancellationEmail,
  confirmationEmail,
  feedbackRequestEmail,
  reminderEmail,
  type EventEmailData,
  type UserEmailData,
} from "./templates.js";

/** Encode arbitrary text (a ticket code) as a QR data URL for embedding in HTML. */
export async function renderQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}

type QueueArgs = {
  to: string;
  toName?: string | null;
  subject: string;
  type: EmailType;
  html: string;
  userId?: string | null;
  relatedEventId?: string | null;
};

/**
 * Persist an email to the Outbox. When SMTP_URL is configured this is also the
 * single place to hand the message to a real transport (see note below).
 */
export async function queueEmail(args: QueueArgs) {
  const message = await prisma.emailMessage.create({
    data: {
      to: args.to,
      toName: args.toName ?? null,
      subject: args.subject,
      type: args.type,
      html: args.html,
      userId: args.userId ?? null,
      relatedEventId: args.relatedEventId ?? null,
    },
  });

  // --- Real SMTP plug-in point -------------------------------------------
  // To actually send, set SMTP_URL in .env, `npm i nodemailer`, and here:
  //   const transport = nodemailer.createTransport(env.SMTP_URL);
  //   await transport.sendMail({ to: args.to, subject: args.subject, html: args.html });
  // The Outbox row above stays as the delivery log. Disabled by default.
  if (env.SMTP_URL) {
    console.warn(
      `[mailer] SMTP_URL is set but no transport is wired; email "${args.subject}" was stored in the Outbox only.`,
    );
  }

  return message;
}

type BaseArgs = { userId: string; user: UserEmailData; eventId: string; event: EventEmailData };

export async function sendConfirmationEmail(
  args: BaseArgs & { ticketCode: string; seatNumber?: number | null },
) {
  const qrDataUrl = await renderQrDataUrl(args.ticketCode);
  const { subject, html } = confirmationEmail({
    user: args.user,
    event: args.event,
    ticketCode: args.ticketCode,
    seatNumber: args.seatNumber ?? null,
    qrDataUrl,
  });
  return queueEmail({
    to: args.user.email,
    toName: args.user.name,
    subject,
    type: EMAIL_TYPE.CONFIRMATION,
    html,
    userId: args.userId,
    relatedEventId: args.eventId,
  });
}

export async function sendReminderEmail(args: BaseArgs & { ticketCode?: string | null }) {
  const { subject, html } = reminderEmail({
    user: args.user,
    event: args.event,
    ticketCode: args.ticketCode ?? null,
  });
  return queueEmail({
    to: args.user.email,
    toName: args.user.name,
    subject,
    type: EMAIL_TYPE.REMINDER,
    html,
    userId: args.userId,
    relatedEventId: args.eventId,
  });
}

export async function sendFeedbackRequestEmail(args: BaseArgs) {
  const { subject, html } = feedbackRequestEmail({ user: args.user, event: args.event });
  return queueEmail({
    to: args.user.email,
    toName: args.user.name,
    subject,
    type: EMAIL_TYPE.FEEDBACK_REQUEST,
    html,
    userId: args.userId,
    relatedEventId: args.eventId,
  });
}

export async function sendCancellationEmail(args: BaseArgs & { reason?: string | null }) {
  const { subject, html } = cancellationEmail({
    user: args.user,
    event: args.event,
    reason: args.reason ?? null,
  });
  return queueEmail({
    to: args.user.email,
    toName: args.user.name,
    subject,
    type: EMAIL_TYPE.CANCELLATION,
    html,
    userId: args.userId,
    relatedEventId: args.eventId,
  });
}

/** Build the template-facing event shape from a Prisma event row + category. */
export function toEventEmailData(event: {
  title: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  category?: { name: string } | null;
}): EventEmailData {
  return {
    title: event.title,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    category: event.category?.name ?? null,
  };
}
