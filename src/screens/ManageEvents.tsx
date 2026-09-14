import { useState } from "react";
import { Plus, Edit, Copy, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Btn,
  Badge,
  ProgressBar,
  BackBtn,
  catBadge,
  Loading,
  ErrorState,
  EmptyState,
  cn,
} from "@/components/shared";
import { useEvents } from "@/hooks";
import { api } from "@/lib/api";
import { formatDate, isPast, isUpcoming } from "@/lib/format";
import type { ScreenProps } from "@/lib/nav";

const EMPTY_COPY: Record<string, { title: string; subtitle: string }> = {
  active: { title: "No active events", subtitle: "Published upcoming events show up here." },
  draft: { title: "No draft events", subtitle: "Save an event as a draft to see it here." },
  past: { title: "No past events", subtitle: "Completed or cancelled events show up here." },
};

export function ManageEvents({ nav }: ScreenProps) {
  const [tab, setTab] = useState("active");
  const [busyId, setBusyId] = useState<string | null>(null);
  const { events, loading, error, refetch } = useEvents({ mine: true });

  const duplicate = async (id: string) => {
    setBusyId(id);
    try {
      await api.events.duplicate(id);
      toast.success("Event duplicated");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not duplicate event");
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (id: string) => {
    if (!window.confirm("Cancel this event? Registered attendees will be notified.")) return;
    setBusyId(id);
    try {
      await api.events.cancel(id);
      toast.success("Event cancelled");
      await refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel event");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const filtered = events.filter((e) => {
    if (tab === "active") return e.status === "published" && isUpcoming(e.startsAt);
    if (tab === "draft") return e.status === "draft";
    return isPast(e.startsAt) || e.status === "cancelled";
  });

  return (
    <div className="space-y-5">
      <BackBtn onClick={() => nav("organizer-dashboard")} label="Dashboard" />
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {["active", "draft", "past"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all", tab === t ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>{t}</button>
          ))}
        </div>
        <Btn variant="primary" size="sm" onClick={() => nav("create-event")}><Plus className="w-4 h-4" />Create Event</Btn>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title={EMPTY_COPY[tab].title} subtitle={EMPTY_COPY[tab].subtitle} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                {["Event", "Date", "Venue", "Registered", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filtered.map((e) => {
                  const pct = Math.round((e.registeredCount / Math.max(1, e.seatLimit)) * 100);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {e.coverImage ? (
                            <img src={e.coverImage} alt="" className="w-10 h-8 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0" />
                          )}
                          <div><p className="text-sm font-bold text-slate-900 dark:text-white">{e.title}</p><Badge color={catBadge(e.category)}>{e.category?.name ?? "Event"}</Badge></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(e.startsAt)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{e.location.split(",")[0]}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{e.registeredCount}<span className="text-slate-400">/{e.seatLimit}</span></p>
                        <div className="w-20 mt-1"><ProgressBar value={e.registeredCount} max={e.seatLimit} /></div>
                      </td>
                      <td className="px-4 py-3"><Badge color={pct >= 95 ? "red" : pct >= 75 ? "amber" : "green"} dot>{pct >= 95 ? "Sold Out" : pct >= 75 ? "Almost Full" : "Open"}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => nav("create-event", { eventId: e.id })} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => duplicate(e.id)} disabled={busyId === e.id} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors" title="Duplicate"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => nav("participants", { eventId: e.id })} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-400 hover:text-emerald-600 transition-colors" title="Participants"><Users className="w-4 h-4" /></button>
                          <button onClick={() => cancel(e.id)} disabled={busyId === e.id} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-600 transition-colors" title="Cancel"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
