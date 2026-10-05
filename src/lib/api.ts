// Typed fetch client for the UniEvents API.
//
// All calls go to the relative `/api` base (Vite proxies it to the Express
// server in dev) and send the auth cookie via `credentials: "include"`.
// Non-2xx responses throw an `ApiError` carrying the server's message, which
// hooks/mutations surface as sonner toasts.

import type {
  AttendanceReport,
  CancellationPreview,
  Category,
  CheckinResponse,
  ComplaintEntry,
  ComplaintSummary,
  EmailMessage,
  EventDetail,
  EventDTO,
  FeedbackEntry,
  FeedbackSummary,
  FineEntry,
  Participant,
  Person,
  Registration,
  StatsResponse,
  Ticket,
  User,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers:
      body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 / empty bodies.
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(message, res.status);
  }
  return data as T;
}

const get = <T>(path: string, query?: Query) =>
  request<T>(withQuery(path, query));
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body });
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body });
const del = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "DELETE", body });

// ---- Payload shapes -------------------------------------------------------

export interface EventInput {
  title: string;
  description: string;
  categorySlug: string;
  location: string;
  startsAt: string;
  endsAt: string;
  seatLimit: number;
  priceCents?: number;
  registrationDeadline?: string | null;
  coverImage?: string | null;
  featured?: boolean;
  status?: "draft" | "published" | "cancelled";
  tags?: string[];
  coHostIds?: string[];
  agenda?: { time: string; title: string; speaker?: string }[];
  speakers?: { name: string; role?: string; initials?: string }[];
  qrCheckinEnabled?: boolean;
  sendConfirmation?: boolean;
  sendReminder?: boolean;
  allowCancellation?: boolean;
  requireApproval?: boolean;
}

export interface EventFilters {
  q?: string;
  category?: string;
  when?: "upcoming" | "past" | "";
  featured?: boolean;
  mine?: boolean;
}

