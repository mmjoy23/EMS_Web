import { useState, useEffect } from "react";
import {
  Search,
  Download,
  FileText,
  Users,
  CheckCircle,
  Ticket,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  Btn,
  Badge,
  StatCard,
  BackBtn,
  Loading,
  ErrorState,
  EmptyState,
} from "@/components/shared";
import { useParticipants, useEvent, useEvents } from "@/hooks";
import { initials, formatDate } from "@/lib/format";
import type { ScreenProps } from "@/lib/nav";

export function Participants({ nav, params }: ScreenProps) {
  const [search, setSearch] = useState("");
  const { events, loading: eventsLoading } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>(
    params?.eventId ?? "",
  );

  // Sync selectedEventId if params.eventId changes, or default to first event when list loads
  useEffect(() => {
    if (params?.eventId) {
      setSelectedEventId(params.eventId);
    } else if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [params?.eventId, events]);

  const activeEventId =
    selectedEventId || params?.eventId || (events[0]?.id ?? "");
  const {
    participants,
    loading: participantsLoading,
    error,
    refetch,
  } = useParticipants(activeEventId);
  const { event } = useEvent(activeEventId);

  if (eventsLoading && !activeEventId) return <Loading />;
  if (events.length === 0 && !eventsLoading) {
    return (
      <div className="space-y-4">
        <BackBtn onClick={() => nav("manage-events")} label="Manage Events" />
        <EmptyState
          title="No events found"
          subtitle="Create an event first to see participants."
        />
      </div>
    );
  }

  if (participantsLoading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const q = search.toLowerCase();
  const filtered = participants.filter(
    (p) =>
      p.user.name.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q) ||
      (p.user.studentId && p.user.studentId.toLowerCase().includes(q)) ||
      (p.ticketCode && p.ticketCode.toLowerCase().includes(q)),
  );
  const checkedIn = participants.filter((p) => p.checkedIn).length;
  const remaining = event ? event.remaining : 0;

  const exportCsv = () => {
    const csv = [
      "Student ID,Name,Email,Department,Seat,Checked In,Ticket",
      ...filtered.map(
        (p) =>
          `"${p.user.studentId ?? ""}","${p.user.name}","${p.user.email}","${p.user.department ?? ""}",${p.seatNumber ?? ""},${p.checkedIn ? "Yes" : "No"},"${p.ticketCode ?? ""}"`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-${event?.slug ?? activeEventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Participant list exported to CSV");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackBtn onClick={() => nav("manage-events")} label="Manage Events" />
          {event && (
            <div className="mt-1">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {event.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {formatDate(event.startsAt)} · {event.location.split(",")[0]}
              </p>
            </div>
          )}
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <Calendar className="w-4 h-4 text-blue-500 ml-2" />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
              Event:
            </span>
            <select
              value={activeEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setSearch("");
              }}
              className="bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none pr-3 py-1 cursor-pointer max-w-xs truncate"
            >
              {events.map((e) => (
                <option
                  key={e.id}
                  value={e.id}
                  className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                >
                  {e.title} ({e.registeredCount} registered)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Registered"
          value={String(participants.length)}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Checked In"
          value={String(checkedIn)}
          color="green"
        />
        <StatCard
          icon={Ticket}
          label="Seats Remaining"
          value={String(remaining)}
          color="purple"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, student ID, or ticket..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4" />
              Export CSV
            </Btn>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={
              participants.length === 0
                ? "No participants registered yet"
                : "No matches found"
            }
            subtitle={
              participants.length === 0
                ? "When students register for this event, they will show up here."
                : "Try a different search term."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20">
                  {[
                    "Student",
                    "Email",
                    "Department",
                    "Seat",
                    "Check-in Status",
                    "Ticket Code",
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
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300 flex-shrink-0">
                          {initials(p.user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {p.user.name}
                          </p>
                          {p.user.studentId && (
                            <p className="text-xs font-mono text-slate-400">
                              {p.user.studentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {p.user.email}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {p.user.department ?? "—"}
                    </td>
                    <td className="px-3 py-3 text-sm font-mono text-slate-700 dark:text-slate-300">
                      {p.seatNumber ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge color={p.checkedIn ? "green" : "slate"} dot>
                        {p.checkedIn ? "Checked In" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {p.ticketCode ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
