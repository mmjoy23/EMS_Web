import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Bookmark,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  Eye,
  EyeOff,
  Cpu,
  Briefcase,
  Palette,
  GraduationCap,
  Activity,
  BookOpen,
  LayoutGrid,
  Loader2,
  AlertCircle,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { qrDataUrl } from "@/lib/qr";
import {
  formatDate,
  formatTime,
  isUpcoming,
  remainingDays,
} from "@/lib/format";
import type { Category, EventDTO } from "@/lib/types";

export { cn };

// ─── Btn ────────────────────────────────────────────────────────────────────
export function Btn({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const vs: Record<string, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-blue-200 dark:hover:shadow-blue-900",
    secondary:
      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
    outline:
      "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
    ghost:
      "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
  };
  const ss: Record<string, string> = {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3.5 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md",
        vs[variant],
        ss[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────
export function Badge({
  children,
  color = "blue",
  dot = false,
}: {
  children: React.ReactNode;
  color?: string;
  dot?: boolean;
}) {
  const cs: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
    green:
      "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
    red: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300",
    amber: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
    purple:
      "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
    pink: "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        cs[color] || cs.blue,
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}

/** Map a real API category to one of the Badge color keys (keeps the palette varied). */
const CAT_BADGE: Record<string, string> = {
  technology: "blue",
  business: "purple",
  "arts-culture": "pink",
  career: "green",
  "health-sports": "amber",
  academic: "red",
};
const CAT_BADGE_BY_NAME: Record<string, string> = {
  Technology: "blue",
  Business: "purple",
  "Arts & Culture": "pink",
  Arts: "purple",
  Career: "green",
  "Health & Sports": "amber",
  Sports: "green",
  Academic: "red",
  Science: "red",
  Social: "pink",
};
export function catBadge(
  category?: Pick<Category, "slug" | "name"> | null,
): string {
  if (!category) return "blue";
  if (category.slug && CAT_BADGE[category.slug])
    return CAT_BADGE[category.slug];
  if (category.name && CAT_BADGE_BY_NAME[category.name])
    return CAT_BADGE_BY_NAME[category.name];
  return "blue";
}

// ─── categoryVisual (icon + tile classes for a real API Category) ─────────────
/**
 * Maps a seeded category (identified by slug, with a lucide icon *name* string)
 * to a lucide component + Tailwind tile classes. Tailwind can't build classes
 * from the DB hex at runtime, so the palette is keyed by slug with a fallback.
 */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Cpu,
  Briefcase,
  Palette,
  GraduationCap,
  Activity,
  BookOpen,
};
const CATEGORY_VISUALS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  technology: {
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900",
  },
  business: {
    bg: "bg-violet-50 dark:bg-violet-950",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-100 dark:border-violet-900",
  },
  "arts-culture": {
    bg: "bg-pink-50 dark:bg-pink-950",
    text: "text-pink-600 dark:text-pink-400",
    border: "border-pink-100 dark:border-pink-900",
  },
  career: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900",
  },
  "health-sports": {
    bg: "bg-orange-50 dark:bg-orange-950",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-100 dark:border-orange-900",
  },
  academic: {
    bg: "bg-cyan-50 dark:bg-cyan-950",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-100 dark:border-cyan-900",
  },
};
const CATEGORY_FALLBACK = {
  bg: "bg-slate-50 dark:bg-slate-800",
  text: "text-slate-600 dark:text-slate-400",
  border: "border-slate-100 dark:border-slate-700",
};
export function categoryVisual(
  category?: Pick<Category, "slug" | "icon"> | null,
): {
  Icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
} {
  const Icon = (category?.icon && CATEGORY_ICONS[category.icon]) || LayoutGrid;
  const visual =
    (category?.slug && CATEGORY_VISUALS[category.slug]) || CATEGORY_FALLBACK;
  return { Icon, ...visual };
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  const bar =
    pct >= 95 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div
      className={cn(
        "w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5",
        className,
      )}
    >
      <motion.div
        className={cn("h-1.5 rounded-full", bar)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color = "blue",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  trend?: string;
  color?: string;
}) {
  const cm: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
    green:
      "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
    purple:
      "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
    amber: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", cm[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-0.5 rounded-full",
              trend.startsWith("+")
                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400",
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
        {label}
      </p>
    </div>
  );
}

