// Resource hooks — thin wrappers over `api` + `useAsync`, each exposing a
// named payload plus `{ loading, error, refetch }`. Mutations (register,
// check-in, create event…) are called imperatively via `api` from handlers.

import { api, type EventFilters } from "@/lib/api";
import { useAsync } from "./useAsync";

export { useAsync } from "./useAsync";

export function useEvents(filters: EventFilters = {}) {
  const key = JSON.stringify(filters);
  const { data, loading, error, refetch } = useAsync(() => api.events.list(filters), [key]);
  return { events: data?.events ?? [], loading, error, refetch };
}

export function useFeaturedEvents() {
  const { data, loading, error, refetch } = useAsync(() => api.events.featured(), []);
  return { events: data?.events ?? [], loading, error, refetch };
}

export function useEvent(idOrSlug: string | null | undefined) {
  const { data, loading, error, refetch } = useAsync(
    () => api.events.get(idOrSlug as string),
    [idOrSlug],
    { enabled: !!idOrSlug },
  );
  return {
    event: data?.event ?? null,
    myRegistration: data?.myRegistration ?? null,
    canManage: data?.canManage ?? false,
    loading,
    error,
    refetch,
  };
}

export function useMyRegistrations() {
  const { data, loading, error, refetch } = useAsync(() => api.registrations.mine(), []);
  return { registrations: data?.registrations ?? [], loading, error, refetch };
}

export function useTicket(eventId: string | null | undefined) {
  const { data, loading, error, refetch } = useAsync(
    () => api.registrations.ticket(eventId as string),
    [eventId],
    { enabled: !!eventId },
  );
  return { ticket: data?.ticket ?? null, loading, error, refetch };
}

export function useCategories() {
  const { data, loading, error, refetch } = useAsync(() => api.categories.list(), []);
  return { categories: data?.categories ?? [], loading, error, refetch };
}

export function useUsers(q = "", role = "") {
  const { data, loading, error, refetch } = useAsync(
    () => api.users.list(q, role),
    [q, role],
  );
  return { users: data?.users ?? [], loading, error, refetch };
}

export function useStats() {
  const { data, loading, error, refetch } = useAsync(() => api.stats(), []);
  return { data, loading, error, refetch };
}

export function useParticipants(eventId: string | null | undefined) {
  const { data, loading, error, refetch } = useAsync(
    () => api.events.participants(eventId as string),
    [eventId],
    { enabled: !!eventId },
  );
  return { participants: data?.participants ?? [], loading, error, refetch };
}

export function useAttendanceReport(eventId: string | null | undefined) {
  const { data, loading, error, refetch } = useAsync(
    () => api.events.report(eventId as string),
    [eventId],
    { enabled: !!eventId },
  );
  return { event: data?.event ?? null, report: data?.report ?? null, loading, error, refetch };
}

export function useOutbox(type = "") {
  const { data, loading, error, refetch } = useAsync(() => api.outbox.list(type), [type]);
  return { messages: data?.messages ?? [], loading, error, refetch };
}

export function useFeedbackPending() {
  const { data, loading, error, refetch } = useAsync(() => api.feedback.pending(), []);
  return { events: data?.events ?? [], loading, error, refetch };
}

export function useMyFeedback() {
  const { data, loading, error, refetch } = useAsync(() => api.feedback.mine(), []);
  return { feedback: data?.feedback ?? [], loading, error, refetch };
}

export function useEventFeedback(eventId: string | null | undefined) {
  const { data, loading, error, refetch } = useAsync(
    () => api.feedback.forEvent(eventId as string),
    [eventId],
    { enabled: !!eventId },
  );
  return {
    summary: data?.summary ?? null,
    feedback: data?.feedback ?? [],
    loading,
    error,
    refetch,
  };
}
