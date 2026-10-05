import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import {
  Search,
  Bell,
  User,
  Calendar,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Filter,
  MapPin,
  Clock,
  Users,
  Star,
  Download,
  Share2,
  Bookmark,
  QrCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart2,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Copy,
  Mail,
  X,
  Menu,
  Moon,
  Sun,
  Scan,
  Check,
  Award,
  FileText,
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Zap,
  Coffee,
  Music,
  Briefcase,
  Cpu,
  Flag,
  BookOpen,
  Heart,
  MessageCircle,
  Globe,
  ChevronUp,
  MoreVertical,
  AlertCircle,
  Ticket,
  UserCheck,
  List,
  Grid,
  AtSign,
  Phone,
  Camera,
  Upload,
  Tag,
  RefreshCw,
  Gavel,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Landing } from "@/screens/Landing";
import { EventDetails as DatabaseEventDetails } from "@/screens/EventDetails";
import { Participants as DatabaseParticipants } from "@/screens/Participants";
import { AdminOperations } from "@/screens/AdminOperations";
import { OrganizerQrAttendance } from "@/screens/OrganizerQrAttendance";
import { Issues } from "@/screens/Issues";
import {
  ParticipantFeedback,
  ParticipantNotifications,
  ParticipantQrPass,
} from "@/screens/ParticipantLiveScreens";
import { api } from "@/lib/api";
import type {
  AdminStats,
  AttendanceReport,
  CheckinResponse,
  EventDTO,
  Participant,
  Person,
  Registration,
} from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | "landing"
  | "login"
  | "signup"
  | "forgot-password"
  | "verify-email"
  | "student-dashboard"
  | "event-listing"
  | "event-details"
  | "registration-success"
  | "my-events"
  | "event-calendar"
  | "notifications"
  | "profile"
  | "feedback"
  | "organizer-dashboard"
  | "create-event"
  | "manage-events"
  | "participants"
  | "admin-dashboard"
  | "qr-scanner"
  | "attendance-report"
  | "admin-operations"
  | "organizer-qr"
  | "issues";

type Role = "student" | "organizer" | "admin";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const EVENTS = [
  {
    id: 1,
    title: "Tech Summit 2024",
    category: "Technology",
    date: "Feb 28, 2024",
    time: "09:00 AM – 05:00 PM",
    location: "Main Auditorium, Block A",
    seats: 300,
    registered: 247,
    banner:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=400&fit=crop&auto=format",
    description:
      "Join us for the annual Technology Summit featuring leading industry experts, hands-on workshops, and networking opportunities.",
    organizer: "Computer Science Department",
    featured: true,
    tags: ["AI", "Machine Learning", "Cloud"],
    deadline: "Feb 25, 2024",
    agenda: [],
    speakers: [],
  },
  {
    id: 2,
    title: "Design Hackathon Spring",
    category: "Technology",
    date: "Mar 5, 2024",
    time: "10:00 AM – 10:00 PM",
    location: "Innovation Lab, Block C",
    seats: 100,
    registered: 98,
    banner:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=900&h=400&fit=crop&auto=format",
    description: "A fast-paced design and technology hackathon.",
    organizer: "Innovation Club",
    featured: true,
    tags: ["Design", "Innovation"],
    deadline: "Mar 3, 2024",
    agenda: [],
    speakers: [],
  },
  {
    id: 3,
    title: "Inter-College Sports Festival",
    category: "Sports",
    date: "Mar 12, 2024",
    time: "08:00 AM – 06:00 PM",
    location: "Sports Field",
    seats: 500,
    registered: 312,
    banner:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&h=400&fit=crop&auto=format",
    description: "A day of competition and community.",
    organizer: "Athletics Department",
    featured: false,
    tags: ["Sports", "Competition"],
    deadline: "Mar 9, 2024",
    agenda: [],
    speakers: [],
  },
  {
    id: 4,
    title: "Design Thinking Workshop",
    category: "Arts",
    date: "Mar 18, 2024",
    time: "02:00 PM – 05:00 PM",
    location: "Exhibition Hall",
    seats: 80,
    registered: 54,
    banner:
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=900&h=400&fit=crop&auto=format",
    description: "Learn practical design thinking methods.",
    organizer: "School of Design",
    featured: false,
    tags: ["Design", "Workshop"],
    deadline: "Mar 16, 2024",
    agenda: [],
    speakers: [],
  },
];

const CATEGORIES = [
  { name: "Technology", count: 18, icon: Cpu, color: "blue" },
  { name: "Sports", count: 12, icon: Activity, color: "green" },
  { name: "Arts", count: 9, icon: PaletteIcon, color: "purple" },
  { name: "Career", count: 7, icon: Briefcase, color: "amber" },
  { name: "Science", count: 6, icon: Zap, color: "red" },
  { name: "Social", count: 5, icon: Users, color: "pink" },
];

const MONTHLY_DATA = [
  { month: "Sep", registrations: 420, attendance: 380 },
  { month: "Oct", registrations: 580, attendance: 510 },
  { month: "Nov", registrations: 340, attendance: 295 },
  { month: "Dec", registrations: 210, attendance: 190 },
  { month: "Jan", registrations: 490, attendance: 441 },
  { month: "Feb", registrations: 720, attendance: 648 },
  { month: "Mar", registrations: 650, attendance: 585 },
];

const CAT_PIE = [
  { name: "Technology", value: 35, color: "#2563EB" },
  { name: "Sports", value: 22, color: "#10B981" },
  { name: "Arts", value: 18, color: "#8B5CF6" },
  { name: "Career", value: 13, color: "#F59E0B" },
  { name: "Science", value: 7, color: "#EF4444" },
  { name: "Social", value: 5, color: "#EC4899" },
];

const NOTIFS = [
  {
    id: 1,
    title: "Registration Confirmed",
    message: "You have successfully registered for Tech Summit 2024.",
    time: "2 min ago",
    read: false,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    Icon: CheckCircle,
  },
  {
    id: 2,
    title: "Event Tomorrow!",
    message: "Tech Summit 2024 starts in 24 hours.",
    time: "1 hr ago",
    read: false,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    Icon: Bell,
  },
  {
    id: 3,
    title: "Event Cancelled",
    message: "AI Workshop scheduled for Jan 30 has been cancelled.",
    time: "3 hrs ago",
    read: true,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/50",
    Icon: XCircle,
  },
];

function PaletteIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Heart {...props} />;
}

// ─── Utils ────────────────────────────────────────────────────────────────────
const cn = (...c: (string | boolean | undefined | null)[]) =>
  c.filter(Boolean).join(" ");