// ─── EventCard (wired to the real EventDTO) ────────────────────────────────────
export function EventCard({
  event,
  onView,
  onRegister,
  compact = false,
}: {
  event: EventDTO;
  onView?: () => void;
  onRegister?: () => void;
  compact?: boolean;
}) {
  const remaining = event.remaining;
  const isSoldOut = remaining <= 0;
  const isAlmostFull = remaining <= 10 && remaining > 0;
  const categoryName = event.category?.name ?? "Event";
  const color = catBadge(event.category);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      {!compact && (
        <div className="relative">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-44 object-cover bg-slate-100 dark:bg-slate-700"
            />
          ) : (
            <div className="w-full h-44 bg-gradient-to-br from-blue-500 to-indigo-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge color={color}>{categoryName}</Badge>
            {isSoldOut && <Badge color="red">Sold Out</Badge>}
            {isAlmostFull && <Badge color="amber">Almost Full</Badge>}
          </div>
          <button className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-blue-600 transition-colors backdrop-blur-sm">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="p-4">
        {compact && (
          <div className="flex gap-1.5 mb-2">
            <Badge color={color}>{categoryName}</Badge>
            {isSoldOut && <Badge color="red">Sold Out</Badge>}
          </div>
        )}
        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {event.title}
        </h3>
        <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {event.priceCents > 0
            ? `৳${(event.priceCents / 100).toFixed(2)}`
            : "Free entry"}
        </p>
        {isUpcoming(event.startsAt) && (
          <p className="mt-2 inline-flex rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
            {remainingDays(event.startsAt) === 0
              ? "Today"
              : `${remainingDays(event.startsAt)} ${remainingDays(event.startsAt) === 1 ? "day" : "days"} remaining`}
          </p>
        )}
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            {event.location.split(",")[0]}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            {event.host?.name ?? "Campus Events"}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400">
              {event.registeredCount}/{event.seatLimit} registered
            </span>
            <span
              className={cn(
                "font-semibold",
                isSoldOut
                  ? "text-red-600"
                  : isAlmostFull
                    ? "text-amber-600"
                    : "text-emerald-600",
              )}
            >
              {isSoldOut ? "Sold Out" : `${remaining} left`}
            </span>
          </div>
          <ProgressBar value={event.registeredCount} max={event.seatLimit} />
        </div>
        <div className="mt-3.5 flex gap-2">
          <Btn variant="outline" size="sm" onClick={onView} className="flex-1">
            Details
          </Btn>
          <Btn
            variant="primary"
            size="sm"
            onClick={onRegister}
            disabled={isSoldOut}
            className="flex-1"
          >
            {isSoldOut ? "Full" : "Register"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── QRCodeView (real, scannable QR) ──────────────────────────────────────────
export function QRCodeView({
  value,
  size = 176,
  className = "",
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let alive = true;
    qrDataUrl(value, { size: size * 3, margin: 1 })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(""));
    return () => {
      alive = false;
    };
  }, [value, size]);

  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn(
          "rounded-lg bg-slate-100 dark:bg-slate-700 animate-pulse",
          className,
        )}
      />
    );
  }
  return (
    <img
      src={src}
      alt="Ticket QR code"
      width={size}
      height={size}
      className={cn("rounded-lg", className)}
    />
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
export function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.5,
    color: [
      "#2563EB",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
    ][Math.floor(Math.random() * 7)],
    size: Math.random() * 9 + 5,
    round: Math.random() > 0.4,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <style>{`@keyframes fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(540deg);opacity:0}}`}</style>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: 0,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "2px",
            animation: `fall ${2 + Math.random()}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ─── CountdownTimer ───────────────────────────────────────────────────────────
export function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  const Unit = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center bg-slate-900 dark:bg-slate-950 rounded-xl px-3 py-2 min-w-[52px]">
      <span className="text-xl font-bold text-white font-mono">
        {String(v).padStart(2, "0")}
      </span>
      <span className="text-xs text-slate-400 mt-0.5">{l}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      <Unit v={time.d} l="Days" />
      <span className="text-slate-400 font-bold">:</span>
      <Unit v={time.h} l="Hours" />
      <span className="text-slate-400 font-bold">:</span>
      <Unit v={time.m} l="Min" />
      <span className="text-slate-400 font-bold">:</span>
      <Unit v={time.s} l="Sec" />
    </div>
  );
}

// ─── AnimatedCounter ──────────────────────────────────────────────────────────
export function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(id);
      } else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target]);
  return (
    <span>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Fetch-state helpers (shared across data screens) ─────────────────────────
export function Loading({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-slate-400",
        className,
      )}
    >
      <Loader2 className="w-7 h-7 animate-spin text-blue-500 mb-3" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
  className = "",
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 text-center",
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        {message}
      </p>
      {onRetry && (
        <Btn variant="outline" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="w-4 h-4" /> Try again
        </Btn>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  subtitle,
  className = "",
}: {
  icon?: React.ElementType;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className,
      )}
    >
      <Icon className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
      <p className="font-semibold text-slate-500 dark:text-slate-400">
        {title}
      </p>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── InputField (labelled input with password show/hide) ──────────────────────
export function InputField({
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  min,
  step,
  extra,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  icon?: React.ElementType;
  value?: string;
  onChange?: (v: string) => void;
  min?: string;
  step?: string;
  extra?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        {extra}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        )}
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          style={{
            paddingLeft: Icon ? "2.5rem" : "1rem",
            paddingRight: isPassword ? "2.5rem" : "1rem",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── BackBtn ──────────────────────────────────────────────────────────────────
export function BackBtn({
  onClick,
  label = "Back",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group mb-1"
    >
      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      {label}
    </button>
  );
}
