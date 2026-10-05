import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  Bookmark,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Lock,
  ArrowRight,
  CheckCircle,
  QrCode,
  Ticket,
  X,
  Globe,
  Copy,
  MessageCircle,
  Mail,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import {
  Btn,
  CountdownTimer,
  Loading,
  ErrorState,
  cn,
} from "@/components/shared";
import { api } from "@/lib/api";
import { useEvent } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatTime, initials, isUpcoming } from "@/lib/format";
import type { ScreenProps } from "@/lib/nav";
import type { CancellationPreview } from "@/lib/types";

// Category → hero gradient + glassy badge (keyed by the seeded slugs).
const CAT_GRADIENT: Record<
  string,
  { from: string; to: string; badge: string }
> = {
  technology: {
    from: "from-blue-600",
    to: "to-indigo-700",
    badge: "bg-blue-500/30 text-blue-100 border-blue-400/30",
  },
  business: {
    from: "from-violet-600",
    to: "to-purple-700",
    badge: "bg-violet-500/30 text-violet-100 border-violet-400/30",
  },
  "arts-culture": {
    from: "from-purple-600",
    to: "to-pink-600",
    badge: "bg-purple-500/30 text-purple-100 border-purple-400/30",
  },
  career: {
    from: "from-emerald-500",
    to: "to-teal-600",
    badge: "bg-emerald-500/30 text-emerald-100 border-emerald-400/30",
  },
  "health-sports": {
    from: "from-amber-500",
    to: "to-orange-600",
    badge: "bg-amber-500/30 text-amber-100 border-amber-400/30",
  },
  academic: {
    from: "from-cyan-500",
    to: "to-blue-600",
    badge: "bg-cyan-500/30 text-cyan-100 border-cyan-400/30",
  },
};
const catGradient = (slug?: string) =>
  (slug && CAT_GRADIENT[slug]) || CAT_GRADIENT.technology;

const speakerGradients = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

