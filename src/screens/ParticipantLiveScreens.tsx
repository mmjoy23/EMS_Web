import { useEffect, useState } from "react";
import { Bell, CheckCircle, Download, Mail, QrCode, Star } from "lucide-react";
import { BackBtn, Badge, Btn, EmptyState, Loading } from "@/components/shared";
import { api } from "@/lib/api";
import { downloadQrPng, qrDataUrl } from "@/lib/qr";
import { formatDate, formatTime } from "@/lib/format";
import type { EmailMessage, EventDTO, Registration } from "@/lib/types";
import type { Screen } from "@/lib/nav";

type ParticipantNav = (
  screen: Screen,
  params?: { eventId?: string; slug?: string },
) => void;

export function ParticipantQrPass({ nav }: { nav: ParticipantNav }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.registrations
      .mine()
      .then(({ registrations: rows }) => {
        setRegistrations(
          rows.filter((row) => row.status === "registered" && row.ticketCode),
        );
        setSelectedId(
          (current) =>
            current ||
            rows.find((row) => row.status === "registered")?.id ||
            "",
        );
      })
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, []);

  const selected =
    registrations.find((registration) => registration.id === selectedId) ??
    registrations[0];

  useEffect(() => {
    if (!selected?.ticketCode) {
      setQr("");
      return;
    }
    void qrDataUrl(selected.ticketCode, { size: 280 }).then(setQr);
  }, [selected?.ticketCode]);

  if (loading) return <Loading />;
  if (!registrations.length) {
    return (
      <EmptyState
        title="No QR passes yet"
        subtitle="Register for an event to receive your admission QR pass."
      />
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <BackBtn onClick={() => nav("my-events")} label="My Events" />
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          My QR Pass
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Use this pass at the event entrance.
        </p>
      </div>
      <select
        value={selected?.id ?? ""}
        onChange={(event) => setSelectedId(event.target.value)}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 text-sm text-slate-900 dark:text-white"
      >
        {registrations.map((registration) => (
          <option key={registration.id} value={registration.id}>
            {registration.event?.title ?? "Registered event"}
          </option>
        ))}
      </select>
      {selected && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl p-6 text-center space-y-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {selected.event?.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {selected.event ? formatDate(selected.event.startsAt) : ""} ·{" "}
              {selected.event ? formatTime(selected.event.startsAt) : ""}
            </p>
          </div>
          {qr && (
            <img
              src={qr}
              alt="Event admission QR code"
              className="mx-auto w-64 h-64 rounded-xl"
            />
          )}
          <p className="font-mono text-sm text-blue-600 dark:text-blue-400">
            {selected.ticketCode}
          </p>
          <Badge color={selected.checkedIn ? "green" : "blue"}>
            {selected.checkedIn
              ? "Checked in"
              : `Seat ${selected.seatNumber ?? "pending"}`}
          </Badge>
          <Btn
            variant="outline"
            className="w-full justify-center"
            onClick={() =>
              selected.ticketCode &&
              void downloadQrPng(
                selected.ticketCode,
                `${selected.event?.slug ?? "event"}-qr-pass`,
              )
            }
          >
            <Download className="w-4 h-4" /> Download QR Pass
          </Btn>
        </div>
      )}
    </div>
  );
}

export function ParticipantFeedback({ nav }: { nav: ParticipantNav }) {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = () =>
    api.feedback.pending().then(({ events: rows }) => {
      setEvents(rows);
      setSelectedId((current) => current || rows[0]?.id || "");
    });

  useEffect(() => {
    load()
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!selectedId || rating === 0) return;
    setSubmitting(true);
    try {
      await api.feedback.submit(
        selectedId,
        rating,
        comment.trim() || undefined,
      );
      setSubmitted(true);
      setRating(0);
      setComment("");
      await load();
    } catch {
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!events.length)
    return (
      <EmptyState
        title="No feedback pending"
        subtitle="Feedback becomes available after you attend an event."
      />
    );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <BackBtn onClick={() => nav("my-events")} label="My Events" />
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 space-y-5">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Event Feedback
        </h2>
        {submitted && (
          <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="inline w-4 h-4 mr-1" />
            Feedback saved successfully.
          </p>
        )}
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm text-slate-900 dark:text-white"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-500">How was your experience?</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              onClick={() => setRating(value)}
              aria-label={`${value} stars`}
            >
              <Star
                className={`w-10 h-10 ${rating >= value ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"}`}
              />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Share your thoughts about this event..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-3 text-sm text-slate-900 dark:text-white"
        />
        <Btn
          className="w-full justify-center"
          disabled={rating === 0 || submitting}
          onClick={() => void submit()}
        >
          {submitting ? "Saving…" : "Submit Feedback"}
        </Btn>
      </div>
    </div>
  );
}

export function ParticipantNotifications({ nav }: { nav: ParticipantNav }) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.outbox
      .list()
      .then(({ messages: rows }) => setMessages(rows))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <BackBtn onClick={() => nav("student-dashboard")} label="Dashboard" />
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Notifications
        </h2>
      </div>
      {!messages.length ? (
        <EmptyState
          title="No notifications yet"
          subtitle="Registration and event updates will appear here."
        />
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4"
          >
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  {message.subject}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {message.type.replaceAll("_", " ")}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
