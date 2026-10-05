import { useEffect } from "react";
import { Calendar, TrendingUp, Users, UserCheck, Plus } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Btn,
  StatCard,
  ProgressBar,
  Badge,
  Loading,
  ErrorState,
  EmptyState,
} from "@/components/shared";
import { useEvents, useStats } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/format";
import type { ScreenProps } from "@/lib/nav";
import type { EventStatus } from "@/lib/types";

const STATUS_BADGE: Record<EventStatus, string> = {
  published: "green",
  draft: "amber",
  cancelled: "red",
};

export function OrganizerDashboard({ nav }: ScreenProps) {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useStats();
  const { events: managedEvents, refetch: refetchEvents } = useEvents({
    mine: true,
  });
  const stats = data?.role === "organizer" ? data.stats : null;

  useEffect(() => {
    const refresh = () => {
      void refetch();
      void refetchEvents();
    };
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [refetch, refetchEvents]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!stats)
    return (
      <EmptyState
        title="No dashboard data"
        subtitle="Organizer statistics are unavailable."
      />
    );

  const activeEvents = managedEvents.filter(
    (event) =>
      event.status === "published" &&
      event.approvalStatus === "accepted" &&
      new Date(event.startsAt) >= new Date(),
  );

  const chartData = stats.events.map((e) => ({
    name: e.title.slice(0, 12),
    registrations: e.registered,
    attendance: e.checkedIn,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-extrabold">Organizer Hub</h2>
        <p className="text-emerald-100 text-sm mt-1">{user?.name}</p>
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
          label="Managed Events"
          value={String(stats.managedEvents)}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          label="Upcoming Events"
          value={String(stats.upcomingEvents)}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Total Registered"
          value={String(stats.totalRegistrations)}
          color="purple"
        />
        <StatCard
          icon={UserCheck}
          label="Avg Attendance"
          value={`${stats.attendanceRate}%`}
          color="amber"
        />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">
            Registration Trend
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart id="org-area-chart" data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
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
            {activeEvents.length === 0 ? (
              <EmptyState
                title="No events yet"
                subtitle="Create your first event to get started."
              />
            ) : (
              <>
                {activeEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    onClick={() => nav("participants", { eventId: e.id })}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {e.title}
                      </p>
                      <Badge color={STATUS_BADGE[e.status]}>{e.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(e.startsAt)}
                    </p>
                    <div className="mt-2">
                      <ProgressBar value={e.registered} max={e.seatLimit} />
                      <p className="text-xs text-slate-400 mt-1">
                        {e.registered}/{e.seatLimit} registered
                      </p>
                    </div>
                  </div>
                ))}
                <Btn
                  variant="outline"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => nav("manage-events")}
                >
                  View All Events
                </Btn>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
