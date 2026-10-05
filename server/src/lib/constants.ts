// Application-level enums (SQLite has no native enum support).

export const ROLES = {
  STUDENT: "student",
  ORGANIZER: "organizer",
  ADMIN: "admin",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];
export const ALL_ROLES: Role[] = [ROLES.STUDENT, ROLES.ORGANIZER, ROLES.ADMIN];

export const REGISTRATION_STATUS = {
  REGISTERED: "registered",
  CANCELLED: "cancelled",
} as const;

export const EVENT_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  CANCELLED: "cancelled",
} as const;
export const EVENT_APPROVAL_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;
export type EventApprovalStatus =
  (typeof EVENT_APPROVAL_STATUS)[keyof typeof EVENT_APPROVAL_STATUS];

export const COMPLAINT_STATUS = {
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  RESOLVED: "resolved",
  DISMISSED: "dismissed",
} as const;

export const FINE_STATUS = {
  ISSUED: "issued",
  PAID: "paid",
  WAIVED: "waived",
} as const;
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const EMAIL_TYPE = {
  CONFIRMATION: "confirmation",
  REMINDER: "reminder",
  FEEDBACK_REQUEST: "feedback_request",
  CANCELLATION: "cancellation",
} as const;
export type EmailType = (typeof EMAIL_TYPE)[keyof typeof EMAIL_TYPE];

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && ALL_ROLES.includes(v as Role);
}