export const api = {
  auth: {
    me: () => get<{ user: User | null }>("/auth/me"),
    login: (email: string, password: string) =>
      post<{ user: User }>("/auth/login", { email, password }),
    register: (input: {
      name: string;
      email: string;
      password: string;
      department?: string;
      studentId?: string;
    }) => post<{ user: User }>("/auth/register", input),
    logout: () => post<{ ok: true }>("/auth/logout"),
  },

  events: {
    list: (filters?: EventFilters) =>
      get<{ events: EventDTO[] }>("/events", filters as Query),
    featured: () => get<{ events: EventDTO[] }>("/events/featured"),
    get: (idOrSlug: string) => get<EventDetail>(`/events/${idOrSlug}`),
    create: (input: EventInput) => post<{ event: EventDTO }>("/events", input),
    update: (id: string, input: Partial<EventInput>) =>
      patch<{ event: EventDTO }>(`/events/${id}`, input),
    cancel: (id: string, reason?: string) =>
      post<{ ok: true; notified: number }>(`/events/${id}/cancel`, { reason }),
    resubmit: (id: string) =>
      post<{ event: EventDTO }>(`/events/${id}/resubmit`),
    duplicate: (id: string) =>
      post<{ event: EventDTO }>(`/events/${id}/duplicate`),
    participants: (id: string) =>
      get<{ participants: Participant[] }>(`/events/${id}/participants`),
    report: (id: string) =>
      get<{ event: EventDTO; report: AttendanceReport }>(
        `/events/${id}/report`,
      ),
    cohosts: {
      list: (id: string) => get<{ coHosts: Person[] }>(`/events/${id}/cohosts`),
      add: (id: string, userId: string) =>
        post<{ coHost: Person }>(`/events/${id}/cohosts`, { userId }),
      remove: (id: string, userId: string) =>
        del<{ ok: true }>(`/events/${id}/cohosts/${userId}`),
    },
  },

  registrations: {
    create: (eventId: string) =>
      post<{ registration: Registration }>("/registrations", { eventId }),
    remove: (eventId: string) =>
      del<{ registration: Registration }>(`/registrations/${eventId}`),
    cancellationPreview: (eventId: string) =>
      get<CancellationPreview>(
        `/registrations/${eventId}/cancellation-preview`,
      ),
    cancel: (eventId: string) =>
      post<{ registration: Registration; cancellation: CancellationPreview }>(
        `/registrations/${eventId}/cancel`,
      ),
    mine: () => get<{ registrations: Registration[] }>("/registrations/me"),
    ticket: (eventId: string) =>
      get<{ ticket: Ticket }>(`/registrations/${eventId}/ticket`),
  },

  checkin: (code: string, eventId?: string) =>
    post<CheckinResponse>("/checkin", { code, eventId }),

  categories: {
    list: () => get<{ categories: Category[] }>("/categories"),
  },

  admin: {
    eventRequests: (status = "all") =>
      get<{ requests: EventDTO[] }>("/admin/event-requests", { status }),
    decideEventRequest: (
      id: string,
      decision: "accepted" | "rejected",
      reason?: string,
    ) =>
      post<{ event: EventDTO }>(`/admin/event-requests/${id}/decision`, {
        decision,
        reason,
      }),
    complaints: (status = "all") =>
      get<{ complaints: ComplaintEntry[] }>("/admin/complaints", { status }),
    managedComplaints: () =>
      get<{ complaints: ComplaintEntry[] }>("/admin/complaints/managed"),
    updateComplaint: (
      id: string,
      status: ComplaintEntry["status"],
      adminNote?: string,
    ) =>
      patch<{ complaint: ComplaintEntry }>(`/admin/complaints/${id}`, {
        status,
        adminNote,
      }),
    createFine: (complaintId: string, amount: number, reason: string) =>
      post<{ fine: FineEntry }>("/admin/fines", {
        complaintId,
        amount,
        reason,
      }),
    fines: () => get<{ fines: FineEntry[] }>("/admin/fines"),
    updateFine: (id: string, status: FineEntry["status"]) =>
      patch<{ fine: FineEntry }>(`/admin/fines/${id}`, { status }),
  },

  complaints: {
    create: (
      category: string,
      eventId: string,
      subject: string,
      description: string,
      evidencePath?: string,
    ) =>
      post<{ complaint: ComplaintEntry }>("/admin/complaints", {
        eventId,
        category,
        subject,
        description,
        evidencePath,
      }),
    mine: () =>
      get<{ complaints: ComplaintEntry[]; summary: ComplaintSummary }>(
        "/admin/complaints/mine",
      ),
    get: (id: string) =>
      get<{ complaint: ComplaintEntry }>(`/admin/complaints/${id}`),
  },

  feedback: {
    submit: (eventId: string, rating: number, comment?: string) =>
      post<{ feedback: FeedbackEntry }>("/feedback", {
        eventId,
        rating,
        comment,
      }),
    mine: () => get<{ feedback: FeedbackEntry[] }>("/feedback/me"),
    pending: () => get<{ events: EventDTO[] }>("/feedback/pending"),
    forEvent: (eventId: string) =>
      get<{ summary: FeedbackSummary; feedback: FeedbackEntry[] }>(
        `/feedback/event/${eventId}`,
      ),
  },

  outbox: {
    list: (type?: string) =>
      get<{ messages: EmailMessage[] }>("/outbox", { type }),
    get: (id: string) => get<{ message: EmailMessage }>(`/outbox/${id}`),
  },

  stats: () => get<StatsResponse>("/stats"),

  users: {
    list: (q?: string, role?: string) =>
      get<{ users: Person[] }>("/users", { q, role }),
  },

  jobs: {
    reminders: () => post<{ ok: true; queued: number }>("/jobs/reminders"),
    feedback: () => post<{ ok: true; queued: number }>("/jobs/feedback"),
  },
};
