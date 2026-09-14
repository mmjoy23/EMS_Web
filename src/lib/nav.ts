// The screen-state navigation model (kept from the prototype — no router).
// `nav(screen, params)` switches screens; `params` carries an optional target
// like an event id/slug so detail/feedback/ticket screens know what to load.

import type { Role } from "./types";

export type Screen =
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
  | "attendance-report";

export interface NavParams {
  eventId?: string;
  slug?: string;
  [key: string]: unknown;
}

export type Nav = (screen: Screen, params?: NavParams) => void;

/** Common props every screen receives from the App shell. */
export interface ScreenProps {
  nav: Nav;
  params: NavParams;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
}

/** Default landing screen for a role after login. */
export function homeScreen(role: Role): Screen {
  if (role === "organizer") return "organizer-dashboard";
  if (role === "admin") return "admin-dashboard";
  return "student-dashboard";
}