// ─── Shared Components ────────────────────────────────────────────────────────
function Btn({
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

function Badge({
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

function ProgressBar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
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

function StatCard({
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

function EventCard({
  event,
  onView,
  onRegister,
  compact = false,
}: {
  event: (typeof EVENTS)[number] & { isRegistered?: boolean };
  onView?: () => void;
  onRegister?: () => void;
  compact?: boolean;
}) {
  const remaining = event.seats - event.registered;
  const pct = (event.registered / event.seats) * 100;
  const isSoldOut = remaining === 0;
  const isAlmostFull = remaining <= 10 && remaining > 0;
  const catColor: Record<string, string> = {
    Technology: "blue",
    Sports: "green",
    Arts: "purple",
    Career: "amber",
    Science: "red",
    Social: "pink",
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      {!compact && (
        <div className="relative">
          <img
            src={event.banner}
            alt={event.title}
            className="w-full h-44 object-cover bg-slate-100 dark:bg-slate-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <Badge color={catColor[event.category] || "blue"}>
              {event.category}
            </Badge>
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
            <Badge color={catColor[event.category] || "blue"}>
              {event.category}
            </Badge>
            {isSoldOut && <Badge color="red">Sold Out</Badge>}
          </div>
        )}
        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {event.title}
        </h3>
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            {event.date} · {event.time.split("–")[0].trim()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            {event.location.split(",")[0]}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            {event.organizer}
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400">
              {event.registered}/{event.seats} registered
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
          <ProgressBar value={event.registered} max={event.seats} />
        </div>
        <div className="mt-3.5 flex gap-2">
          <Btn variant="outline" size="sm" onClick={onView} className="flex-1">
            Details
          </Btn>
          <Btn
            variant="primary"
            size="sm"
            onClick={onRegister}
            disabled={isSoldOut || event.isRegistered}
            className="flex-1"
          >
            {isSoldOut
              ? "Full"
              : event.isRegistered
                ? "Registered"
                : "Register"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function QRCodeDisplay({
  studentId = "STU-2024-7841",
}: {
  studentId?: string;
}) {
  const SIZE = 21;
  const finder = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  const matrix: number[][] = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(-1),
  );
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++) {
      matrix[r][c] = finder[r][c];
      matrix[r][SIZE - 7 + c] = finder[r][c];
      matrix[SIZE - 7 + r][c] = finder[r][c];
    }
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (matrix[r][c] === -1) {
        const h = (r * 31 + c * 17 + r + c) % 3;
        matrix[r][c] = h !== 2 ? 1 : 0;
      }
    }
  return (
    <svg viewBox={`0 0 ${SIZE + 4} ${SIZE + 4}`} className="w-44 h-44">
      <rect width={SIZE + 4} height={SIZE + 4} fill="white" rx="2" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c + 2}
              y={r + 2}
              width={1}
              height={1}
              fill="#0f172a"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function Confetti() {
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

function CountdownTimer({ targetDate }: { targetDate: string }) {
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

function AnimatedCounter({
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

function BackBtn({
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

// ─── Navigation Config ────────────────────────────────────────────────────────
const studentNav = [
  { icon: LayoutDashboard, label: "Dashboard", screen: "student-dashboard" },
  { icon: Search, label: "Browse Events", screen: "event-listing" },
  { icon: Ticket, label: "My Events", screen: "my-events" },
  { icon: Calendar, label: "Event Calendar", screen: "event-calendar" },
  { icon: Bell, label: "Notifications", screen: "notifications", badge: 2 },
  { icon: QrCode, label: "My QR Pass", screen: "registration-success" },
  { icon: Star, label: "Feedback", screen: "feedback" },
  { icon: AlertTriangle, label: "Complaints", screen: "issues" },
  { icon: User, label: "Profile", screen: "profile" },
];
const organizerNav = [
  { icon: LayoutDashboard, label: "Dashboard", screen: "organizer-dashboard" },
  { icon: Plus, label: "Create Event", screen: "create-event" },
  { icon: FileText, label: "Manage Events", screen: "manage-events" },
  { icon: Users, label: "Participants", screen: "participants" },
  { icon: Scan, label: "QR Attendance", screen: "organizer-qr" },
  { icon: BarChart2, label: "Reports", screen: "attendance-report" },
  { icon: User, label: "Profile", screen: "profile" },
];
const adminNav = [
  { icon: FileText, label: "Event Requests", screen: "admin-operations" },
  { icon: AlertTriangle, label: "Complaints", screen: "admin-operations" },
  { icon: Gavel, label: "Fines", screen: "admin-operations" },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  role,
  current,
  nav,
  collapsed,
  setCollapsed,
}: {
  role: Role;
  current: Screen;
  nav: (s: Screen) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const navItems =
    role === "student"
      ? studentNav
      : role === "organizer"
        ? organizerNav
        : adminNav;
  const roleLabel =
    role === "student"
      ? "Student Portal"
      : role === "organizer"
        ? "Organizer Hub"
        : "Admin Console";
  const roleColor =
    role === "student"
      ? "text-blue-400"
      : role === "organizer"
        ? "text-emerald-400"
        : "text-amber-400";
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-slate-900 dark:bg-slate-950 border-r border-slate-800 z-30 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">
              UniEvents
            </p>
            <p className={cn("text-xs leading-tight truncate", roleColor)}>
              {roleLabel}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-400 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-slate-800"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = current === item.screen;
          return (
            <button
              key={(item as any).key ?? item.label}
              onClick={() => nav(item.screen as Screen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800",
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="truncate font-medium">{item.label}</span>
              )}
              {!collapsed && (item as any).badge && !isActive && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {(item as any).badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-2 flex-shrink-0">
        <button
          onClick={() => nav("landing")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          data-signout
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// ─── Top Nav ──────────────────────────────────────────────────────────────────
const BELL_NOTIFS = [
  {
    id: 1,
    title: "Registration Confirmed",
    msg: "Tech Summit 2024 – You are registered!",
    time: "2 min ago",
    Icon: CheckCircle,
    color: "text-emerald-500",
    dot: "bg-emerald-500",
    read: false,
  },
  {
    id: 2,
    title: "Event Reminder",
    msg: "Tech Summit 2024 starts in 24 hours.",
    time: "1 hr ago",
    Icon: Bell,
    color: "text-blue-500",
    dot: "bg-blue-500",
    read: false,
  },
  {
    id: 3,
    title: "Feedback Request",
    msg: "Rate your experience at Design Workshop.",
    time: "1 day ago",
    Icon: MessageCircle,
    color: "text-purple-500",
    dot: "bg-purple-500",
    read: true,
  },
  {
    id: 4,
    title: "Event Cancelled",
    msg: "AI Workshop on Jan 30 has been cancelled.",
    time: "2 days ago",
    Icon: XCircle,
    color: "text-red-500",
    dot: "bg-red-500",
    read: true,
  },
];

function TopNav({
  nav,
  isDark,
  setIsDark,
  role,
  setRole,
  screen,
}: {
  nav: (s: Screen) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  role: Role;
  setRole: (r: Role) => void;
  screen: Screen;
}) {
  const [bellOpen, setBellOpen] = useState(false);
  const [notifs, setNotifs] = useState(BELL_NOTIFS);
  const bellRef = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const labels: Partial<Record<Screen, string>> = {
    "student-dashboard": "Dashboard",
    "event-listing": "Browse Events",
    "event-details": "Event Details",
    "registration-success": "Registration",
    "my-events": "My Events",
    "event-calendar": "Event Calendar",
    notifications: "Notifications",
    profile: "My Profile",
    feedback: "Feedback",
    "organizer-dashboard": "Dashboard",
    "create-event": "Create Event",
    "manage-events": "Manage Events",
    participants: "Participants",
    "admin-dashboard": "Dashboard",
    "qr-scanner": "QR Scanner",
    "attendance-report": "Attendance Report",
    "admin-operations": "Admin Operations",
    "organizer-qr": "QR Attendance",
    issues: "Complaints & Fines",
  };
  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-6 h-16 gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            {labels[screen] || "UniEvents"}
          </h1>
          <p className="text-xs text-slate-400">
            University Campus Event System
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* Bell with dropdown */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => {
                setBellOpen((o) => !o);
                setNotifs((n) => n.map((i) => ({ ...i, read: true })));
              }}
              className="relative p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
            {bellOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50"
                style={{
                  animation: "slideUp 300ms cubic-bezier(0,0,0.58,1) forwards",
                }}
              >
                <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Notifications
                  </p>
                  <button
                    onClick={() => nav("notifications")}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-72 overflow-y-auto">
                  {notifs.map((n) => (
                    <div
                      key={n.id}
                      className="flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                      onClick={() => setBellOpen(false)}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 dark:bg-slate-700",
                        )}
                      >
                        <n.Icon className={cn("w-4 h-4", n.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                          {n.msg}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {n.time}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          n.dot,
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all duration-300"
          >
            <motion.div
              key={isDark ? "sun" : "moon"}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0, 0, 0.58, 1] }}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.div>
          </button>

          <button
            onClick={() => nav("profile")}
            className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs",
                role === "student"
                  ? "bg-gradient-to-br from-blue-500 to-blue-700"
                  : role === "organizer"
                    ? "bg-gradient-to-br from-emerald-500 to-teal-700"
                    : "bg-gradient-to-br from-slate-700 to-slate-900",
              )}
            >
              {role === "student" ? "AJ" : role === "organizer" ? "SW" : "AD"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {role === "student"
                  ? "Alex Johnson"
                  : role === "organizer"
                    ? "Sarah Williams"
                    : "Admin User"}
              </p>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
                  role === "student"
                    ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                    : role === "organizer"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                )}
              >
                {role}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

function AppLayout({
  children,
  nav,
  isDark,
  setIsDark,
  role,
  setRole,
  screen,
  collapsed,
  setCollapsed,
}: {
  children: React.ReactNode;
  nav: (s: Screen) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  role: Role;
  setRole: (r: Role) => void;
  screen: Screen;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar
        role={role}
        current={screen}
        nav={nav}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          collapsed ? "ml-16" : "ml-60",
        )}
      >
        <TopNav
          nav={nav}
          isDark={isDark}
          setIsDark={setIsDark}
          role={role}
          setRole={setRole}
          screen={screen}
        />
        <main className="flex-1 p-6">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

function LandingScreen({
  nav,
  isDark,
  setIsDark,
}: {
  nav: (s: Screen) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}) {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState<string | null>(
    null,
  );
  const [searchVal, setSearchVal] = useState("");
  const featuredEvents = EVENTS.filter((e) => e.featured);

  useEffect(() => {
    const id = setInterval(
      () => setCarouselIdx((i) => (i + 1) % featuredEvents.length),
      4500,
    );
    return () => clearInterval(id);
  }, [featuredEvents.length]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const NAV_ACTIONS: Record<string, () => void> = {
    "Browse Events": () => scrollTo("section-events"),
    Categories: () => scrollTo("section-categories"),
    About: () => scrollTo("section-about"),
    Contact: () => scrollTo("section-contact"),
  };

  const catColors: Record<string, string> = {
    Technology: "blue",
    Sports: "green",
    Arts: "purple",
    Career: "amber",
    Science: "red",
    Social: "pink",
  };
  const cur = featuredEvents[carouselIdx];
  const remaining = cur ? cur.seats - cur.registered : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-[#050B18]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              UniEvents
            </span>
          </button>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-400">
            {["Browse Events", "Categories", "About", "Contact"].map((l) => (
              <button
                key={l}
                onClick={NAV_ACTIONS[l]}
                className="hover:text-white transition-colors duration-200 font-medium"
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/8 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              <motion.div
                key={isDark ? "sun" : "moon"}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </motion.div>
            </button>
            <button
              onClick={() => nav("login")}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => nav("signup")}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 transition-all duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#050B18] text-white min-h-[90vh] flex items-center">
        {/* Aurora orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[90px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0, 0, 0.58, 1] }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-4 py-1.5 text-xs font-semibold text-blue-300 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                342 events happening this semester
              </div>
              <h1 className="text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
                Discover
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Campus Events
                </span>
                <br />
                &amp; Connect
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-md">
                Register for workshops, sports festivals, cultural events, and
                career fairs — all in one place with instant QR confirmation.
              </p>
              {/* Search bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search events, categories…"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/6 border border-white/10 text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500/50 transition-all duration-200"
                  />
                </div>
                <button
                  onClick={() => scrollTo("section-events")}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/25 transition-all duration-200 shrink-0"
                >
                  Browse Events <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {/* Mini stats */}
              <div className="flex items-center gap-8">
                {[
                  ["5,847", "Students"],
                  ["342", "Events"],
                  ["89.3%", "Attendance"],
                ].map(([v, l]) => (
                  <div key={l} className="flex flex-col">
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                      {v}
                    </span>
                    <span className="text-xs text-slate-500 font-medium mt-0.5">
                      {l}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: featured event card */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0, 0, 0.58, 1] }}
              className="relative"
            >
              <div className="absolute inset-0 scale-95 blur-2xl bg-blue-600/15 rounded-3xl" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 backdrop-blur-sm">
                <div className="relative h-64 overflow-hidden">
                  <motion.img
                    key={carouselIdx}
                    src={cur?.banner}
                    alt={cur?.title}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.55 }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white backdrop-blur-sm">
                      <Star className="w-3 h-3" /> Featured
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    {featuredEvents.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselIdx(i)}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          i === carouselIdx
                            ? "bg-white w-5"
                            : "bg-white/40 w-1.5",
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <Badge color={catColors[cur?.category || ""] || "blue"}>
                        {cur?.category}
                      </Badge>
                      <h3 className="font-bold text-white text-lg mt-2 leading-tight">
                        {cur?.title}
                      </h3>
                    </div>
                    <button className="p-2 rounded-xl bg-white/8 text-slate-400 hover:text-white hover:bg-white/12 transition-colors flex-shrink-0">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {cur?.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {cur?.location.split(",")[0]}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500">
                        {cur?.registered}/{cur?.seats} registered
                      </span>
                      <span className="font-semibold text-emerald-400">
                        {remaining} seats left
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.round(((cur?.registered || 0) / (cur?.seats || 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => nav("login")}
                    className="w-full py-2.5 text-sm font-bold text-white rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors duration-200"
                  >
                    Register Now
                  </button>
                </div>
              </div>
              {/* Floating chips */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="absolute -top-5 -right-4 hidden lg:flex items-center gap-2 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Instant QR Pass
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Upon registration
                  </p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65, duration: 0.4 }}
                className="absolute -bottom-4 -left-4 hidden lg:flex items-center gap-2 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 shadow-xl"
              >
                <div className="flex -space-x-2">
                  {["AJ", "BK", "CM"].map((i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    +{cur?.registered ?? 0} registered
                  </p>
                  <p className="text-[10px] text-slate-500">Join them today</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-[#0A1020] border-y border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {(
              [
                [Users, "5,847", "Registered Students", "text-blue-400"],
                [Calendar, "342", "Total Events", "text-indigo-400"],
                [Activity, "89.3%", "Avg Attendance Rate", "text-emerald-400"],
                [Award, "24", "Organizers", "text-violet-400"],
              ] as [React.ElementType, string, string, string][]
            ).map(([Icon, v, l, col]) => (
              <div key={l} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 flex-shrink-0">
                  <Icon className={cn("w-5 h-5", col)} />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-white">{v}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section
        id="section-categories"
        className="py-20 bg-white dark:bg-slate-950"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
                Explore
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Event Categories
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Find events that match your interests
              </p>
            </div>
            <Btn
              variant="outline"
              size="sm"
              onClick={() => scrollTo("section-events")}
            >
              View All <ArrowRight className="w-4 h-4" />
            </Btn>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setShowCategoryModal(cat.name)}
                className={cn(
                  "group flex flex-col items-center p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg",
                  cat.bg,
                  cat.border,
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-200 group-hover:scale-110",
                    cat.bg,
                    "shadow-sm",
                  )}
                >
                  <cat.icon className={cn("w-6 h-6", cat.text)} />
                </div>
                <p className={cn("font-bold text-sm", cat.text)}>{cat.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {cat.count} events
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ── */}
      <section
        id="section-events"
        className="py-20 bg-slate-50 dark:bg-slate-900/60"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">
                Don&apos;t miss out
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Upcoming Events
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Register before seats run out
              </p>
            </div>
            <Btn variant="outline" size="sm">
              Browse All
            </Btn>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EVENTS.slice(0, 3).map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onView={() => nav("event-details")}
                onRegister={() => nav("login")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-12">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 30%, white 0%, transparent 60%), radial-gradient(circle at 70% 70%, white 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">
                Join the community
              </p>
              <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                Ready to start your
                <br />
                campus journey?
              </h2>
              <p className="text-blue-100 mb-8 max-w-md mx-auto">
                Create your free account and access all campus events with
                instant QR registration.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => nav("signup")}
                  className="px-8 py-3.5 text-sm font-bold text-blue-700 rounded-2xl bg-white hover:bg-blue-50 shadow-xl transition-all duration-200"
                >
                  Create Free Account
                </button>
                <button
                  onClick={() => scrollTo("section-events")}
                  className="px-8 py-3.5 text-sm font-bold text-white rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 transition-all duration-200"
                >
                  Browse Events First
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        id="section-about"
        className="bg-[#050B18] text-slate-500 py-14 border-t border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-base">UniEvents</span>
            </div>
            <p className="text-sm leading-relaxed">
              The official event management platform for our university campus
              community.
            </p>
          </div>
          {(
            [
              [
                "Quick Links",
                ["Browse Events", "My Registrations", "Calendar", "Profile"],
              ],
              [
                "Support",
                ["Help Center", "Contact Us", "FAQ", "Privacy Policy"],
              ],
            ] as [string, string[]][]
          ).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{title}</h4>
              <ul className="space-y-2.5 text-sm">
                {links.map((l) => (
                  <li key={l}>
                    <button className="hover:text-blue-400 transition-colors duration-200">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div id="section-contact">
            <h4 className="font-semibold text-white mb-4 text-sm">
              Stay Connected
            </h4>
            <div className="flex gap-2 mb-5">
              {([Globe, Mail, MessageCircle] as React.ElementType[]).map(
                (Icon, i) => (
                  <button
                    key={i}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-600 text-slate-500 hover:text-white transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ),
              )}
            </div>
            <p className="text-xs">© 2024 UniEvents. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── Category Modal ── */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCategoryModal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Grid className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {showCategoryModal} Events
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Explore {showCategoryModal.toLowerCase()} activities on
                    campus
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(null)}
                className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm border border-slate-100 dark:border-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30 flex-1">
              {(() => {
                const baseEvents = EVENTS.filter(
                  (e) => e.category === showCategoryModal,
                );
                const count =
                  CATEGORIES.find((c) => c.name === showCategoryModal)?.count ||
                  0;
                const displayEvents =
                  baseEvents.length > 0
                    ? Array.from({ length: count }, (_, i) => ({
                        ...baseEvents[i % baseEvents.length],
                        id: `mock-${showCategoryModal}-${i}`,
                      }))
                    : [];
                return displayEvents.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {displayEvents.map((e) => (
                      <EventCard
                        key={e.id}
                        event={e}
                        compact
                        onView={() => nav("event-details")}
                        onRegister={() => nav("login")}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Search className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                    <p className="font-semibold text-slate-400">
                      No events found in this category.
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      Check back later for new events.
                    </p>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AuthCard({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
      >
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold">{title}</h1>
          <p className="text-blue-100 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  extra,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  icon?: React.ElementType;
  value?: string;
  onChange?: (v: string) => void;
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

function LoginScreen({
  nav,
  onLogin,
}: {
  nav: (s: Screen) => void;
  onLogin: (r: Role, email?: string, password?: string) => void;
}) {
  const demoEmails: Record<Role, string> = {
    student: "student@uni.edu",
    organizer: "organizer@uni.edu",
    admin: "admin@uni.edu",
  };
  const [role, setRole] = useState<Role>("student");
  const [email, setEmail] = useState(demoEmails.student);
  const [pass, setPass] = useState("password123");
  return (
    <AuthCard title="Welcome Back" subtitle="Sign in to your UniEvents account">
      <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-5">
        {(["student", "organizer", "admin"] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r);
              setEmail(demoEmails[r]);
              setPass("password123");
            }}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
              role === r
                ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        <InputField
          label="Email Address"
          type="email"
          icon={AtSign}
          placeholder="your@university.edu"
          value={email}
          onChange={setEmail}
        />
        <InputField
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={pass}
          onChange={setPass}
          extra={
            <button
              onClick={() => nav("forgot-password")}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Forgot password?
            </button>
          }
        />
        <Btn
          variant="primary"
          className="w-full justify-center py-3"
          onClick={() => onLogin(role, email, pass)}
        >
          Sign In <ArrowRight className="w-4 h-4" />
        </Btn>
        <p className="text-center text-sm text-slate-500">
          New to UniEvents?{" "}
          <button
            onClick={() => nav("signup")}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Create Account
          </button>
        </p>
      </div>
      <div className="mt-5 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium text-center">
          Demo: click Sign In with any role to explore the prototype
        </p>
      </div>
    </AuthCard>
  );
}

function SignupScreen({
  nav,
  onLogin,
}: {
  nav: (s: Screen) => void;
  onLogin: (r: Role, email?: string, password?: string) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Computer Science");
  const [busy, setBusy] = useState(false);

  const register = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      password.length < 8
    )
      return;
    setBusy(true);
    try {
      await api.auth.register({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password,
        department,
        studentId: studentId.trim() || undefined,
      });
      onLogin("student", email, password);
    } catch {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Create Account"
      subtitle="Join thousands of students on UniEvents"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="First Name"
            placeholder="Alex"
            value={firstName}
            onChange={setFirstName}
          />
          <InputField
            label="Last Name"
            placeholder="Johnson"
            value={lastName}
            onChange={setLastName}
          />
        </div>
        <InputField
          label="Student ID"
          icon={Tag}
          placeholder="STU-2024-XXXX"
          value={studentId}
          onChange={setStudentId}
        />
        <InputField
          label="University Email"
          type="email"
          icon={AtSign}
          placeholder="alex@university.edu"
          value={email}
          onChange={setEmail}
        />
        <InputField
          label="Password"
          type="password"
          icon={Lock}
          placeholder="Min. 8 characters"
          value={password}
          onChange={setPassword}
        />
        <div>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
            Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[
              "Computer Science",
              "Engineering",
              "Business",
              "Arts & Humanities",
              "Medicine",
              "Law",
            ].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <Btn
          variant="primary"
          className="w-full justify-center py-3"
          onClick={() => void register()}
          disabled={busy}
        >
          {busy ? "Creating…" : "Create Account"}{" "}
          <ArrowRight className="w-4 h-4" />
        </Btn>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <button
            onClick={() => nav("login")}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Sign In
          </button>
        </p>
      </div>
    </AuthCard>
  );
}

function ForgotPasswordScreen({ nav }: { nav: (s: Screen) => void }) {
  const [sent, setSent] = useState(false);
  return (
    <AuthCard
      title="Reset Password"
      subtitle="We will send you a recovery link"
    >
      {!sent ? (
        <div className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-3">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter your university email and we will send password reset
              instructions.
            </p>
          </div>
          <InputField
            label="University Email"
            type="email"
            icon={AtSign}
            placeholder="alex@university.edu"
          />
          <Btn
            variant="primary"
            className="w-full justify-center py-3"
            onClick={() => setSent(true)}
          >
            Send Reset Link <ArrowRight className="w-4 h-4" />
          </Btn>
          <button
            onClick={() => nav("login")}
            className="w-full text-center text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Email Sent!
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Check your inbox for the password reset link. It expires in 30
              minutes.
            </p>
          </div>
          <Btn
            variant="primary"
            className="w-full justify-center py-3"
            onClick={() => nav("verify-email")}
          >
            Check Email
          </Btn>
          <Btn
            variant="ghost"
            className="w-full justify-center"
            onClick={() => nav("login")}
          >
            Back to Sign In
          </Btn>
        </div>
      )}
    </AuthCard>
  );
}

function VerifyEmailScreen({
  nav,
  onLogin,
}: {
  nav: (s: Screen) => void;
  onLogin: (r: Role) => void;
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  return (
    <AuthCard
      title="Verify Your Email"
      subtitle="Enter the 6-digit code we sent to alex@university.edu"
    >
      <div className="space-y-5">
        <div className="flex justify-center gap-2">
          {code.map((v, i) => (
            <input
              key={i}
              maxLength={1}
              value={v}
              onChange={(e) => {
                const n = [...code];
                n[i] = e.target.value;
                setCode(n);
              }}
              className="w-12 h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
            />
          ))}
        </div>
        <Btn
          variant="primary"
          className="w-full justify-center py-3"
          onClick={() => onLogin("student")}
        >
          Verify Email <CheckCircle className="w-4 h-4" />
        </Btn>
        <div className="text-center">
          <p className="text-sm text-slate-500">Did not receive the code?</p>
          <button className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1">
            Resend Code
          </button>
        </div>
      </div>
    </AuthCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

function StudentDashboard({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">Good morning,</p>
            <h2 className="text-2xl font-extrabold mt-0.5">Alex Johnson 👋</h2>
            <p className="text-blue-100 text-sm mt-1">
              Computer Science · Year 3 · Student ID: STU-2024-7841
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-xs">Today</p>
            <p className="font-bold">Feb 27, 2024</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Btn variant="success" size="sm" onClick={() => nav("event-listing")}>
            Browse Events <ArrowRight className="w-4 h-4" />
          </Btn>
          <Btn
            size="sm"
            onClick={() => nav("my-events")}
            className="bg-white/20 text-white hover:bg-white/30 border-0"
          >
            My Events
          </Btn>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="Registered Events"
          value="5"
          trend="+2 this month"
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Events Attended"
          value="12"
          trend="+3 vs last month"
          color="green"
        />
        <StatCard
          icon={Star}
          label="Avg Rating Given"
          value="4.6"
          color="amber"
        />
        <StatCard
          icon={Award}
          label="Attendance Score"
          value="94%"
          trend="+5% vs avg"
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Upcoming Registrations
            </h3>
            <Btn variant="ghost" size="xs" onClick={() => nav("my-events")}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Btn>
          </div>
          <div className="space-y-3">
            {[
              {
                id: 1,
                title: "Tech Summit 2024",
                date: "Feb 28, 2024",
                time: "9:00 AM",
                location: "Main Auditorium",
                status: "confirmed",
              },
              {
                id: 4,
                title: "Career Fair 2024",
                date: "Mar 18, 2024",
                time: "10:00 AM",
                location: "Exhibition Hall",
                status: "confirmed",
              },
            ].map((ev) => (
              <div
                key={ev.id}
                onClick={() => nav("event-details")}
                className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border border-slate-100 dark:border-slate-700"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                    {ev.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ev.date} · {ev.time} · {ev.location}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge color="green" dot>
                    Confirmed
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nav("registration-success");
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <QrCode className="w-3 h-3" />
                    QR Pass
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Calendar + Notifications */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                February 2024
              </h3>
              <div className="flex gap-1">
                <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-slate-400 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <span key={d} className="font-semibold">
                  {d}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center text-xs gap-y-1">
              {Array.from({ length: 35 }, (_, i) => {
                const day = i - 3; // Feb starts on Thursday
                const valid = day >= 1 && day <= 29;
                const hasEvent = [5, 12, 14, 19, 28].includes(day);
                const isToday = day === 27;
                return (
                  <div
                    key={i}
                    className={cn(
                      "h-7 flex flex-col items-center justify-center rounded-lg relative cursor-pointer transition-colors",
                      isToday
                        ? "bg-blue-600 text-white font-bold"
                        : hasEvent
                          ? "text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950"
                          : valid
                            ? "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                            : "text-slate-200 dark:text-slate-700",
                    )}
                  >
                    {valid && day}
                    {hasEvent && !isToday && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-blue-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Recent Notifications
              </h3>
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                2
              </span>
            </div>
            {NOTIFS.slice(0, 3).map((n) => (
              <div
                key={n.id}
                onClick={() => nav("notifications")}
                className={cn(
                  "flex gap-3 p-2.5 rounded-xl cursor-pointer mb-1 transition-colors",
                  !n.read
                    ? "bg-blue-50 dark:bg-blue-950/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50",
                )}
              >
                <n.Icon
                  className={cn("w-4 h-4 mt-0.5 flex-shrink-0", n.color)}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{n.time}</p>
                </div>
                {!n.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                )}
              </div>
            ))}
            <button
              onClick={() => nav("notifications")}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-2 block"
            >
              View all notifications
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Recommended for You
          </h3>
          <Btn variant="ghost" size="xs" onClick={() => nav("event-listing")}>
            See All <ArrowRight className="w-3.5 h-3.5" />
          </Btn>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {EVENTS.slice(1, 4).map((e) => (
            <EventCard
              key={e.id}
              event={e}
              compact
              onView={() => nav("event-details")}
              onRegister={() => nav("event-details")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventListingScreen({ nav }: { nav: (s: Screen) => void }) {
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    api.events
      .list({ when: "upcoming" })
      .then(({ events: rows }) => setEvents(rows))
      .catch((error) => {
        setEvents([]);
        setLoadError(
          error instanceof Error ? error.message : "Could not load events",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    ...new Set(events.map((event) => event.category?.name).filter(Boolean)),
  ] as string[];
  const filtered = events.filter((event) => {
    const query = search.trim().toLowerCase();
    return (
      (selCat === "All" || event.category?.name === selCat) &&
      (!query ||
        [event.title, event.description, event.location, ...event.tags]
          .join(" ")
          .toLowerCase()
          .includes(query))
    );
  });
  const cardEvents = filtered.map((event) => ({
    id: event.id,
    title: event.title,
    category: event.category?.name ?? "Event",
    date: new Date(event.startsAt).toLocaleDateString(),
    time: `${new Date(event.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${new Date(event.endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`,
    location: event.location,
    seats: event.seatLimit,
    registered: event.registeredCount,
    banner: event.coverImage ?? "",
    description: event.description,
    organizer: event.host?.name ?? "Campus Events",
    featured: event.featured,
    tags: event.tags,
    deadline: event.registrationDeadline ?? "",
    agenda: event.agenda,
    speakers: event.speakers,
    isRegistered: event.isRegistered,
  }));
  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("student-dashboard")} label="Dashboard" />
      {/* Search + Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events by name, organizer, tags..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-500 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-blue-400 transition-all shadow-inner"
            />
          </div>
          <select className="px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500">
            {["Any Date", "Today", "This Week", "This Month", "Next Month"].map(
              (d) => (
                <option key={d}>{d}</option>
              ),
            )}
          </select>
          <select className="px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500">
            {[
              "All Locations",
              "Main Auditorium",
              "Innovation Lab",
              "Sports Field",
              "Exhibition Hall",
            ].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                view === "grid"
                  ? "bg-white dark:bg-slate-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                view === "list"
                  ? "bg-white dark:bg-slate-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600",
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mt-3">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelCat(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                selCat === cat
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? "Loading events…" : `${filtered.length} events found`}
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          Sort by:{" "}
          <select className="bg-transparent font-medium text-slate-700 dark:text-slate-300 outline-none">
            <option>Upcoming</option>
            <option>Popularity</option>
            <option>Seats Left</option>
          </select>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl p-4 text-sm text-red-700 dark:text-red-300">
          {loadError}. Make sure the backend is running with{" "}
          <strong>npm run dev</strong>.
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-slate-400">
          Loading events…
        </div>
      ) : view === "grid" ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cardEvents.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onView={() => nav("event-details", { eventId: e.id })}
              onRegister={() => nav("event-details", { eventId: e.id })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const remaining = e.remaining;
            const catColor: Record<string, string> = {
              Technology: "blue",
              Sports: "green",
              Arts: "purple",
              Career: "amber",
              Science: "red",
              Social: "pink",
            };
            return (
              <div
                key={e.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex gap-4 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                {e.coverImage ? (
                  <img
                    src={e.coverImage}
                    alt={e.title}
                    className="w-24 h-20 object-cover rounded-xl bg-slate-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex gap-1.5 mb-1">
                        <Badge
                          color={catColor[e.category?.name ?? ""] || "blue"}
                        >
                          {e.category?.name ?? "Event"}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {e.title}
                      </h3>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-bold flex-shrink-0",
                        remaining === 0
                          ? "text-red-500"
                          : remaining <= 10
                            ? "text-amber-500"
                            : "text-emerald-500",
                      )}
                    >
                      {remaining === 0 ? "Sold Out" : `${remaining} left`}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {new Date(e.startsAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      {e.location.split(",")[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      {e.registeredCount}/{e.seatLimit}
                    </span>
                  </div>
                  <ProgressBar
                    value={e.registeredCount}
                    max={e.seatLimit}
                    className="mt-2 w-48"
                  />
                </div>
                <div className="flex flex-col gap-2 justify-center flex-shrink-0">
                  <Btn
                    variant="outline"
                    size="sm"
                    onClick={() => nav("event-details", { eventId: e.id })}
                  >
                    Details
                  </Btn>
                  <Btn
                    variant="primary"
                    size="sm"
                    onClick={() => nav("event-details", { eventId: e.id })}
                    disabled={remaining === 0 || e.isRegistered}
                  >
                    {e.isRegistered ? "Registered" : "Register"}
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-semibold text-slate-400">No events found</p>
          <p className="text-sm text-slate-400 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}

function EventDetailsScreen({
  nav,
  registered,
  onRegister,
  isLoggedIn = true,
}: {
  nav: (s: Screen) => void;
  registered: boolean;
  onRegister: () => void;
  isLoggedIn?: boolean;
}) {
  const event = EVENTS[0];
  const [showDialog, setShowDialog] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({
    msg: "",
    visible: false,
  });
  const remaining = event.seats - event.registered;

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };

  const handleCalendarPick = (option: string) => {
    setShowCalModal(false);
    showToast(
      "✓ Event successfully added to your calendar.\nA reminder email will be sent 24 hours before the event.",
    );
  };

  const handleSharePick = (option: string) => {
    setShowShareModal(false);
    if (option === "Copy Link") showToast("✓ Event link copied successfully.");
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

  const catColors: Record<string, { from: string; to: string; badge: string }> =
    {
      Technology: {
        from: "from-blue-600",
        to: "to-indigo-700",
        badge: "bg-blue-500/30 text-blue-100 border-blue-400/30",
      },
      Sports: {
        from: "from-emerald-500",
        to: "to-teal-600",
        badge: "bg-emerald-500/30 text-emerald-100 border-emerald-400/30",
      },
      Arts: {
        from: "from-purple-600",
        to: "to-pink-600",
        badge: "bg-purple-500/30 text-purple-100 border-purple-400/30",
      },
      Career: {
        from: "from-amber-500",
        to: "to-orange-600",
        badge: "bg-amber-500/30 text-amber-100 border-amber-400/30",
      },
      Science: {
        from: "from-red-500",
        to: "to-rose-600",
        badge: "bg-red-500/30 text-red-100 border-red-400/30",
      },
      Social: {
        from: "from-pink-500",
        to: "to-fuchsia-600",
        badge: "bg-pink-500/30 text-pink-100 border-pink-400/30",
      },
    };
  const cc = catColors[event.category] || catColors.Technology;
  const speakerGradients = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-purple-500 to-pink-600",
    "from-amber-500 to-orange-600",
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <img
          src={event.banner}
          alt={event.title}
          className="w-full h-72 object-cover bg-slate-100"
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t",
            cc.from.replace("from-", "from-") +
              "/60 via-black/30 to-transparent",
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
              {event.category}
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
            by {event.organizer}
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
                { icon: Calendar, label: "Date", value: event.date },
                {
                  icon: Clock,
                  label: "Time",
                  value: event.time.split("–")[0].trim(),
                },
                {
                  icon: MapPin,
                  label: "Venue",
                  value: event.location.split(",")[0],
                },
                {
                  icon: Users,
                  label: "Seats",
                  value: `${event.registered}/${event.seats}`,
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
              <CountdownTimer targetDate="2024-02-28T09:00:00" />
            </div>
            <p className="text-slate-500 text-xs mt-2 relative">
              Registration deadline: {event.deadline}
            </p>
          </div>

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
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
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
                      {s.initials}
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
                <span className="font-bold">
                  {event.seats - event.registered} left
                </span>
              </div>
              <div className="w-full bg-white/25 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-white transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.round((event.registered / event.seats) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs opacity-75 mt-1.5">
                {event.registered} of {event.seats} registered
              </p>
            </div>

            <div className="p-5 space-y-3">
              {!isLoggedIn ? (
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
                  <p className="text-xs text-slate-400 text-center">
                    Deadline: {event.deadline}
                  </p>
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
                        Confirmation sent to your email
                      </p>
                    </div>
                  </div>
                  <Btn
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => nav("registration-success")}
                  >
                    <QrCode className="w-4 h-4" />
                    View QR Pass
                  </Btn>
                  <Btn
                    variant="outline"
                    className="w-full justify-center text-red-600 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={onRegister}
                  >
                    Unregister
                  </Btn>
                </>
              ) : (
                <>
                  <Btn
                    variant="primary"
                    className="w-full justify-center py-3 text-base"
                    onClick={() => setShowDialog(true)}
                    disabled={remaining === 0}
                  >
                    {remaining === 0 ? "Event Full" : "Register Now"}{" "}
                    <ArrowRight className="w-4 h-4" />
                  </Btn>
                  <p className="text-xs text-slate-400 text-center">
                    Deadline: {event.deadline}
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
                  {event.date}
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
                  Alex Johnson
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center mb-4">
              A QR code confirmation will be sent to alex.johnson@university.edu
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
                onClick={() => {
                  setShowDialog(false);
                  onRegister();
                  nav("registration-success");
                }}
              >
                Confirm <CheckCircle className="w-4 h-4" />
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
                {event.date} · {event.time.split("–")[0].trim()}
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
                  onClick={() => handleCalendarPick(opt.label)}
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
                unievents.edu/events/tech-summit-2024
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
                  Main Auditorium
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
                      Main Auditorium
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Block A, Ground Floor
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      University Main Campus
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      123 University Avenue, Academic District, Block A — Room
                      001
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Doors open at 8:30 AM
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gates close 30 minutes after event start
                    </p>
                  </div>
                </div>
              </div>
              <a
                href="https://maps.google.com"
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

      {/* Toast Notification */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300",
          toast.visible
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
            {toast.msg}
          </p>
        </div>
      </div>
    </div>
  );
}

function RegistrationSuccessScreen({ nav }: { nav: (s: Screen) => void }) {
  const [dlState, setDlState] = useState<"idle" | "loading" | "done">("idle");
  const [showCalModal, setShowCalModal] = useState(false);
  const [calToast, setCalToast] = useState(false);
  const [qrEnlarged, setQrEnlarged] = useState(false);
  const [ticketCode, setTicketCode] = useState("Loading ticket…");

  useEffect(() => {
    api.registrations
      .mine()
      .then(({ registrations }) => {
        const latest = registrations[registrations.length - 1];
        if (latest?.ticketCode) setTicketCode(latest.ticketCode);
      })
      .catch(() => setTicketCode("Ticket unavailable"));
  }, []);

  const handleDownload = () => {
    if (dlState !== "idle") return;
    setDlState("loading");
    setTimeout(() => setDlState("done"), 1500);
  };

  const handleCalPick = () => {
    setShowCalModal(false);
    setCalToast(true);
    setTimeout(() => setCalToast(false), 3500);
  };

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md mb-4">
        <BackBtn onClick={() => nav("event-details")} label="Event Details" />
      </div>
      <div className="flex items-center justify-center flex-1 w-full">
        <Confetti />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="max-w-md w-full"
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-white text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <CheckCircle className="w-16 h-16 mx-auto mb-3" />
              </motion.div>
              <h1 className="text-2xl font-extrabold">
                Registration Successful!
              </h1>
              <p className="text-emerald-100 mt-1 text-sm">
                You are officially registered for Tech Summit 2024
              </p>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Event</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Tech Summit 2024
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Feb 28, 2024
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Venue</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Main Auditorium
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    STU-2024-7841
                  </span>
                </div>
              </div>

              {/* QR Code — click to enlarge */}
              <div className="flex flex-col items-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Your Admission QR Code
                </p>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setQrEnlarged(true)}
                  className="p-3 bg-white border-2 border-blue-100 dark:border-blue-900 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-zoom-in"
                  title="Click to enlarge"
                >
                  <QRCodeDisplay studentId={ticketCode} />
                </motion.button>
                <p className="text-xs text-slate-400 mt-2">
                  Tap QR to enlarge · Show at event entrance
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                  {ticketCode}
                </p>
              </div>

              <div className="flex gap-3">
                <Btn
                  variant="primary"
                  className="flex-1 justify-center"
                  onClick={handleDownload}
                  disabled={dlState === "loading"}
                >
                  {dlState === "idle" && (
                    <>
                      <Download className="w-4 h-4" />
                      Download Pass
                    </>
                  )}
                  {dlState === "loading" && (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Downloading…
                    </>
                  )}
                  {dlState === "done" && (
                    <>
                      <Check className="w-4 h-4" />
                      Downloaded
                    </>
                  )}
                </Btn>
                <Btn
                  variant="outline"
                  className="flex-1 justify-center"
                  onClick={() => setShowCalModal(true)}
                >
                  <Calendar className="w-4 h-4" />
                  Add to Cal
                </Btn>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900 text-xs">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-blue-700 dark:text-blue-300">
                  A copy has been sent to{" "}
                  <span className="font-semibold">
                    alex.johnson@university.edu
                  </span>
                </p>
              </div>
              <Btn
                variant="ghost"
                className="w-full justify-center"
                onClick={() => nav("student-dashboard")}
              >
                Back to Dashboard
              </Btn>
            </div>
          </div>
        </motion.div>

        {/* QR Enlarged preview */}
        {qrEnlarged && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            style={{
              animation: "fadeIn 300ms cubic-bezier(0,0,0.58,1) forwards",
            }}
            onClick={() => setQrEnlarged(false)}
          >
            <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes popUp{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
            <div
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl text-center max-w-xs w-full"
              style={{
                animation: "popUp 300ms cubic-bezier(0,0,0.58,1) forwards",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Your QR Pass
              </p>
              <div className="p-4 bg-white border-2 border-blue-100 dark:border-blue-900 rounded-2xl shadow-lg inline-block">
                <QRCodeDisplay studentId={ticketCode} />
              </div>
              <p className="text-xs text-slate-400 mt-3 mb-1">{ticketCode}</p>
              <p className="text-xs text-slate-400 mb-4">
                Tech Summit 2024 · Feb 28, 2024
              </p>
              <div className="flex gap-2">
                <Btn
                  variant="primary"
                  className="flex-1 justify-center"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="w-3.5 h-3.5" />
                  {dlState === "done" ? "Downloaded" : "Download"}
                </Btn>
                <Btn
                  variant="outline"
                  className="flex-1 justify-center"
                  size="sm"
                  onClick={() => setQrEnlarged(false)}
                >
                  <X className="w-3.5 h-3.5" />
                  Close
                </Btn>
              </div>
            </div>
          </div>
        )}

        {/* Add to Calendar modal */}
        {showCalModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            style={{
              animation: "fadeIn 300ms cubic-bezier(0,0,0.58,1) forwards",
            }}
            onClick={() => setShowCalModal(false)}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              style={{
                animation: "popUp 300ms cubic-bezier(0,0,0.58,1) forwards",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Add Event to Calendar
                </h3>
                <button
                  onClick={() => setShowCalModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4 text-sm space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Tech Summit 2024
                </p>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Feb 28, 2024 · 9:00 AM
                </p>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  Main Auditorium
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Google Calendar", dot: "bg-red-500" },
                  { label: "Outlook Calendar", dot: "bg-blue-600" },
                  {
                    label: "Apple Calendar",
                    dot: "bg-slate-800 dark:bg-white",
                  },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={handleCalPick}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all duration-300"
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
          </div>
        )}

        {/* Calendar success toast */}
        <div
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300",
            calToast
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
            <div>
              <p className="text-sm font-bold leading-tight">
                Event Added Successfully
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                The event has been added to your calendar. A reminder email will
                be sent automatically 24 hours before the event.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyEventsScreen({ nav }: { nav: (s: Screen) => void }) {
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const tabs = [
    { id: "upcoming", label: "Upcoming", count: 2 },
    { id: "past", label: "Past / Attended", count: 2 },
    { id: "cancelled", label: "Cancelled", count: 1 },
  ] as const;
  const data = {
    upcoming: [
      {
        title: "Tech Summit 2024",
        date: "Feb 28, 2024",
        time: "9:00 AM",
        location: "Main Auditorium",
        status: "confirmed",
        cat: "Technology",
      },
      {
        title: "Career Fair 2024",
        date: "Mar 18, 2024",
        time: "10:00 AM",
        location: "Exhibition Hall",
        status: "confirmed",
        cat: "Career",
      },
    ],
    past: [
      {
        title: "Winter Coding Contest",
        date: "Jan 15, 2024",
        time: "9:00 AM",
        location: "CS Lab",
        status: "attended",
        cat: "Technology",
      },
      {
        title: "Photography Workshop",
        date: "Dec 20, 2023",
        time: "2:00 PM",
        location: "Arts Building",
        status: "attended",
        cat: "Arts",
      },
    ],
    cancelled: [
      {
        title: "AI Workshop",
        date: "Jan 30, 2024",
        time: "10:00 AM",
        location: "Innovation Lab",
        status: "cancelled",
        cat: "Technology",
      },
    ],
  };
  const statusColor: Record<string, { text: string; badge: string }> = {
    confirmed: { text: "text-emerald-600", badge: "green" },
    attended: { text: "text-blue-600", badge: "blue" },
    cancelled: { text: "text-red-600", badge: "red" },
  };
  const catColor: Record<string, string> = {
    Technology: "blue",
    Sports: "green",
    Arts: "purple",
    Career: "amber",
    Science: "red",
    Social: "pink",
  };
  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("student-dashboard")} label="Dashboard" />
      <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex-1 justify-center",
              tab === t.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
            )}
          >
            {t.label}
            <span
              className={cn(
                "text-xs rounded-full px-1.5 py-0.5 font-bold",
                tab === t.id
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {data[tab].map((ev, i) => (
          <div
            key={i}
            className={cn(
              "bg-white dark:bg-slate-800 rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all",
              ev.status === "cancelled"
                ? "border-red-100 dark:border-red-900 opacity-70"
                : "border-slate-100 dark:border-slate-700",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-4 items-start">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    ev.status === "attended"
                      ? "bg-blue-50 dark:bg-blue-950"
                      : ev.status === "cancelled"
                        ? "bg-red-50 dark:bg-red-950"
                        : "bg-emerald-50 dark:bg-emerald-950",
                  )}
                >
                  {ev.status === "attended" ? (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  ) : ev.status === "cancelled" ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Ticket className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                <div>
                  <div className="flex gap-2 mb-1 flex-wrap">
                    <Badge color={catColor[ev.cat] || "blue"}>{ev.cat}</Badge>
                    <Badge color={statusColor[ev.status].badge} dot>
                      {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {ev.title}
                  </h3>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-500" />
                      {ev.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      {ev.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      {ev.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end flex-shrink-0">
                {ev.status === "confirmed" && (
                  <Btn
                    variant="primary"
                    size="sm"
                    onClick={() => nav("registration-success")}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR Pass
                  </Btn>
                )}
                {ev.status === "attended" && (
                  <Btn
                    variant="secondary"
                    size="sm"
                    onClick={() => nav("feedback")}
                  >
                    <Star className="w-3.5 h-3.5" />
                    Give Feedback
                  </Btn>
                )}
                {ev.status === "cancelled" && (
                  <Badge color="red">Cancelled</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarScreen({ nav }: { nav: (s: Screen) => void }) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">(
    "month",
  );
  const eventDots: Record<number, { color: string; title: string }[]> = {
    5: [{ color: "bg-blue-500", title: "Coding Workshop" }],
    12: [{ color: "bg-emerald-500", title: "Sports Festival" }],
    14: [{ color: "bg-purple-500", title: "Art Exhibition" }],
    19: [{ color: "bg-amber-500", title: "Career Talk" }],
    22: [{ color: "bg-pink-500", title: "Music Night" }],
    28: [
      { color: "bg-blue-600", title: "Tech Summit 2024" },
      { color: "bg-red-500", title: "Hackathon" },
    ],
  };
  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("student-dashboard")} label="Dashboard" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            February 2024
          </h2>
          <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(["month", "week", "agenda"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                viewMode === v
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "month" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center py-3 text-xs font-bold text-slate-500 dark:text-slate-400"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 3;
              const valid = day >= 1 && day <= 29;
              const isToday = day === 27;
              const dots = eventDots[day] || [];
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[80px] p-2 border-b border-r border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors",
                    !valid && "bg-slate-50/50 dark:bg-slate-900/30",
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1",
                      isToday
                        ? "bg-blue-600 text-white"
                        : valid
                          ? "text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                          : "text-slate-300 dark:text-slate-700",
                    )}
                  >
                    {valid ? day : ""}
                  </div>
                  <div className="space-y-0.5">
                    {dots.slice(0, 2).map((dot, di) => (
                      <div
                        key={di}
                        onClick={() => nav("event-details")}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-md text-white font-medium truncate cursor-pointer",
                          dot.color,
                        )}
                      >
                        {dot.title}
                      </div>
                    ))}
                    {dots.length > 2 && (
                      <p className="text-xs text-slate-400 pl-1">
                        +{dots.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "agenda" && (
        <div className="space-y-3">
          {EVENTS.map((ev) => (
            <div
              key={ev.id}
              onClick={() => nav("event-details")}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex gap-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-14 text-center flex-shrink-0">
                <p className="text-xs text-slate-400 uppercase font-semibold">
                  {ev.date.split(" ")[0]}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {ev.date.split(" ")[1].replace(",", "")}
                </p>
              </div>
              <div className="w-1 rounded-full bg-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  {ev.title}
                </h3>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" />
                    {ev.time.split("–")[0].trim()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    {ev.location.split(",")[0]}
                  </span>
                </div>
              </div>
              <Badge
                color={
                  {
                    Technology: "blue",
                    Sports: "green",
                    Arts: "purple",
                    Career: "amber",
                    Science: "red",
                    Social: "pink",
                  }[ev.category] || "blue"
                }
              >
                {ev.category}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationsScreen({ nav }: { nav: (s: Screen) => void }) {
  const [notifs, setNotifs] = useState(NOTIFS);
  const markAll = () => setNotifs((n) => n.map((i) => ({ ...i, read: true })));
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <BackBtn onClick={() => nav("student-dashboard")} label="Dashboard" />
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {notifs.filter((n) => !n.read).length} unread
        </p>
        <Btn variant="ghost" size="sm" onClick={markAll}>
          Mark all as read
        </Btn>
      </div>
      {notifs.map((n) => (
        <motion.div
          key={n.id}
          layout
          className={cn(
            "bg-white dark:bg-slate-800 rounded-2xl border shadow-sm p-4 transition-all hover:shadow-md",
            !n.read
              ? "border-blue-100 dark:border-blue-900"
              : "border-slate-100 dark:border-slate-700",
          )}
        >
          <div className="flex gap-4">
            <div className={cn("p-2.5 rounded-xl flex-shrink-0", n.bg)}>
              <n.Icon className={cn("w-5 h-5", n.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {n.title}
                </p>
                {!n.read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                {n.message}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">{n.time}</p>
                <div className="flex gap-2">
                  {n.title === "Share Your Feedback" && (
                    <Btn
                      variant="primary"
                      size="xs"
                      onClick={() => nav("feedback")}
                    >
                      Give Feedback
                    </Btn>
                  )}
                  {n.title.includes("QR") ||
                  n.title === "Registration Confirmed" ||
                  n.title === "Event Tomorrow!" ? (
                    <Btn
                      variant="secondary"
                      size="xs"
                      onClick={() => nav("registration-success")}
                    >
                      View QR
                    </Btn>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ProfileScreen({
  nav,
  isDark,
  setIsDark,
  role,
}: {
  nav: (s: Screen) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  role: Role;
}) {
  const [editing, setEditing] = useState(false);
  const [prefToast, setPrefToast] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [signOutDone, setSignOutDone] = useState(false);
  const [pwFields, setPwFields] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [secToast, setSecToast] = useState<{ msg: string; visible: boolean }>({
    msg: "",
    visible: false,
  });

  const showSecToast = (msg: string) => {
    setSecToast({ msg, visible: true });
    setTimeout(() => setSecToast((t) => ({ ...t, visible: false })), 3200);
  };

  const handleUpdatePw = () => {
    setPwDone(true);
    setTimeout(() => {
      setShowChangePw(false);
      setPwDone(false);
      setPwFields({ current: "", next: "", confirm: "" });
      showSecToast("Password updated successfully.");
    }, 1400);
  };

  const handleSignOut = () => {
    setSignOutDone(true);
    setTimeout(() => {
      setShowSignOut(false);
      setSignOutDone(false);
      showSecToast("Successfully signed out from all devices.");
    }, 1400);
  };
  const [prefs, setPrefs] = useState([
    { label: "Registration Confirmation Emails", on: true },
    { label: "Event Reminder Emails", on: true },
    { label: "Feedback Request Emails", on: true },
    { label: "Event Cancellation Notifications", on: false },
    { label: "New Event Announcements", on: false },
  ]);

  const togglePref = (i: number) => {
    setPrefs((p) =>
      p.map((item, idx) => (idx === i ? { ...item, on: !item.on } : item)),
    );
    setPrefToast(true);
    setTimeout(() => setPrefToast(false), 2800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <BackBtn
        onClick={() =>
          nav(
            role === "student"
              ? "student-dashboard"
              : role === "organizer"
                ? "organizer-dashboard"
                : "admin-operations",
          )
        }
        label="Dashboard"
      />
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div
              className={cn(
                "w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-800 flex items-center justify-center text-xl font-extrabold shadow-lg",
                role === "student"
                  ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300"
                  : role === "organizer"
                    ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300",
              )}
            >
              {role === "student" ? "AJ" : role === "organizer" ? "SW" : "AD"}
            </div>
            <Btn
              variant={editing ? "success" : "outline"}
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </>
              )}
            </Btn>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {role === "student"
              ? "Alex Johnson"
              : role === "organizer"
                ? "Sarah Williams"
                : "Admin User"}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {role === "student"
              ? "Computer Science · Year 3"
              : role === "organizer"
                ? "Faculty · Design Department"
                : "System Administrator"}
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Mail className="w-4 h-4 text-blue-500" />
              {role === "student"
                ? "alex.johnson@university.edu"
                : role === "organizer"
                  ? "s.williams@university.edu"
                  : "admin@university.edu"}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <Phone className="w-4 h-4 text-blue-500" />
              +1 (555) 0123
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Ticket}
          label="Events Registered"
          value="17"
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Events Attended"
          value="14"
          color="green"
        />
        <StatCard icon={Star} label="Reviews Given" value="11" color="amber" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="First Name" value="Alex" />
          <InputField label="Last Name" value="Johnson" />
          <InputField label="Student ID" value="STU-2024-7841" />
          <InputField label="Year" value="Year 3" />
          <InputField label="Department" value="Computer Science" />
          <InputField label="Phone" icon={Phone} value="+1 (555) 0123" />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
            Notification Preferences
          </h4>
          {prefs.map((pref, i) => (
            <div
              key={pref.label}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {pref.label}
              </span>
              <button
                onClick={() => togglePref(i)}
                className={cn(
                  "w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none",
                  pref.on ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700",
                )}
                aria-pressed={pref.on}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform duration-300",
                    pref.on ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3">
          Security
        </h3>
        <div className="space-y-2">
          <Btn
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowChangePw(true)}
          >
            <Lock className="w-4 h-4" />
            Change Password
          </Btn>
          <Btn
            variant="outline"
            className="w-full justify-start text-red-600 border-red-100 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => setShowSignOut(true)}
          >
            <LogOut className="w-4 h-4" />
            Sign Out All Devices
          </Btn>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-3">
          Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              key={isDark ? "sun" : "moon"}
              initial={{ rotate: -30, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0, 0, 0.58, 1] }}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-500" />
              )}
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Dark Mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isDark ? "Using dark theme" : "Using light theme"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={cn(
              "w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none",
              isDark ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700",
            )}
            aria-pressed={isDark}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform duration-300",
                isDark ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      </div>

      {/* Preference updated toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300",
          prefToast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none",
        )}
        style={{
          transition:
            "opacity 300ms cubic-bezier(0,0,0.58,1), transform 300ms cubic-bezier(0,0,0.58,1)",
        }}
      >
        <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold leading-tight">
              Preference Updated
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Your notification preference has been saved.
            </p>
          </div>
        </div>
      </div>

      {/* Security action toast */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]",
          secToast.visible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none",
        )}
        style={{
          transition:
            "opacity 300ms cubic-bezier(0,0,0.58,1), transform 300ms cubic-bezier(0,0,0.58,1)",
        }}
      >
        <div className="flex items-center gap-3 bg-slate-900 dark:bg-slate-950 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-sm font-semibold">{secToast.msg}</p>
        </div>
      </div>

      {/* Change Password modal */}
      {showChangePw && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{
            animation: "fadeIn 300ms cubic-bezier(0,0,0.58,1) forwards",
          }}
          onClick={() => {
            setShowChangePw(false);
            setPwDone(false);
            setPwFields({ current: "", next: "", confirm: "" });
          }}
        >
          <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            style={{
              animation: "slideUp 300ms cubic-bezier(0,0,0.58,1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {pwDone ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  Password updated successfully.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Change Password
                  </h3>
                  <button
                    onClick={() => {
                      setShowChangePw(false);
                      setPwFields({ current: "", next: "", confirm: "" });
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  {[
                    { label: "Current Password", key: "current" as const },
                    { label: "New Password", key: "next" as const },
                    { label: "Confirm New Password", key: "confirm" as const },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        {f.label}
                      </label>
                      <input
                        type="password"
                        value={pwFields[f.key]}
                        onChange={(e) =>
                          setPwFields((p) => ({
                            ...p,
                            [f.key]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Btn
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={() => {
                      setShowChangePw(false);
                      setPwFields({ current: "", next: "", confirm: "" });
                    }}
                  >
                    Cancel
                  </Btn>
                  <Btn
                    variant="primary"
                    className="flex-1 justify-center"
                    onClick={handleUpdatePw}
                  >
                    Update Password
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sign Out All Devices dialog */}
      {showSignOut && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          style={{
            animation: "fadeIn 300ms cubic-bezier(0,0,0.58,1) forwards",
          }}
          onClick={() => {
            setShowSignOut(false);
            setSignOutDone(false);
          }}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            style={{
              animation: "slideUp 300ms cubic-bezier(0,0,0.58,1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {signOutDone ? (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  Successfully signed out from all devices.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Sign Out All Devices
                  </h3>
                  <button
                    onClick={() => setShowSignOut(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Are you sure you want to sign out from all devices? You will
                  need to sign in again on each device.
                </p>
                <div className="flex gap-3">
                  <Btn
                    variant="outline"
                    className="flex-1 justify-center"
                    onClick={() => setShowSignOut(false)}
                  >
                    Cancel
                  </Btn>
                  <Btn
                    variant="outline"
                    className="flex-1 justify-center text-red-600 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackScreen({ nav }: { nav: (s: Screen) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleChip = (t: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => nav("my-events"), 2000);
  };

  if (submitted)
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0, 0, 0.58, 1] }}
          className="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Thank You!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Your feedback has been submitted successfully. Your opinion helps
            improve future campus events.
          </p>
          <p className="text-xs text-slate-400 mt-3">Returning to My Events…</p>
        </motion.div>
      </div>
    );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <BackBtn onClick={() => nav("my-events")} label="My Events" />
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex gap-4 mb-5">
          <img
            src={EVENTS[0].banner}
            alt="Event"
            className="w-20 h-16 rounded-xl object-cover bg-slate-100"
          />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {EVENTS[0].title}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Feb 28, 2024 · Main Auditorium
            </p>
            <span className="mt-1 inline-block">
              <Badge color="blue">Technology</Badge>
            </span>
          </div>
        </div>
        <h2 className="font-bold text-slate-900 dark:text-white mb-1">
          How was your experience?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          Your honest feedback helps us improve future events.
        </p>
        <div className="flex gap-2 justify-center mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={cn(
                  "w-10 h-10 transition-colors",
                  (hover || rating) >= s
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-200 dark:text-slate-700",
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300 mb-5">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]} (
            {rating}/5)
          </p>
        )}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              What did you enjoy most?
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "Content Quality",
                "Networking",
                "Speakers",
                "Organization",
                "Venue",
                "Timing",
              ].map((t) => {
                const active = selected.has(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleChip(t)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95",
                      active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600",
                    )}
                  >
                    {active && <span className="mr-1">✓</span>}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Additional Comments
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Share your thoughts about this event..."
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
            />
          </div>
          <div className="flex gap-3">
            <Btn
              variant="outline"
              className="flex-1 justify-center"
              onClick={() => nav("my-events")}
            >
              Skip
            </Btn>
            <Btn
              variant="primary"
              className="flex-1 justify-center"
              onClick={handleSubmit}
              disabled={rating === 0}
            >
              Submit Feedback <CheckCircle className="w-4 h-4" />
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZER SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

function OrganizerDashboard({ nav }: { nav: (s: Screen) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-extrabold">Organizer Hub</h2>
        <p className="text-emerald-100 text-sm mt-1">
          Design Club · Prof. Sarah Williams
        </p>
        <div className="mt-4 flex gap-3">
          <Btn
            size="sm"
            className="bg-white text-emerald-700 hover:bg-emerald-50"
            onClick={() => nav("create-event")}
          >
            <Plus className="w-4 h-4" />
            Create Event
          </Btn>
          <Btn
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30"
            onClick={() => nav("manage-events")}
          >
            Manage Events
          </Btn>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Active Events"
          value="3"
          trend="+1 this week"
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Total Registered"
          value="342"
          trend="+45 this week"
          color="green"
        />
        <StatCard
          icon={UserCheck}
          label="Avg Attendance"
          value="87.2%"
          color="purple"
        />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value="4.7"
          trend="+0.2 vs last"
          color="amber"
        />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            Registration Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart id="org-area-chart" data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="registrations"
                stroke="#2563EB"
                fill="#dbeafe"
                strokeWidth={2}
                name="Registrations"
              />
              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#10B981"
                fill="#d1fae5"
                strokeWidth={2}
                name="Attendance"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            My Active Events
          </h3>
          <div className="space-y-3">
            {EVENTS.slice(0, 3).map((ev) => {
              const rem = ev.seats - ev.registered;
              return (
                <div
                  key={ev.id}
                  onClick={() => nav("manage-events")}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {ev.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{ev.date}</p>
                  <div className="mt-2">
                    <ProgressBar value={ev.registered} max={ev.seats} />
                    <p className="text-xs text-slate-400 mt-1">
                      {rem} seats left · {ev.registered} registered
                    </p>
                  </div>
                </div>
              );
            })}
            <Btn
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={() => nav("manage-events")}
            >
              View All Events
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateEventScreen({ nav }: { nav: (s: Screen) => void }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("technology");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [location, setLocation] = useState("");
  const [seatLimit, setSeatLimit] = useState("200");
  const [price, setPrice] = useState("0");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [settings, setSettings] = useState([
    ["Enable QR Code Check-in", true],
    ["Send email confirmation", true],
    ["Send reminder 24h before event", true],
    ["Allow cancellation by attendees", false],
    ["Require department approval", false],
  ] as [string, boolean][]);
  const [fullAddress, setFullAddress] = useState("");
  const [publishing, setPublishing] = useState(false);
  const steps = [
    "Basic Info",
    "Date & Venue",
    "Capacity & Settings",
    "Preview",
  ];

  const publish = async () => {
    if (
      !title.trim() ||
      !startDate ||
      !endDate ||
      !location.trim() ||
      !fullAddress.trim()
    ) {
      window.alert(
        "Please complete the event title, dates, venue name, and full address.",
      );
      return;
    }
    const startsAt = new Date(`${startDate}T${startTime}`);
    const endsAt = new Date(`${endDate}T${endTime}`);
    if (endsAt <= startsAt) {
      window.alert("The event must end after it starts.");
      return;
    }
    setPublishing(true);
    try {
      await api.events.create({
        title: title.trim(),
        description: description.trim(),
        categorySlug: category,
        location: `${location.trim()}, ${fullAddress.trim()}`,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        seatLimit: Number(seatLimit),
        priceCents: Math.round(Number(price || 0) * 100),
        registrationDeadline: registrationDeadline
          ? new Date(`${registrationDeadline}T23:59`).toISOString()
          : null,
        status: "draft",
        coverImage: coverImage || null,
        qrCheckinEnabled: settings[0][1],
        sendConfirmation: settings[1][1],
        sendReminder: settings[2][1],
        allowCancellation: settings[3][1],
        requireApproval: settings[4][1],
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      nav("manage-events");
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not create event.",
      );
    } finally {
      setPublishing(false);
    }
  };

  const nextPhase = () => {
    if (step === 1 && !title.trim()) {
      window.alert("Please enter an event title before continuing.");
      return;
    }
    if (
      step === 2 &&
      (!startDate || !endDate || !location.trim() || !fullAddress.trim())
    ) {
      window.alert(
        "Please complete the start date, end date, venue name, and full address.",
      );
      return;
    }
    if (
      step === 3 &&
      (!Number.isInteger(Number(seatLimit)) ||
        Number(seatLimit) < 1 ||
        Number(price) < 0)
    ) {
      window.alert("Please enter a valid maximum seat count.");
      return;
    }
    setStep((current) => current + 1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <BackBtn onClick={() => nav("organizer-dashboard")} label="Dashboard" />
      {/* Stepper */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all flex-shrink-0",
                  i + 1 < step
                    ? "bg-emerald-500 text-white"
                    : i + 1 === step
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-400",
                )}
              >
                {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className="flex-1 px-2 hidden sm:block">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    i + 1 === step
                      ? "text-blue-600 dark:text-blue-400"
                      : i + 1 < step
                        ? "text-emerald-600"
                        : "text-slate-400",
                  )}
                >
                  {s}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    i + 1 < step
                      ? "bg-emerald-500"
                      : "bg-slate-100 dark:bg-slate-700",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Basic Information
          </h3>
          <InputField
            label="Event Title"
            placeholder="e.g. Annual Tech Summit 2024"
            value={title}
            onChange={setTitle}
          />
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your event, what attendees can expect, and any requirements..."
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[
                ["technology", "Technology"],
                ["business", "Business"],
                ["arts-culture", "Arts & Culture"],
                ["career", "Career"],
                ["health-sports", "Health & Sports"],
                ["academic", "Academic"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Event Banner
            </label>
            <label className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer block">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Event banner preview"
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              ) : (
                <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              )}
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Drag and drop or{" "}
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  browse files
                </span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PNG, JPG up to 5MB · Recommended: 1200×400px
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    window.alert("Please choose an image smaller than 5MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => setCoverImage(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Tags
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add tags separated by commas: AI, Workshop, Networking"
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Date, Time and Venue
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={setStartDate}
            />
            <InputField
              label="End Date"
              type="date"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Start Time"
              type="time"
              value={startTime}
              onChange={setStartTime}
            />
            <InputField
              label="End Time"
              type="time"
              value={endTime}
              onChange={setEndTime}
            />
          </div>
          <InputField
            label="Venue Name"
            icon={MapPin}
            placeholder="e.g. Main Auditorium, Block A"
            value={location}
            onChange={setLocation}
          />
          <InputField
            label="Full Address"
            placeholder="Building, Floor, Room Number"
            value={fullAddress}
            onChange={setFullAddress}
          />
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Co-Hosts (optional)
            </label>
            <div className="flex gap-2">
              <input
                placeholder="Search by name or student ID..."
                className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Btn variant="outline" size="sm">
                <Search className="w-4 h-4" />
                Search
              </Btn>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {["Prof. Maria Santos", "Dr. James Lee"].map((n) => (
                <div
                  key={n}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900"
                >
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    {n}
                  </span>
                  <button className="text-blue-400 hover:text-blue-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Capacity and Settings
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Maximum Seats"
              type="number"
              placeholder="e.g. 200"
              value={seatLimit}
              onChange={setSeatLimit}
            />
            <InputField
              label="Registration Deadline"
              type="date"
              value={registrationDeadline}
              onChange={setRegistrationDeadline}
            />
            <InputField
              label="Event Price (BDT, 0 = Free)"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 500"
              value={price}
              onChange={setPrice}
            />
          </div>
          <div className="space-y-3 pt-2">
            {settings.map(([label, on], i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {label as string}
                </span>
                <div
                  onClick={() =>
                    setSettings((current) =>
                      current.map((setting, index) =>
                        index === i ? [setting[0], !setting[1]] : setting,
                      ),
                    )
                  }
                  className={cn(
                    "w-10 h-5 rounded-full relative cursor-pointer",
                    on ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600",
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform",
                      on ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt="Preview"
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-indigo-600" />
          )}
          <div className="p-5 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {title || "Untitled Event"}
            </h3>
            <div className="flex gap-2 flex-wrap">
              <Badge color="blue">{category}</Badge>
              {tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .slice(0, 2)
                .map((tag) => (
                  <Badge key={tag} color="slate">
                    {tag}
                  </Badge>
                ))}
            </div>
            <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex gap-2 items-center">
                <Calendar className="w-4 h-4 text-blue-500" />
                {startDate || "Start date"} · {startTime} – {endTime}
              </div>
              <div className="flex gap-2 items-center">
                <MapPin className="w-4 h-4 text-blue-500" />
                {location || "Venue"}
              </div>
              <div className="flex gap-2 items-center">
                <Users className="w-4 h-4 text-blue-500" />
                0/{seatLimit || "0"} registered
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-xl border border-amber-100 dark:border-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-amber-700 dark:text-amber-400">
                Your request will be reviewed by an administrator before it is
                published and opened for registration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <Btn
            variant="outline"
            className="flex-1 justify-center"
            onClick={() => setStep(step - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Btn>
        )}
        {step < 4 ? (
          <Btn
            variant="primary"
            className="flex-1 justify-center"
            onClick={nextPhase}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Btn>
        ) : (
          <Btn
            variant="success"
            className="flex-1 justify-center"
            onClick={() => void publish()}
            disabled={publishing}
          >
            <CheckCircle className="w-4 h-4" />
            {publishing ? "Submitting…" : "Submit for Review"}
          </Btn>
        )}
      </div>
    </div>
  );
}

function ManageEventsScreen({
  nav,
}: {
  nav: (s: Screen, params?: { eventId?: string; slug?: string }) => void;
}) {
  const [tab, setTab] = useState("active");
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadEvents = () => {
    api.events
      .list({ mine: true })
      .then(({ events: rows }) =>
        setEvents(
          rows.filter((event) => {
            if (tab === "draft") return event.approvalStatus !== "accepted";
            if (tab === "past")
              return (
                new Date(event.startsAt) < new Date() ||
                event.status === "cancelled"
              );
            return (
              new Date(event.startsAt) >= new Date() &&
              event.status === "published" &&
              event.approvalStatus === "accepted"
            );
          }),
        ),
      )
      .catch(() => setEvents([]));
  };

  useEffect(loadEvents, [tab]);

  const resubmit = async (id: string) => {
    setBusyId(id);
    try {
      await api.events.resubmit(id);
      window.alert("Event request resubmitted for review.");
      loadEvents();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Could not resubmit event.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const eventRows = events.map((event) => ({
    id: event.id,
    title: event.title,
    category: event.category?.name ?? "Event",
    date: new Date(event.startsAt).toLocaleDateString(),
    location: event.location,
    seats: event.seatLimit,
    registered: event.registeredCount,
    banner: event.coverImage ?? "",
    approvalStatus: event.approvalStatus ?? "accepted",
    rejectionReason: event.rejectionReason,
  }));

  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("organizer-dashboard")} label="Dashboard" />
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {["active", "draft", "past"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all",
                tab === t
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => nav("create-event")}>
          <Plus className="w-4 h-4" />
          Create Event
        </Btn>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {[
                  "Event",
                  "Date",
                  "Venue",
                  "Registered",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {eventRows.map((ev) => {
                const pct = Math.round((ev.registered / ev.seats) * 100);
                return (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={ev.banner}
                          alt=""
                          className="w-10 h-8 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {ev.title}
                          </p>
                          <Badge
                            color={
                              {
                                Technology: "blue",
                                Sports: "green",
                                Arts: "purple",
                                Career: "amber",
                                Science: "red",
                                Social: "pink",
                              }[ev.category] || "blue"
                            }
                          >
                            {ev.category}
                          </Badge>
                          <Badge
                            color={
                              ev.approvalStatus === "accepted"
                                ? "green"
                                : ev.approvalStatus === "rejected"
                                  ? "red"
                                  : "amber"
                            }
                          >
                            {ev.approvalStatus}
                          </Badge>
                          {ev.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">
                              {ev.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {ev.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {ev.location.split(",")[0]}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {ev.registered}
                        <span className="text-slate-400">/{ev.seats}</span>
                      </p>
                      <div className="w-20 mt-1">
                        <ProgressBar value={ev.registered} max={ev.seats} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        color={
                          ev.approvalStatus === "accepted"
                            ? "green"
                            : ev.approvalStatus === "rejected"
                              ? "red"
                              : "amber"
                        }
                      >
                        {ev.approvalStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            ev.approvalStatus === "rejected" &&
                            void resubmit(ev.id)
                          }
                          disabled={
                            busyId === ev.id || ev.approvalStatus !== "rejected"
                          }
                          className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950 text-slate-400 hover:text-amber-600 transition-colors disabled:opacity-40"
                          title="Resubmit rejected request"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            nav("participants", { eventId: ev.id })
                          }
                          className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-400 hover:text-emerald-600 transition-colors"
                          title="View Registered Participants"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ParticipantsScreen({ nav }: { nav: (s: Screen) => void }) {
  const [search, setSearch] = useState("");
  const [participants, setParticipants] = useState<
    {
      id: string;
      name: string;
      email: string;
      dept: string;
      registered: string;
      attended: boolean;
      qr: boolean;
    }[]
  >([]);

  useEffect(() => {
    api.users
      .list()
      .then(({ users }) => {
        setParticipants(
          users.map((user: Person) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            dept: user.department ?? "—",
            registered: "—",
            attended: false,
            qr: false,
          })),
        );
      })
      .catch(() => setParticipants([]));
  }, []);

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.includes(search),
  );
  const attended = participants.filter((p) => p.attended).length;
  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("manage-events")} label="Manage Events" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Registered"
          value={String(participants.length)}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Attended"
          value={String(attended)}
          color="green"
        />
        <StatCard
          icon={XCircle}
          label="Absent"
          value={String(participants.length - attended)}
          color="purple"
        />
        <StatCard
          icon={QrCode}
          label="QR Scanned"
          value={String(participants.filter((p) => p.qr && p.attended).length)}
          color="amber"
        />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              className="pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-500 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-500 font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-blue-400 transition-all shadow-inner w-80"
            />
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm">
              <Download className="w-4 h-4" />
              Export CSV
            </Btn>
            <Btn variant="outline" size="sm">
              <FileText className="w-4 h-4" />
              Export PDF
            </Btn>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {[
                  "Student ID",
                  "Name",
                  "Department",
                  "Registered",
                  "Attendance",
                  "QR Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-3 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                    {p.id}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">
                        {p.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {p.dept}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {p.registered}
                  </td>
                  <td className="px-3 py-3">
                    <Badge color={p.attended ? "green" : "red"} dot>
                      {p.attended ? "Attended" : "Absent"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge color={p.qr ? "blue" : "slate"} dot>
                      {p.qr ? "Scanned" : "Not Scanned"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SCREENS
// ═══════════════════════════════════════════════════════════════════════════════

function AdminDashboard({
  nav,
}: {
  nav: (s: Screen, params?: { eventId?: string; slug?: string }) => void;
}) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<EventDTO[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([api.stats(), api.events.list({ when: "upcoming" })])
      .then(([statsResponse, eventsResponse]) => {
        if (!alive) return;
        if (statsResponse.role === "admin") setStats(statsResponse.stats);
        setEvents(eventsResponse.events);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const monthlyData =
    stats?.monthlyTrend.map((entry) => ({
      month: entry.month,
      registrations: entry.registrations,
      attendance: entry.checkIns,
    })) ?? MONTHLY_DATA;
  const categoryTotal =
    stats?.categoryBreakdown.reduce((sum, entry) => sum + entry.value, 0) ?? 0;
  const categoryData =
    stats?.categoryBreakdown.map((entry) => ({
      name: entry.name,
      value: categoryTotal
        ? Math.round((entry.value / categoryTotal) * 100)
        : 0,
      color: entry.color,
    })) ?? CAT_PIE;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">Admin Console</h2>
            <p className="text-slate-300 text-sm mt-1">
              System Overview · Feb 27, 2024
            </p>
          </div>
          <div className="flex gap-2">
            <Btn
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20"
              onClick={() => nav("qr-scanner")}
            >
              <Scan className="w-4 h-4" />
              QR Scanner
            </Btn>
            <Btn
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => nav("attendance-report")}
            >
              <BarChart2 className="w-4 h-4" />
              Reports
            </Btn>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={stats ? String(stats.totalEvents) : "—"}
          trend="+18 this month"
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats ? String(stats.totalUsers) : "—"}
          trend="+234 this semester"
          color="green"
        />
        <StatCard
          icon={UserCheck}
          label="Avg Attendance"
          value={stats ? `${stats.attendanceRate}%` : "—"}
          trend="+2.1% vs last sem"
          color="purple"
        />
        <StatCard
          icon={Activity}
          label="Active Today"
          value={stats ? String(stats.upcomingEvents) : "—"}
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            Monthly Registrations vs Attendance
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart id="admin-bar-chart" data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="registrations"
                fill="#2563EB"
                radius={[4, 4, 0, 0]}
                name="Registrations"
              />
              <Bar
                dataKey="attendance"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                name="Attendance"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            Events by Category
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart id="admin-pie-chart">
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={2}
              >
                {categoryData.map((entry) => (
                  <Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryData.slice(0, 4).map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-400">
                    {c.name}
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {c.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {(stats?.recentActivity ?? []).map((entry, i) => {
              const a = {
                action: "Recent activity",
                detail: `${entry.user} → ${entry.event}`,
                time: new Date(entry.at).toLocaleString(),
                icon: CheckCircle,
                color: "text-emerald-600",
                bg: "bg-emerald-50 dark:bg-emerald-950",
              };
              return (
                <div key={i} className="flex gap-3 items-start">
                  <div className={cn("p-2 rounded-xl flex-shrink-0", a.bg)}>
                    <a.icon className={cn("w-4 h-4", a.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {a.action}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {a.detail}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {a.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            Top Events This Month
          </h3>
          <div className="space-y-3">
            {events.slice(0, 5).map((ev, i) => (
              <div
                key={ev.id}
                onClick={() => nav("participants", { eventId: ev.id })}
                className="flex items-center gap-3 p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group"
                title="Click to view registered participants"
              >
                <span className="text-sm font-bold text-slate-400 w-5">
                  {i + 1}
                </span>
                <img
                  src={ev.coverImage ?? ""}
                  alt=""
                  className="w-10 h-8 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {ev.title}
                  </p>
                  <ProgressBar
                    value={ev.registeredCount}
                    max={ev.seatLimit}
                    className="mt-1"
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                  {Math.round(
                    (ev.registeredCount / Math.max(1, ev.seatLimit)) * 100,
                  )}
                  %
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QRScannerScreen({ nav }: { nav: (s: Screen) => void }) {
  const [scanState, setScanState] = useState<
    "idle" | "scanning" | "success" | "error" | "duplicate"
  >("idle");
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [scanResult, setScanResult] = useState<CheckinResponse | null>(null);
  const [recentScans, setRecentScans] = useState<Participant[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;

  const loadRecentScans = async (eventId: string) => {
    try {
      const { participants } = await api.events.participants(eventId);
      setRecentScans(
        participants
          .filter((participant) => participant.checkedIn)
          .sort(
            (a, b) =>
              new Date(b.checkedInAt ?? b.createdAt).getTime() -
              new Date(a.checkedInAt ?? a.createdAt).getTime(),
          )
          .slice(0, 8),
      );
    } catch {
      setRecentScans([]);
    }
  };

  useEffect(() => {
    api.events
      .list()
      .then(({ events: rows }) => {
        setEvents(rows);
        setSelectedEventId(rows[0]?.id ?? "");
      })
      .catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    if (selectedEventId) void loadRecentScans(selectedEventId);
    else setRecentScans([]);
  }, [selectedEventId]);

  const selectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setScanState("idle");
    setScanResult(null);
  };

  const startScan = async () => {
    if (!selectedEvent) return;
    const code = window.prompt("Scan or enter the ticket code");
    if (!code?.trim()) return;
    setScanState("scanning");
    try {
      const result = await api.checkin(code.trim(), selectedEvent.id);
      setScanResult(result);
      if (result.result === "success") {
        setScanState("success");
        if (result.counts) {
          setEvents((current) =>
            current.map((event) =>
              event.id === selectedEvent.id
                ? {
                    ...event,
                    checkedInCount: result.counts!.checkedIn,
                    registeredCount: result.counts!.registered,
                    remaining: Math.max(
                      0,
                      event.seatLimit - result.counts!.registered,
                    ),
                  }
                : event,
            ),
          );
        }
        await loadRecentScans(selectedEvent.id);
      } else if (result.result === "already_checked_in")
        setScanState("duplicate");
      else setScanState("error");
    } catch {
      setScanResult({
        result: "invalid",
        message: "Could not process this ticket",
      });
      setScanState("error");
    }
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setScanState("idle");
    setScanResult(null);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <BackBtn
        onClick={() => nav("admin-operations")}
        label="Admin Operations"
      />
      {/* Live counter */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-blue-600">
            {selectedEvent?.checkedInCount ?? 0}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Checked In
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {selectedEvent?.seatLimit ?? 0}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total Seats
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-600">
            {selectedEvent?.seatLimit
              ? Math.round(
                  ((selectedEvent.checkedInCount ?? 0) /
                    selectedEvent.seatLimit) *
                    100,
                )
              : 0}
            %
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Check-in Rate
          </p>
        </div>
      </div>

      {/* Event info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
        {selectedEvent?.coverImage ? (
          <img
            src={selectedEvent.coverImage}
            alt=""
            className="w-14 h-12 rounded-xl object-cover"
          />
        ) : (
          <div className="w-14 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600" />
        )}
        <div>
          <select
            value={selectedEventId}
            onChange={(e) => selectEvent(e.target.value)}
            className="max-w-full bg-transparent font-bold text-slate-900 dark:text-white text-sm outline-none"
          >
            {events.length === 0 ? (
              <option
                value=""
                className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
              >
                No published events
              </option>
            ) : (
              events.map((event) => (
                <option
                  key={event.id}
                  value={event.id}
                  className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
                >
                  {event.title}
                </option>
              ))
            )}
          </select>
          <p className="text-xs text-slate-500">
            {selectedEvent
              ? `${new Date(selectedEvent.startsAt).toLocaleDateString()} · ${selectedEvent.location} · Gate A`
              : "Choose an event to start scanning"}
          </p>
        </div>
      </div>

      {/* Camera frame */}
      <div
        className={cn(
          "bg-slate-900 rounded-3xl overflow-hidden border-4 transition-all duration-500",
          scanState === "success"
            ? "border-emerald-500"
            : scanState === "error" || scanState === "duplicate"
              ? "border-red-500"
              : "border-slate-700",
        )}
      >
        <div className="relative aspect-square flex items-center justify-center">
          {/* Corner marks */}
          {[
            "top-4 left-4 border-t-4 border-l-4",
            "top-4 right-4 border-t-4 border-r-4",
            "bottom-4 left-4 border-b-4 border-l-4",
            "bottom-4 right-4 border-b-4 border-r-4",
          ].map((c, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-8 h-8 rounded-sm transition-colors",
                c,
                scanState === "success"
                  ? "border-emerald-400"
                  : scanState === "error" || scanState === "duplicate"
                    ? "border-red-400"
                    : "border-blue-400",
              )}
            />
          ))}

          {scanState === "idle" && (
            <div className="text-center">
              <Camera className="w-16 h-16 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Position QR code within the frame
              </p>
            </div>
          )}

          {scanState === "scanning" && (
            <div className="text-center w-full">
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-blue-500 shadow-lg shadow-blue-500"
                animate={{ top: ["20%", "80%", "20%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <Camera className="w-16 h-16 text-blue-400 mx-auto mb-3" />
              <p className="text-blue-300 text-sm font-medium">Scanning...</p>
            </div>
          )}

          {scanState === "success" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center p-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4 }}
              >
                <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
              </motion.div>
              <p className="text-emerald-300 font-extrabold text-xl mb-1">
                Check-In Successful!
              </p>
              <div className="bg-emerald-900/50 rounded-xl p-3 mt-3 text-left">
                <p className="text-white font-bold">
                  {scanResult?.attendee?.name ?? "Attendee"}
                </p>
                <p className="text-emerald-300 text-sm">
                  {scanResult?.attendee?.studentId ??
                    scanResult?.attendee?.email ??
                    "Ticket verified"}{" "}
                  · {scanResult?.attendee?.department ?? ""}
                </p>
                <p className="text-emerald-300 text-xs mt-1">
                  {scanResult?.message}
                </p>
              </div>
            </motion.div>
          )}

          {scanState === "duplicate" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-6"
            >
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-3" />
              <p className="text-amber-300 font-extrabold text-lg">
                Already Checked In!
              </p>
              <div className="bg-amber-900/50 rounded-xl p-3 mt-3">
                <p className="text-white font-bold text-sm">
                  {scanResult?.attendee?.name ?? "Attendee"}
                </p>
                <p className="text-amber-300 text-xs">{scanResult?.message}</p>
              </div>
            </motion.div>
          )}

          {scanState === "error" && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.3 }}
              className="text-center p-6"
            >
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
              <p className="text-red-300 font-extrabold text-lg">
                Invalid QR Code
              </p>
              <p className="text-red-400 text-sm mt-1">
                {scanResult?.message ??
                  "This QR code is not registered for this event"}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {scanState === "idle" && (
          <Btn
            variant="primary"
            className="w-full justify-center py-4 text-base"
            onClick={startScan}
          >
            <Scan className="w-5 h-5" />
            Start Scanning
          </Btn>
        )}
        {scanState === "scanning" && (
          <Btn
            variant="secondary"
            className="w-full justify-center py-4"
            onClick={reset}
          >
            <X className="w-4 h-4" />
            Cancel
          </Btn>
        )}
        {(scanState === "success" ||
          scanState === "duplicate" ||
          scanState === "error") && (
          <div className="flex gap-3">
            <Btn
              variant="primary"
              className="flex-1 justify-center py-3"
              onClick={reset}
            >
              <Scan className="w-4 h-4" />
              Scan Next
            </Btn>
            {scanState === "success" && (
              <Btn
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => nav("feedback")}
              >
                <Star className="w-4 h-4" />
                Event Over? Get Feedback
              </Btn>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">
          Recent Scans
        </h3>
        <div className="space-y-2">
          {recentScans.map((scan) => (
            <div key={scan.id} className="flex items-center gap-3 py-1.5">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                  "bg-emerald-100 dark:bg-emerald-950",
                )}
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {scan.user.name}
                </p>
                <p className="text-xs text-slate-400">
                  {scan.ticketCode ?? scan.user.email}
                </p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {new Date(
                  scan.checkedInAt ?? scan.createdAt,
                ).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AttendanceReportScreen({
  nav,
  params,
}: {
  nav: (s: Screen, params?: { eventId?: string; slug?: string }) => void;
  params?: { eventId?: string; slug?: string };
}) {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    params?.eventId ?? "",
  );
  const [event, setEvent] = useState<EventDTO | null>(null);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async (eventId: string) => {
    setLoading(true);
    try {
      const response = await api.events.report(eventId);
      setEvent(response.event);
      setReport(response.report);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.events
      .list()
      .then(async ({ events: allEvents }) => {
        setEvents(allEvents);
        const targetId = params?.eventId || allEvents[0]?.id;
        if (targetId) {
          setSelectedEventId(targetId);
          await fetchReport(targetId);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [params?.eventId, fetchReport]);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    void fetchReport(id);
  };

  const chartData = report
    ? [
        { name: "Registered", value: report.registeredCount },
        { name: "Checked In", value: report.attendedCount },
        { name: "No Shows", value: report.noShowCount },
      ]
    : [];
  const checkIns = report
    ? report.attendees
        .filter((attendee) => attendee.checkedIn && attendee.checkedInAt)
        .sort(
          (a, b) =>
            new Date(a.checkedInAt ?? 0).getTime() -
            new Date(b.checkedInAt ?? 0).getTime(),
        )
    : [];
  const timelineData = checkIns.map((attendee, index) => ({
    time: new Date(attendee.checkedInAt!).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
    cumulative: index + 1,
  }));
  const departmentColors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-red-500",
  ];
  const departments = report
    ? Object.entries(
        report.attendees.reduce<
          Record<string, { registered: number; attended: number }>
        >((groups, attendee) => {
          const department = attendee.user.department ?? "Unknown";
          const group = groups[department] ?? { registered: 0, attended: 0 };
          group.registered += 1;
          if (attendee.checkedIn) group.attended += 1;
          groups[department] = group;
          return groups;
        }, {}),
      ).map(([dept, values], index) => ({
        dept,
        ...values,
        color: departmentColors[index % departmentColors.length],
      }))
    : [];
  const exportCsv = () => {
    if (!report || !event) return;
    const csv = [
      "Student ID,Name,Department,Check-in Time,Method,Status",
      ...report.attendees.map((attendee) =>
        [
          attendee.user.studentId ?? attendee.user.id,
          attendee.user.name,
          attendee.user.department ?? "",
          attendee.checkedInAt
            ? new Date(attendee.checkedInAt).toISOString()
            : "",
          attendee.checkedIn ? "QR Code" : "",
          attendee.checkedIn ? "Attended" : "Absent",
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.slug}-attendance.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <BackBtn
        onClick={() => nav("admin-operations")}
        label="Admin Operations"
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Attendance Report
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {event
              ? `${event.title} · ${new Date(event.startsAt).toLocaleDateString()}`
              : loading
                ? "Loading report…"
                : "Select an event to view its report"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {events.length > 0 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-blue-500 ml-2" />
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                Event:
              </span>
              <select
                value={selectedEventId}
                onChange={(e) => handleSelectEvent(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none pr-3 py-1 cursor-pointer max-w-xs truncate"
              >
                {events.map((ev) => (
                  <option
                    key={ev.id}
                    value={ev.id}
                    className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                  >
                    {ev.title} ({ev.registeredCount} reg)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4" />
              Export CSV
            </Btn>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Registered"
          value={report ? String(report.registeredCount) : "—"}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Total Attended"
          value={report ? String(report.attendedCount) : "—"}
          color="green"
        />
        <StatCard
          icon={Activity}
          label="Attendance Rate"
          value={report ? `${report.attendanceRate}%` : "—"}
          color="purple"
        />
        <StatCard
          icon={XCircle}
          label="No Shows"
          value={report ? String(report.noShowCount) : "—"}
          color="amber"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            Registered vs Attended
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart id="report-bar-chart" data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" minPointSize={8} radius={[6, 6, 0, 0]}>
                {[
                  { fill: "#2563EB" },
                  { fill: "#10B981" },
                  { fill: "#EF4444" },
                ].map((c, i) => (
                  <Cell key={`cell-${i}`} fill={c.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            Check-in Timeline
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart id="report-area-chart" data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#10B981"
                fill="#d1fae5"
                strokeWidth={2}
                name="Cumulative Check-ins"
                dot={{
                  r: 6,
                  fill: "#10B981",
                  stroke: "#064E3B",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 8 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">
          Attendance by Department
        </h3>
        <div className="space-y-3">
          {departments.map((d) => (
            <div key={d.dept} className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400 w-40 truncate">
                {d.dept}
              </span>
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                <motion.div
                  className={cn("h-2 rounded-full", d.color)}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(3, Math.round((d.attended / d.registered) * 100))}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-20 text-right">
                {d.attended}/{d.registered} ·{" "}
                {Math.round((d.attended / d.registered) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Attendance Log
          </h3>
          <Btn variant="outline" size="xs" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5" />
            CSV
          </Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {[
                  "Student ID",
                  "Name",
                  "Department",
                  "Check-in Time",
                  "Method",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {(report?.attendees ?? []).map((attendee) => (
                <tr
                  key={attendee.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-3 py-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                    {attendee.user.studentId ?? attendee.user.id}
                  </td>
                  <td className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                    {attendee.user.name}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                    {attendee.user.department ?? "Unknown"}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                    {attendee.checkedInAt
                      ? new Date(attendee.checkedInAt).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400">
                    {attendee.checkedIn ? "QR Code" : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <Badge color={attendee.checkedIn ? "green" : "red"} dot>
                      {attendee.checkedIn ? "Attended" : "Absent"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

function useLiveRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.registrations
      .mine()
      .then(({ registrations: rows }) => setRegistrations(rows))
      .finally(() => setLoading(false));
  }, []);
  return { registrations, loading };
}

function LiveStudentDashboard({
  nav,
}: {
  nav: (s: Screen, params?: { eventId?: string }) => void;
}) {
  const { registrations, loading } = useLiveRegistrations();
  const active = registrations.filter(
    (registration) => registration.status === "registered",
  );
  const upcoming = active.filter(
    (registration) =>
      registration.event && new Date(registration.event.startsAt) >= new Date(),
  );
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-sm font-medium">
          Your registered events
        </p>
        <h2 className="text-2xl font-extrabold mt-0.5">My Event Dashboard</h2>
        <p className="text-blue-100 text-sm mt-1">
          Live data from your database registrations
        </p>
        <div className="mt-4 flex gap-3">
          <Btn variant="success" size="sm" onClick={() => nav("event-listing")}>
            Browse Events <ArrowRight className="w-4 h-4" />
          </Btn>
          <Btn
            size="sm"
            onClick={() => nav("my-events")}
            className="bg-white/20 text-white hover:bg-white/30 border-0"
          >
            My Events
          </Btn>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Ticket}
          label="Registered Events"
          value={String(active.length)}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Events Attended"
          value={String(
            active.filter((registration) => registration.checkedIn).length,
          )}
          color="green"
        />
        <StatCard
          icon={Calendar}
          label="Upcoming Events"
          value={String(upcoming.length)}
          color="amber"
        />
        <StatCard
          icon={Award}
          label="Attendance Rate"
          value={`${active.length ? Math.round((active.filter((registration) => registration.checkedIn).length / active.length) * 100) : 0}%`}
          color="purple"
        />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">
            Upcoming Registrations
          </h3>
          <Btn variant="ghost" size="xs" onClick={() => nav("my-events")}>
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Btn>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading registrations…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">
            No upcoming registered events.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((registration) => {
              const event = registration.event!;
              return (
                <div
                  key={registration.id}
                  onClick={() => nav("event-details", { eventId: event.id })}
                  className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.startsAt).toLocaleString()} ·{" "}
                      {event.location}
                    </p>
                  </div>
                  <Badge color="green" dot>
                    Registered
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveMyEventsScreen({
  nav,
}: {
  nav: (s: Screen, params?: { eventId?: string }) => void;
}) {
  const { registrations, loading } = useLiveRegistrations();
  const active = registrations.filter(
    (registration) => registration.status === "registered",
  );
  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("student-dashboard")} label="Dashboard" />
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-4">
          My Registered Events ({active.length})
        </h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading registrations…</p>
        ) : active.length === 0 ? (
          <p className="text-sm text-slate-500">
            You have no registered events.
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((registration) => {
              const event = registration.event!;
              return (
                <div
                  key={registration.id}
                  onClick={() => nav("event-details", { eventId: event.id })}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge color="blue">
                        {event.category?.name ?? "Event"}
                      </Badge>
                      <h3 className="font-bold text-slate-900 dark:text-white mt-1">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(event.startsAt).toLocaleString()} ·{" "}
                        {event.location}
                      </p>
                    </div>
                    <Badge
                      color={registration.checkedIn ? "green" : "amber"}
                      dot
                    >
                      {registration.checkedIn ? "Attended" : "Registered"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Ticket: {registration.ticketCode}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveCalendarScreen({
  nav,
}: {
  nav: (s: Screen, params?: { eventId?: string }) => void;
}) {
  const { registrations, loading } = useLiveRegistrations();
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">(
    "month",
  );
  const [month, setMonth] = useState(() => new Date());
  const active = registrations.filter(
    (registration) =>
      registration.status === "registered" && registration.event,
  );
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstDay + daysInMonth) / 7) * 7 },
    (_, index) => {
      const day = index - firstDay + 1;
      return day >= 1 && day <= daysInMonth ? day : null;
    },
  );
  const eventsForDay = (day: number) =>
    active.filter((registration) => {
      const date = new Date(registration.event!.startsAt);
      return (
        date.getFullYear() === year &&
        date.getMonth() === monthIndex &&
        date.getDate() === day
      );
    });
  const colors = [
    "bg-blue-600",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-pink-500",
  ];
  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("student-dashboard")} label="Dashboard" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white min-w-48 text-center">
            {month.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <button
            onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(["month", "week", "agenda"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold capitalize",
                viewMode === mode
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading calendar…</p>
      ) : viewMode === "agenda" || viewMode === "week" ? (
        <div className="space-y-3">
          {active.map((registration, index) => {
            const event = registration.event!;
            return (
              <div
                key={registration.id}
                onClick={() => nav("event-details", { eventId: event.id })}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex gap-4 cursor-pointer"
              >
                <div
                  className={cn(
                    "w-1 rounded-full",
                    colors[index % colors.length],
                  )}
                />
                <div>
                  <p className="text-xs text-blue-600">
                    {new Date(event.startsAt).toLocaleDateString()}
                  </p>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {event.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {new Date(event.startsAt).toLocaleTimeString()} ·{" "}
                    {event.location}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-700">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center py-3 text-xs font-bold text-slate-500 dark:text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, index) => {
              const dayEvents = day ? eventsForDay(day) : [];
              const today =
                day === new Date().getDate() &&
                monthIndex === new Date().getMonth() &&
                year === new Date().getFullYear();
              return (
                <div
                  key={index}
                  className="min-h-[92px] p-2 border-b border-r border-slate-100 dark:border-slate-700/60"
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-1",
                      today
                        ? "bg-blue-600 text-white"
                        : day
                          ? "text-slate-700 dark:text-slate-300"
                          : "text-transparent",
                    )}
                  >
                    {day ?? "0"}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((registration, eventIndex) => (
                      <button
                        key={registration.id}
                        onClick={() =>
                          nav("event-details", {
                            eventId: registration.event!.id,
                          })
                        }
                        className={cn(
                          "w-full text-left text-xs px-1.5 py-1 rounded-md text-white font-medium truncate",
                          colors[eventIndex % colors.length],
                        )}
                      >
                        {registration.event!.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveNotificationsScreen({ nav }: { nav: (s: Screen) => void }) {
  const { registrations, loading } = useLiveRegistrations();
  const active = registrations.filter(
    (registration) =>
      registration.status === "registered" && registration.event,
  );
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <BackBtn onClick={() => nav("student-dashboard")} label="Dashboard" />
      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
        Notifications
      </h2>
      {loading ? (
        <p className="text-sm text-slate-500">Loading notifications…</p>
      ) : (
        active.map((registration) => (
          <div
            key={registration.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-100 dark:border-blue-900 p-4"
          >
            <p className="font-bold text-slate-900 dark:text-white">
              Registration confirmed
            </p>
            <p className="text-sm text-slate-500 mt-1">
              You are registered for {registration.event!.title}.
            </p>
            <button
              onClick={() =>
                nav("event-details", { eventId: registration.event!.id })
              }
              className="text-xs text-blue-600 font-semibold mt-2"
            >
              View event
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const AUTH_SCREENS: Screen[] = [
  "landing",
  "login",
  "signup",
  "forgot-password",
  "verify-email",
];

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    try {
      return (
        (JSON.parse(sessionStorage.getItem("unievents-navigation") || "null")
          ?.screen as Screen) || "landing"
      );
    } catch {
      return "landing";
    }
  });
  const [params, setParams] = useState<{ eventId?: string; slug?: string }>(
    () => {
      try {
        return (
          JSON.parse(sessionStorage.getItem("unievents-navigation") || "null")
            ?.params || {}
        );
      } catch {
        return {};
      }
    },
  );
  const [role, setRole] = useState<Role>("student");
  const [isDark, setIsDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const nav = useCallback(
    (s: Screen, nextParams: { eventId?: string; slug?: string } = {}) => {
      setScreen(s);
      setParams(nextParams);
      if (s === "landing" || AUTH_SCREENS.includes(s)) {
        sessionStorage.removeItem("unievents-navigation");
      } else {
        sessionStorage.setItem(
          "unievents-navigation",
          JSON.stringify({ screen: s, params: nextParams }),
        );
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [],
  );

  const login = useCallback(
    (r: Role, email = "", password = "") => {
      api.auth
        .login(email.trim(), password === "••••••••" ? "password123" : password)
        .then(({ user }) => {
          setIsLoggedIn(true);
          setRole(user.role);
          nav(
            user.role === "student"
              ? "student-dashboard"
              : user.role === "organizer"
                ? "organizer-dashboard"
                : "admin-operations",
          );
        })
        .catch(() => undefined);
    },
    [nav],
  );

  const logout = useCallback(() => {
    void api.auth.logout();
    setIsLoggedIn(false);
    setRegistered(false);
    sessionStorage.removeItem("unievents-navigation");
    nav("landing");
  }, [nav]);

  useEffect(() => {
    api.auth
      .me()
      .then(({ user }) => {
        if (user) {
          setRole(user.role);
          setIsLoggedIn(true);
        } else if (!AUTH_SCREENS.includes(screen)) {
          setScreen("landing");
          setParams({});
          sessionStorage.removeItem("unievents-navigation");
        }
      })
      .catch(() => {
        setScreen("landing");
        setParams({});
        sessionStorage.removeItem("unievents-navigation");
      })
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDark]);

  // event-details is accessible to guests (read-only) but not wrapped in AppLayout
  const isPublic =
    AUTH_SCREENS.includes(screen) ||
    (!isLoggedIn && screen === "event-details");

  if (!authReady) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;
  }

  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return (
          <Landing
            nav={nav}
            params={{}}
            isDark={isDark}
            setIsDark={setIsDark}
          />
        );
      case "login":
        return <LoginScreen nav={nav} onLogin={login} />;
      case "signup":
        return <SignupScreen nav={nav} onLogin={login} />;
      case "forgot-password":
        return <ForgotPasswordScreen nav={nav} />;
      case "verify-email":
        return <VerifyEmailScreen nav={nav} onLogin={login} />;
      case "student-dashboard":
        return <LiveStudentDashboard nav={nav} />;
      case "event-listing":
        return <EventListingScreen nav={nav} />;
      case "event-details":
        return (
          <DatabaseEventDetails
            nav={nav}
            params={params}
            isDark={isDark}
            setIsDark={setIsDark}
          />
        );
      case "registration-success":
        return <ParticipantQrPass nav={nav} />;
      case "my-events":
        return <LiveMyEventsScreen nav={nav} />;
      case "event-calendar":
        return <LiveCalendarScreen nav={nav} />;
      case "notifications":
        return <ParticipantNotifications nav={nav} />;
      case "profile":
        return (
          <ProfileScreen
            nav={nav}
            isDark={isDark}
            setIsDark={setIsDark}
            role={role}
          />
        );
      case "feedback":
        return <ParticipantFeedback nav={nav} />;
      case "organizer-dashboard":
        return <OrganizerDashboard nav={nav} />;
      case "organizer-qr":
        return (
          <OrganizerQrAttendance
            nav={nav}
            params={params}
            isDark={isDark}
            setIsDark={setIsDark}
          />
        );
      case "create-event":
        return <CreateEventScreen nav={nav} />;
      case "manage-events":
        return <ManageEventsScreen nav={nav} />;
      case "participants":
        return (
          <DatabaseParticipants
            nav={nav}
            params={params}
            isDark={isDark}
            setIsDark={setIsDark}
          />
        );
      case "admin-dashboard":
        return <AdminDashboard nav={nav} />;
      case "admin-operations":
        return (
          <AdminOperations
            nav={nav}
            params={params}
            isDark={isDark}
            setIsDark={setIsDark}
          />
        );
      case "issues":
        return (
          <Issues
            nav={nav}
            params={params}
            isDark={isDark}
            setIsDark={setIsDark}
          />
        );
      case "qr-scanner":
        return <QRScannerScreen nav={nav} />;
      case "attendance-report":
        return <AttendanceReportScreen nav={nav} params={params} />;
      default:
        return <StudentDashboard nav={nav} />;
    }
  };

  if (isPublic) {
    // Wrap guest event-details in a public navbar shell
    if (!isLoggedIn && screen === "event-details") {
      return (
        <div className={isDark ? "dark" : ""}>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <nav className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800">
              <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <button
                  onClick={() => nav("landing")}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-lg">
                    UniEvents
                  </span>
                </button>
                <div className="flex items-center gap-3">
                  <Btn
                    variant="outline"
                    className="border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-950 px-5"
                    size="sm"
                    onClick={() => nav("login")}
                  >
                    Sign In
                  </Btn>
                  <Btn
                    variant="primary"
                    size="sm"
                    onClick={() => nav("signup")}
                  >
                    Get Started
                  </Btn>
                </div>
              </div>
            </nav>
            <div className="max-w-7xl mx-auto px-6 py-6">{renderScreen()}</div>
          </div>
        </div>
      );
    }
    return <div className={isDark ? "dark" : ""}>{renderScreen()}</div>;
  }

  return (
    <AppLayout
      nav={nav}
      isDark={isDark}
      setIsDark={setIsDark}
      role={role}
      setRole={setRole}
      screen={screen}
      collapsed={collapsed}
      setCollapsed={setCollapsed}
    >
      {renderScreen()}
    </AppLayout>
  );
}
