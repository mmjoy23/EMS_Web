// Email HTML templates for the in-app Outbox. Styles are inlined so the stored
// HTML renders correctly both in the in-app preview and in a real inbox later.

export type EventEmailData = {
  title: string;
  location: string;
  startsAt: Date;
  endsAt?: Date | null;
  category?: string | null;
};

export type UserEmailData = { name: string; email: string };

const BRAND = "UniEvents";
const GRADIENT = "linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#d946ef 100%)";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function fmtTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d);
}

function timeRange(start: Date, end?: Date | null): string {
  if (!end) return fmtTime(start);
  return `${fmtTime(start)} – ${fmtTime(end)}`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shared email chrome: header band, white card, footer. */
function layout(opts: { heading: string; preheader: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${INK};">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,.08);">
        <tr><td style="background:${GRADIENT};padding:28px 32px;">
          <div style="color:#fff;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;opacity:.9;">${BRAND}</div>
          <div style="color:#fff;font-size:24px;font-weight:800;margin-top:6px;line-height:1.25;">${escape(opts.heading)}</div>
        </td></tr>
        <tr><td style="padding:32px;">${opts.body}</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${BORDER};color:${MUTED};font-size:12px;line-height:1.6;">
          You're receiving this because you have a ${BRAND} account.<br>
          This is a demo message stored in the in-app Outbox — no real email was sent.
        </td></tr>
      </table>
      <div style="color:#94a3b8;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} ${BRAND} · Campus Event Registration</div>
    </td></tr>
  </table>
</body></html>`;
}

/** Event detail block reused across templates. */
function eventCard(event: EventEmailData): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:14px;overflow:hidden;margin:8px 0 4px;">
    <tr><td style="padding:18px 20px;">
      <div style="font-size:17px;font-weight:700;color:${INK};">${escape(event.title)}</div>
      ${event.category ? `<div style="display:inline-block;margin-top:8px;padding:3px 10px;background:#eef2ff;color:#4f46e5;border-radius:999px;font-size:12px;font-weight:600;">${escape(event.category)}</div>` : ""}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;font-size:14px;color:${INK};">
        <tr><td style="padding:4px 0;color:${MUTED};width:80px;">Date</td><td style="padding:4px 0;font-weight:600;">${fmtDate(event.startsAt)}</td></tr>
        <tr><td style="padding:4px 0;color:${MUTED};">Time</td><td style="padding:4px 0;font-weight:600;">${timeRange(event.startsAt, event.endsAt)}</td></tr>
        <tr><td style="padding:4px 0;color:${MUTED};">Location</td><td style="padding:4px 0;font-weight:600;">${escape(event.location)}</td></tr>
      </table>
    </td></tr>
  </table>`;
}

function paragraph(text: string): string {
  return `<p style="font-size:15px;line-height:1.65;color:#334155;margin:0 0 16px;">${text}</p>`;
}

export type RenderedEmail = { subject: string; html: string };

export function confirmationEmail(data: {
  user: UserEmailData;
  event: EventEmailData;
  seatNumber?: number | null;
  ticketCode: string;
  qrDataUrl?: string | null;
}): RenderedEmail {
  const subject = `You're registered — ${data.event.title}`;
  const qrBlock = data.qrDataUrl
    ? `<div style="text-align:center;margin:8px 0 4px;padding:22px;border:1px solid ${BORDER};border-radius:16px;background:#fafafa;">
         <img src="${data.qrDataUrl}" width="180" height="180" alt="Your check-in QR code" style="display:block;margin:0 auto 12px;border-radius:12px;"/>
         <div style="font-size:12px;color:${MUTED};">Show this code at the door to check in</div>
         <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:${INK};margin-top:8px;letter-spacing:.05em;">${escape(data.ticketCode)}</div>
       </div>`
    : "";
  const body =
    paragraph(`Hi ${escape(data.user.name)}, your spot is confirmed. Here are the details:`) +
    eventCard(data.event) +
    (data.seatNumber
      ? paragraph(`<strong>Seat #${data.seatNumber}</strong> is reserved for you.`)
      : "") +
    qrBlock +
    paragraph(
      `Can't make it? You can unregister anytime from your dashboard to free up your seat.`,
    );
  return { subject, html: layout({ heading: "Registration confirmed 🎉", preheader: subject, body }) };
}

export function reminderEmail(data: {
  user: UserEmailData;
  event: EventEmailData;
  ticketCode?: string | null;
}): RenderedEmail {
  const subject = `Reminder — ${data.event.title} is coming up`;
  const body =
    paragraph(`Hi ${escape(data.user.name)}, this is a friendly reminder that your event starts soon.`) +
    eventCard(data.event) +
    (data.ticketCode
      ? paragraph(
          `Have your QR pass ready for a fast check-in. Your ticket code is <strong>${escape(data.ticketCode)}</strong>.`,
        )
      : paragraph(`Have your QR pass ready in the app for a fast check-in at the door.`)) +
    paragraph(`We look forward to seeing you there!`);
  return { subject, html: layout({ heading: "See you soon ⏰", preheader: subject, body }) };
}

export function feedbackRequestEmail(data: {
  user: UserEmailData;
  event: EventEmailData;
}): RenderedEmail {
  const subject = `How was ${data.event.title}?`;
  const body =
    paragraph(`Hi ${escape(data.user.name)}, thanks for attending! We'd love to hear what you thought.`) +
    eventCard(data.event) +
    paragraph(`Your feedback takes less than a minute and helps organizers improve future events.`) +
    `<div style="text-align:center;margin:22px 0 6px;">
       <span style="display:inline-block;background:${GRADIENT};color:#fff;font-weight:700;font-size:15px;padding:12px 26px;border-radius:12px;">Rate this event in the app</span>
     </div>`;
  return { subject, html: layout({ heading: "Share your feedback 💬", preheader: subject, body }) };
}

export function cancellationEmail(data: {
  user: UserEmailData;
  event: EventEmailData;
  reason?: string | null;
}): RenderedEmail {
  const subject = `Cancelled — ${data.event.title}`;
  const body =
    paragraph(`Hi ${escape(data.user.name)}, we're sorry to let you know that this event has been cancelled.`) +
    eventCard(data.event) +
    (data.reason ? paragraph(`<strong>Reason:</strong> ${escape(data.reason)}`) : "") +
    paragraph(`Your registration has been released. We hope to see you at a future event.`);
  return { subject, html: layout({ heading: "Event cancelled", preheader: subject, body }) };
}