export function EventDetails({ nav, params }: ScreenProps) {
  const { user, isLoggedIn } = useAuth();
  const target = (params.eventId as string) || (params.slug as string) || "";
  const { event, myRegistration, loading, error, refetch } = useEvent(target);

  const [showDialog, setShowDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationPreview, setCancellationPreview] =
    useState<CancellationPreview | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ msg: string; visible: boolean }>({
    msg: "",
    visible: false,
  });

  const showFlash = (msg: string) => {
    setFlash({ msg, visible: true });
    setTimeout(() => setFlash((f) => ({ ...f, visible: false })), 3500);
  };

  const handleCalendarPick = () => {
    setShowCalModal(false);
    showFlash(
      "✓ Event successfully added to your calendar.\nA reminder email will be sent 24 hours before the event.",
    );
  };
  const handleSharePick = (option: string) => {
    setShowShareModal(false);
    if (option === "Copy Link") {
      if (event)
        navigator.clipboard
          ?.writeText(`${location.origin}/events/${event.slug}`)
          .catch(() => {});
      showFlash("✓ Event link copied successfully.");
    }
  };

  if (loading) return <Loading label="Loading event…" />;
  if (error || !event)
    return (
      <ErrorState message={error ?? "Event not found"} onRetry={refetch} />
    );

  const remaining = event.remaining;
  const registered = myRegistration?.status === "registered";
  const cancelled = event.status === "cancelled";
  const upcoming = isUpcoming(event.startsAt);
  const cc = catGradient(event.category?.slug);

  const doRegister = async () => {
    setBusy(true);
    try {
      await api.registrations.create(event.id);
      toast.success(
        "You're registered! A confirmation is waiting in your inbox.",
      );
      setShowDialog(false);
      nav("registration-success", { eventId: event.id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const openCancellationPreview = async () => {
    setBusy(true);
    try {
      const preview = await api.registrations.cancellationPreview(event.id);
      setCancellationPreview(preview);
      setShowCancelDialog(true);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not preview cancellation",
      );
    } finally {
      setBusy(false);
    }
  };

  const doUnregister = async () => {
    setBusy(true);
    try {
      await api.registrations.cancel(event.id);
      toast.success("Registration cancelled — your seat has been released.");
      setShowCancelDialog(false);
      setCancellationPreview(null);
      refetch();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not cancel registration",
      );
    } finally {
      setBusy(false);
    }
  };

  const Overlay = ({
    onClose,
    children,
  }: {
    onClose: () => void;
    children: React.ReactNode;
  }) => (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ animation: "fadeIn 300ms cubic-bezier(0,0,0.58,1) forwards" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        style={{ animation: "slideUp 300ms cubic-bezier(0,0,0.58,1) forwards" }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="w-full h-72 object-cover bg-slate-100"
          />
        ) : (
          <div
            className={cn("w-full h-72 bg-gradient-to-br", cc.from, cc.to)}
          />
        )}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t",
            cc.from + "/60 via-black/30 to-transparent",
          )}
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-40",
            cc.from,
            cc.to,
          )}
        />
        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex gap-2 mb-2.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm",
                cc.badge,
              )}
            >
              {event.category?.name ?? "Event"}
            </span>
            {event.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-extrabold text-white drop-shadow-lg">
            {event.title}
          </h1>
          <p className="text-white/80 text-sm mt-1.5 font-medium">
            by {event.host?.name ?? "Campus Events"}
          </p>
        </div>
        <div className="absolute top-4 left-4">
          <button
            onClick={() => nav(isLoggedIn ? "event-listing" : "landing")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 backdrop-blur-sm text-white text-sm font-semibold hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setBookmarked(!bookmarked)}
            className={cn(
              "p-2.5 rounded-xl backdrop-blur-sm transition-all",
              bookmarked
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-black/30 text-white hover:bg-black/50",
            )}
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="p-2.5 rounded-xl bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Key info strip */}
          <div
            className={cn(
              "rounded-2xl p-5 bg-gradient-to-r text-white shadow-lg",
              cc.from,
              cc.to,
            )}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: Calendar,
                  label: "Date",
                  value: formatDate(event.startsAt),
                },
                {
                  icon: Clock,
                  label: "Time",
                  value: formatTime(event.startsAt),
                },
                {
                  icon: MapPin,
                  label: "Venue",
                  value: event.location.split(",")[0],
                },
                {
                  icon: Users,
                  label: "Seats",
                  value: `${event.registeredCount}/${event.seatLimit}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center text-center p-3 bg-white/15 rounded-xl backdrop-blur-sm"
                >
                  <item.icon className="w-5 h-5 mb-1.5 opacity-90" />
                  <p className="text-xs opacity-75">{item.label}</p>
                  <p className="text-sm font-bold mt-0.5 truncate w-full text-center">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Countdown */}
          {upcoming && (
            <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 relative overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 opacity-10 bg-gradient-to-br",
                  cc.from,
                  cc.to,
                )}
              />
              <p className="text-slate-400 text-sm mb-3 font-medium relative">
                Event starts in
              </p>
              <div className="relative">
                <CountdownTimer targetDate={event.startsAt} />
              </div>
              <p className="text-slate-500 text-xs mt-2 relative">
                Registration deadline:{" "}
                {event.registrationDeadline
                  ? formatDate(event.registrationDeadline)
                  : "Until seats run out"}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "w-1 h-5 rounded-full bg-gradient-to-b",
                  cc.from,
                  cc.to,
                )}
              />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                About This Event
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Agenda */}
          {event.agenda.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "w-1 h-5 rounded-full bg-gradient-to-b",
                    cc.from,
                    cc.to,
                  )}
                />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Event Agenda
                </h2>
              </div>
              <div className="space-y-0">
                {event.agenda.map((item, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i < event.agenda.length - 1 && (
                      <div className="absolute left-[4.5rem] top-6 bottom-0 w-px bg-slate-100 dark:bg-slate-700" />
                    )}
                    <div
                      className={cn(
                        "text-xs font-mono font-bold w-16 flex-shrink-0 pt-3 text-right",
                        i === 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {item.time}
                    </div>
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full mt-3.5 flex-shrink-0 ring-2 ring-white dark:ring-slate-800",
                        i === 0
                          ? cn("bg-gradient-to-br", cc.from, cc.to)
                          : "bg-slate-300 dark:bg-slate-600",
                      )}
                    />
                    <div className="flex-1 pb-4 pt-2.5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      {item.speaker && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.speaker}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Speakers */}
          {event.speakers.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "w-1 h-5 rounded-full bg-gradient-to-b",
                    cc.from,
                    cc.to,
                  )}
                />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Speakers
                </h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {event.speakers.map((s, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:shadow-md transition-shadow"
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center font-bold text-white text-base mb-3 shadow-md",
                        speakerGradients[i % speakerGradients.length],
                      )}
                    >
                      {s.initials || initials(s.name)}
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {s.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden sticky top-20">
            {/* Seat bar with gradient header */}
            <div
              className={cn("bg-gradient-to-r p-4 text-white", cc.from, cc.to)}
            >
              <div className="flex justify-between text-sm mb-2">
                <span className="opacity-90 font-medium">Seats Filling Up</span>
                <span className="font-bold">{remaining} left</span>
              </div>
              <div className="w-full bg-white/25 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-white transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round((event.registeredCount / event.seatLimit) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs opacity-75 mt-1.5">
                {event.registeredCount} of {event.seatLimit} registered
              </p>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-700/60 px-3 py-2 text-sm">
                <span className="text-slate-500">Entry fee</span>
                <strong className="text-slate-900 dark:text-white">
                  {event.priceCents > 0
                    ? `৳${(event.priceCents / 100).toFixed(2)}`
                    : "Free"}
                </strong>
              </div>
              {cancelled ? (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-xl border border-red-100 dark:border-red-900">
                  <Ban className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">
                    This event has been cancelled.
                  </p>
                </div>
              ) : !isLoggedIn ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-100 dark:border-amber-900">
                    <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      Sign in to register for this event
                    </p>
                  </div>
                  <Btn
                    variant="primary"
                    className="w-full justify-center py-3 text-base"
                    onClick={() => nav("login")}
                  >
                    Sign In to Register <ArrowRight className="w-4 h-4" />
                  </Btn>
                  <Btn
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => nav("signup")}
                  >
                    Create Account
                  </Btn>
                </>
              ) : registered ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                        You are registered!
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500">
                        Confirmation sent to your inbox
                      </p>
                    </div>
                  </div>
                  <Btn
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() =>
                      nav("registration-success", { eventId: event.id })
                    }
                  >
                    <QrCode className="w-4 h-4" />
                    View QR Pass
                  </Btn>
                  <Btn
                    variant="outline"
                    className="w-full justify-center text-red-600 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => void openCancellationPreview()}
                    disabled={busy}
                  >
                    {busy ? "Loading…" : "Unregister"}
                  </Btn>
                </>
              ) : (
                <>
                  <Btn
                    variant="primary"
                    className="w-full justify-center py-3 text-base"
                    onClick={() => setShowDialog(true)}
                    disabled={remaining === 0 || !upcoming}
                  >
                    {remaining === 0
                      ? "Event Full"
                      : !upcoming
                        ? "Registration Closed"
                        : "Register Now"}{" "}
                    <ArrowRight className="w-4 h-4" />
                  </Btn>
                  <p className="text-xs text-slate-400 text-center">
                    Deadline:{" "}
                    {event.registrationDeadline
                      ? formatDate(event.registrationDeadline)
                      : "Until seats run out"}
                  </p>
                </>
              )}

              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1.5">
                {isLoggedIn && (
                  <button
                    onClick={() => setShowCalModal(true)}
                    className="w-full flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-1 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Add to Calendar
                  </button>
                )}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-1 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <Share2 className="w-4 h-4 text-emerald-500" />
                  Share Event
                </button>
                <button
                  onClick={() => setShowMapModal(true)}
                  className="w-full flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-1 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <MapPin className="w-4 h-4 text-red-500" />
                  View Map
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelDialog && cancellationPreview && (
        <Overlay onClose={() => setShowCancelDialog(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Cancel Event Registration?
            </h3>
            <p className="text-sm text-slate-500">
              The final calculation is performed again by the server when you
              confirm.
            </p>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/60 p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Event</span>
                <strong>{cancellationPreview.event.title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid amount</span>
                <strong>
                  ৳{(cancellationPreview.paidAmountCents / 100).toFixed(2)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Penalty</span>
                <strong>
                  {cancellationPreview.penaltyPercentage}% (৳
                  {(cancellationPreview.penaltyAmountCents / 100).toFixed(2)})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated refund</span>
                <strong>
                  ৳{(cancellationPreview.refundAmountCents / 100).toFixed(2)}
                </strong>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {cancellationPreview.isFree
                ? "This is a free event, so no penalty or refund is due."
                : `Time remaining: ${Math.max(0, cancellationPreview.hoursRemaining / 24).toFixed(1)} days`}
            </p>
            <div className="flex gap-3">
              <Btn
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => setShowCancelDialog(false)}
                disabled={busy}
              >
                Keep Registration
              </Btn>
              <Btn
                variant="danger"
                className="flex-1 justify-center"
                onClick={() => void doUnregister()}
                disabled={busy}
              >
                {busy ? "Cancelling…" : "Confirm Unregister"}
              </Btn>
            </div>
          </div>
        </Overlay>
      )}

      {/* Registration Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full"
          >
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Confirm Registration
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                You are about to register for{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {event.title}
                </span>
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatDate(event.startsAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Venue:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {event.location.split(",")[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {user?.name ?? "You"}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mb-4">
              A QR code confirmation will be sent to{" "}
              {user?.email ?? "your inbox"}
            </p>
            <div className="flex gap-3">
              <Btn
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </Btn>
              <Btn
                variant="primary"
                className="flex-1 justify-center"
                onClick={doRegister}
                disabled={busy}
              >
                {busy ? "Registering…" : "Confirm"}{" "}
                <CheckCircle className="w-4 h-4" />
              </Btn>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add to Calendar Modal */}
      {showCalModal && (
        <Overlay onClose={() => setShowCalModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Add Event to Calendar
              </h3>
              <button
                onClick={() => setShowCalModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4 text-sm space-y-1.5">
              <p className="font-semibold text-slate-900 dark:text-white">
                {event.title}
              </p>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
              </p>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                {event.location.split(",")[0]}
              </p>
            </div>
            <div className="space-y-2">
              {[
                {
                  label: "Google Calendar",
                  color:
                    "hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900",
                  dot: "bg-red-500",
                },
                {
                  label: "Outlook Calendar",
                  color:
                    "hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-900",
                  dot: "bg-blue-600",
                },
                {
                  label: "Apple Calendar",
                  color:
                    "hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600",
                  dot: "bg-slate-800 dark:bg-slate-200",
                },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={handleCalendarPick}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300",
                    opt.color,
                  )}
                >
                  <span
                    className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0",
                      opt.dot,
                    )}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {/* Share Event Modal */}
      {showShareModal && (
        <Overlay onClose={() => setShowShareModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Share Event
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
                unievents.edu/events/{event.slug}
              </span>
              <button
                onClick={() => handleSharePick("Copy Link")}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
              >
                Copy
              </button>
            </div>
            <div className="space-y-2">
              {[
                {
                  label: "Copy Link",
                  icon: Copy,
                  color:
                    "hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:border-slate-300",
                  dot: "bg-slate-600 dark:bg-slate-300",
                },
                {
                  label: "WhatsApp",
                  icon: MessageCircle,
                  color:
                    "hover:bg-green-50 dark:hover:bg-green-950/40 hover:border-green-200 dark:hover:border-green-900",
                  dot: "bg-green-500",
                },
                {
                  label: "Facebook",
                  icon: Globe,
                  color:
                    "hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-900",
                  dot: "bg-blue-600",
                },
                {
                  label: "Email",
                  icon: Mail,
                  color:
                    "hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-200 dark:hover:border-amber-900",
                  dot: "bg-amber-500",
                },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleSharePick(opt.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300",
                    opt.color,
                  )}
                >
                  <span
                    className={cn(
                      "w-3 h-3 rounded-full flex-shrink-0",
                      opt.dot,
                    )}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {/* View Map Modal */}
      {showMapModal && (
        <Overlay onClose={() => setShowMapModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md">
            <div className="relative h-48 bg-slate-200 dark:bg-slate-700">
              <img
                src="https://images.unsplash.com/photo-1562516155-e0c1ee44059b?w=600&h=300&fit=crop&auto=format"
                alt="Campus Map"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <button
                onClick={() => setShowMapModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white" />
                <span className="text-white text-xs font-semibold drop-shadow">
                  {event.location.split(",")[0]}
                </span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-3">
                Event Location
              </h3>
              <div className="space-y-2.5 mb-5">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {event.location.split(",")[0]}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {event.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Doors open at {formatTime(event.startsAt)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Please arrive early and bring your QR pass
                    </p>
                  </div>
                </div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors duration-300"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </div>
        </Overlay>
      )}

      {/* Flash toast (calendar / share) */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300",
          flash.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none",
        )}
        style={{
          transition:
            "opacity 300ms cubic-bezier(0,0,0.58,1), transform 300ms cubic-bezier(0,0,0.58,1)",
        }}
      >
        <div className="flex items-start gap-3 bg-slate-900 dark:bg-slate-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl max-w-sm">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium leading-snug whitespace-pre-line">
            {flash.msg}
          </p>
        </div>
      </div>
    </div>
  );
}
