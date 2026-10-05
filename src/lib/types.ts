// Types mirroring the UniEvents API responses (server/src/lib/serialize.ts).
// Kept in sync by hand — the frontend build strips types, so these are for
// authoring clarity, not runtime enforcement.

export type Role = "student" | "organizer" | "admin";
export type EventStatus = "draft" | "published" | "cancelled";
export type RegistrationStatus = "registered" | "cancelled";
export type EmailType =
  | "confirmation"
  | "reminder"
  | "feedback_request"
  | "cancellation";
export type CheckinResult =
  | "success"
  | "already_checked_in"
  | "cancelled"
  | "wrong_event"
  | "invalid";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  studentId: string | null;
  avatarColor: string | null;
  createdAt?: string;
}

/** Compact person embedded in events / registrations. */
export interface Person {
  id: string;
  name: string;
  email: string;
  studentId?: string | null;
  role: Role;
  avatarColor: string | null;
  department: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  eventCount?: number;
}

export interface SeatCategory {
  id: string;
  name: string;
  priceCents: number;
  totalSeats: number;
  sortOrder: number;
  registeredCount?: number;
  remainingSeats?: number;
}

export interface AgendaItem {
  time: string;
  title: string;
  speaker?: string;
}

export interface Speaker {
  name: string;
  role?: string;
  initials?: string;
}

export interface EventDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  registrationDeadline: string | null;
  seatLimit: number;
  priceCents: number;
  pricingMode: "free" | "fixed" | "category";
  registeredCount: number;
  remaining: number;
  checkedInCount: number;
  soldOut: boolean;
  coverImage: string | null;
  featured: boolean;
  status: EventStatus;
  approvalStatus?: "pending" | "accepted" | "rejected";
  reviewedById?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  allowCancellation?: boolean;
  tags: string[];
  agenda: AgendaItem[];
  speakers: Speaker[];
  seatCategories: SeatCategory[];
  category: Category | null;
  host: Person | null;
  coHosts: Person[];
  createdAt: string;
  updatedAt: string;
  /** Present on list/detail responses for a signed-in viewer. */
  isRegistered?: boolean;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: RegistrationStatus;
  ticketCode?: string;
  seatNumber: number | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  paidAmountCents?: number;
  paymentStatus?: string;
  seatCategoryId?: string | null;
  selectedCategoryName?: string | null;
  selectedCategoryPriceCents?: number | null;
  createdAt: string;
  event?: EventDTO;
  user?: Person;
}

export interface CancellationPreview {
  event: { id: string; title: string; startsAt: string };
  paidAmountCents: number;
  paymentStatus: string;
  penaltyPercentage: number;
  penaltyAmountCents: number;
  refundAmountCents: number;
  hoursRemaining: number;
  isFree: boolean;
  refundStatus: string;
}

/** A participant row (registration + full person), used by manager views. */
export interface Participant extends Registration {
  user: Person;
}

export interface EmailMessage {
  id: string;
  to: string;
  toName: string | null;
  subject: string;
  type: EmailType;
  html?: string;
  relatedEventId: string | null;
  userId: string | null;
  createdAt: string;
}

// ---- Endpoint-specific shapes --------------------------------------------

export interface EventDetail {
  event: EventDTO;
  myRegistration: Registration | null;
  canManage: boolean;
}

export interface Ticket {
  ticketCode: string;
  seatNumber: number | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  holderName: string;
  selectedCategoryName?: string | null;
  event: EventDTO;
}

export interface CheckinAttendee extends Person {
  seatNumber: number | null;
  ticketCode: string;
}

export interface CheckinResponse {
  result: CheckinResult;
  message: string;
  attendee?: CheckinAttendee;
  event?: { id: string; title: string; startsAt: string; location: string };
  checkedInAt?: string;
  counts?: { registered: number; checkedIn: number };
}

export interface ReportAttendee {
  id: string;
  seatNumber: number | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  user: Person;
}

export interface AttendanceReport {
  registeredCount: number;
  attendedCount: number;
  noShowCount: number;
  attendanceRate: number;
  capacity: number;
  fillRate: number;
  attendees: ReportAttendee[];
}

export interface FeedbackEntry {
  id: string;
  eventId?: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: Person;
}

export interface FeedbackSummary {
  count: number;
  average: number;
  distribution: { star: number; count: number }[];
}

export type ComplaintStatus =
  | "submitted"
  | "under_review"
  | "resolved"
  | "dismissed";
export type FineStatus = "issued" | "paid" | "waived";
export type ComplaintCategory =
  | "event_cancelled"
  | "misleading_information"
  | "organizer_misconduct"
  | "venue_problem"
  | "registration_problem"
  | "poor_management"
  | "payment_issue"
  | "other";

export interface ComplaintEntry {
  id: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  evidencePath: string | null;
  status: ComplaintStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  event?: EventDTO;
  participant?: Person;
  reviewedBy?: Person | null;
  fine?: FineEntry | null;
  fineOutcome?: string | null;
}

export interface ComplaintSummary {
  total: number;
  underReview: number;
  resolved: number;
}

export interface FineEntry {
  id: string;
  complaintId: string | null;
  eventId: string;
  amount: number;
  reason: string;
  status: FineStatus;
  issuedAt: string;
  updatedAt: string;
  event?: EventDTO;
  eventCreator?: Person;
  issuedBy?: Person;
}

// ---- Stats (role-dependent) ----------------------------------------------

export interface StudentStats {
  upcomingCount: number;
  pastCount: number;
  attendedCount: number;
  totalRegistrations: number;
  pendingFeedbackCount: number;
  nextEvent: { title: string; startsAt: string } | null;
}

export interface OrganizerEventStat {
  id: string;
  title: string;
  startsAt: string;
  status: EventStatus;
  seatLimit: number;
  registered: number;
  checkedIn: number;
}

export interface OrganizerStats {
  managedEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalCheckIns: number;
  attendanceRate: number;
  events: OrganizerEventStat[];
}

export interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalCheckIns: number;
  attendanceRate: number;
  categoryBreakdown: { name: string; color: string; value: number }[];
  monthlyTrend: { month: string; registrations: number; checkIns: number }[];
  recentActivity: { user: string; event: string; at: string }[];
}

export type StatsResponse =
  | { role: "student"; stats: StudentStats }
  | { role: "organizer"; stats: OrganizerStats }
  | { role: "admin"; stats: AdminStats };
