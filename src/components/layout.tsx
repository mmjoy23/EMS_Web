import React, { useEffect, useRef, useState } from "react";
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
  QrCode,
  Star,
  BarChart2,
  Plus,
  Mail,
  Moon,
  Sun,
  Scan,
  FileText,
  Ticket,
  Users,
  CheckCircle,
  XCircle,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";
import { useOutbox } from "@/hooks";
import { initials, relativeFromNow } from "@/lib/format";
import type { Nav, Screen } from "@/lib/nav";
import type { EmailMessage, EmailType, Role } from "@/lib/types";

// ─── Navigation Config ────────────────────────────────────────────────────────
const studentNav = [
  { icon: LayoutDashboard, label: "Dashboard", screen: "student-dashboard" },
  { icon: Search, label: "Browse Events", screen: "event-listing" },
  { icon: Ticket, label: "My Events", screen: "my-events" },
  { icon: Calendar, label: "Event Calendar", screen: "event-calendar" },
  { icon: Bell, label: "Notifications", screen: "notifications" },
  { icon: QrCode, label: "My QR Pass", screen: "registration-success" },
  { icon: Star, label: "Feedback", screen: "feedback" },
  { icon: User, label: "Profile", screen: "profile" },
] as const;
const organizerNav = [
  { icon: LayoutDashboard, label: "Dashboard", screen: "organizer-dashboard" },
  { icon: Plus, label: "Create Event", screen: "create-event" },
  { icon: FileText, label: "Manage Events", screen: "manage-events" },
  { icon: Users, label: "Participants", screen: "participants" },
  { icon: BarChart2, label: "Reports", screen: "attendance-report" },
  { icon: User, label: "Profile", screen: "profile" },
] as const;
const adminNav = [
  { icon: LayoutDashboard, label: "Dashboard", screen: "admin-dashboard" },
  { icon: Scan, label: "QR Scanner", screen: "qr-scanner" },
  { icon: BarChart2, label: "Reports", screen: "attendance-report" },
  { icon: Mail, label: "Outbox", screen: "notifications" },
  { icon: FileText, label: "Events", screen: "manage-events" },
  { icon: Settings, label: "Settings", screen: "profile" },
] as const;

function navFor(role: Role) {
  return role === "student" ? studentNav : role === "organizer" ? organizerNav : adminNav;
}

/** Presentation for an Outbox email rendered as a notification. */
export function emailNotif(type: EmailType) {
  switch (type) {
    case "confirmation":
      return {
        label: "Registration Confirmed",
        Icon: CheckCircle,
        color: "text-emerald-500",
        dot: "bg-emerald-500",
        bg: "bg-emerald-50 dark:bg-emerald-950/50",
      };
    case "reminder":
      return {
        label: "Event Reminder",
        Icon: Bell,
        color: "text-blue-500",
        dot: "bg-blue-500",
        bg: "bg-blue-50 dark:bg-blue-950/50",
      };
    case "feedback_request":
      return {
        label: "Share Your Feedback",
        Icon: MessageCircle,
        color: "text-purple-500",
        dot: "bg-purple-500",
        bg: "bg-purple-50 dark:bg-purple-950/50",
      };
    case "cancellation":
      return {
        label: "Event Cancelled",
        Icon: XCircle,
        color: "text-red-500",
        dot: "bg-red-500",
        bg: "bg-red-50 dark:bg-red-950/50",
      };
    default:
      return {
        label: "Notification",
        Icon: Bell,
        color: "text-slate-500",
        dot: "bg-slate-500",
        bg: "bg-slate-50 dark:bg-slate-800",
      };
  }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
  role,
  current,
  nav,
  collapsed,
  setCollapsed,
  notifCount,
}: {
  role: Role;
  current: Screen;
  nav: Nav;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  notifCount: number;
}) {
  const { logout } = useAuth();
  const navItems = navFor(role);
  const roleLabel =
    role === "student" ? "Student Portal" : role === "organizer" ? "Organizer Hub" : "Admin Console";
  const roleColor =
    role === "student" ? "text-blue-400" : role === "organizer" ? "text-emerald-400" : "text-amber-400";

  const signOut = async () => {
    await logout();
    nav("landing");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-slate-900 dark:bg-slate-950 border-r border-slate-800 z-30 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
            <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">UniEvents</p>
            <p className={cn("text-xs leading-tight truncate", roleColor)}>{roleLabel}</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-400 hover:text-white transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-slate-800"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = current === item.screen;
          const badge = item.screen === "notifications" && notifCount > 0 ? notifCount : undefined;
          return (
            <button
              key={item.label}
              onClick={() => nav(item.screen as Screen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800",
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate font-medium">{item.label}</span>}
              {!collapsed && badge && !isActive && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center flex-shrink-0">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-2 flex-shrink-0">
        <button
          onClick={signOut}
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
const SCREEN_LABELS: Partial<Record<Screen, string>> = {
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
};

function TopNav({
  nav,
  isDark,
  setIsDark,
  screen,
  messages,
}: {
  nav: Nav;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  screen: Screen;
  messages: EmailMessage[];
}) {
  const { user, role } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const recent = messages.slice(0, 5);
  const unread = seen ? 0 : Math.min(messages.length, 9);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const avatarGradient =
    role === "student"
      ? "bg-gradient-to-br from-blue-500 to-blue-700"
      : role === "organizer"
        ? "bg-gradient-to-br from-emerald-500 to-teal-700"
        : "bg-gradient-to-br from-slate-700 to-slate-900";
  const roleChip =
    role === "student"
      ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
      : role === "organizer"
        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between px-6 h-16 gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            {SCREEN_LABELS[screen] || "UniEvents"}
          </h1>
          <p className="text-xs text-slate-400">University Campus Event System</p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {/* Bell with dropdown */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => {
                setBellOpen((o) => !o);
                setSeen(true);
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
                style={{ animation: "slideUp 300ms cubic-bezier(0,0,0.58,1) forwards" }}
              >
                <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Notifications</p>
                  <button
                    onClick={() => {
                      setBellOpen(false);
                      nav("notifications");
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-72 overflow-y-auto">
                  {recent.length === 0 && (
                    <p className="px-4 py-6 text-center text-xs text-slate-400">No notifications yet</p>
                  )}
                  {recent.map((n) => {
                    const meta = emailNotif(n.type);
                    return (
                      <div
                        key={n.id}
                        className="flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setBellOpen(false);
                          nav("notifications");
                        }}
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 dark:bg-slate-700">
                          <meta.Icon className={cn("w-4 h-4", meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{meta.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                            {n.subject}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{relativeFromNow(n.createdAt)}</p>
                        </div>
                        <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", meta.dot)} />
                      </div>
                    );
                  })}
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
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </button>

          <button
            onClick={() => nav("profile")}
            className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs",
                avatarGradient,
              )}
            >
              {user ? initials(user.name) : "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.name ?? "User"}
              </p>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize",
                  roleChip,
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

// ─── AppLayout ────────────────────────────────────────────────────────────────
export function AppLayout({
  children,
  nav,
  isDark,
  setIsDark,
  screen,
  collapsed,
  setCollapsed,
}: {
  children: React.ReactNode;
  nav: Nav;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  screen: Screen;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const { role } = useAuth();
  const { messages } = useOutbox();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Sidebar
        role={(role ?? "student") as Role}
        current={screen}
        nav={nav}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        notifCount={messages.length}
      />
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          collapsed ? "ml-16" : "ml-60",
        )}
      >
        <TopNav nav={nav} isDark={isDark} setIsDark={setIsDark} screen={screen} messages={messages} />
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
