import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db.js";
import { ROLES, type Role } from "../lib/constants.js";
import { forbidden, unauthorized } from "../lib/http.js";
import { readTokenFromRequest, verifyToken } from "./jwt.js";

/**
 * Resolve the current user from the auth cookie, if any. Returns null when
 * there is no valid token or the user no longer exists.
 */
async function resolveUser(req: Request) {
  const token = readTokenFromRequest(req.cookies);
  if (!token) return null;
  let sub: string;
  try {
    ({ sub } = verifyToken(token));
  } catch {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: { id: sub },
    select: { id: true, name: true, email: true, role: true },
  });
  return user;
}

/** Attaches req.user when a valid session exists; never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await resolveUser(req);
  if (user) req.user = user;
  next();
}

/** Rejects with 401 unless a valid session exists. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = await resolveUser(req);
  if (!user) return next(unauthorized());
  req.user = user;
  next();
}

/** Requires an authenticated user whose role is in the allow-list. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role as Role)) return next(forbidden());
    next();
  };
}

/**
 * True when the user may manage the event: admin, the host, or a co-host.
 * (Event managers = host ∪ co-hosts ∪ admin.)
 */
export async function userManagesEvent(
  userId: string,
  role: string,
  eventId: string,
): Promise<boolean> {
  if (role === ROLES.ADMIN) return true;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { hostId: true, coHosts: { select: { userId: true } } },
  });
  if (!event) return false;
  if (event.hostId === userId) return true;
  return event.coHosts.some((c) => c.userId === userId);
}

/**
 * Route guard: 403 unless the current user can manage the event identified by
 * :id (or :eventId) in the path. Assumes requireAuth ran first.
 */
export function requireEventManager(paramName = "id") {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    const eventId = req.params[paramName] ?? req.params.eventId ?? req.params.id;
    if (!eventId) return next(forbidden());
    const allowed = await userManagesEvent(req.user.id, req.user.role, eventId);
    if (!allowed) return next(forbidden("You do not manage this event"));
    next();
  };
}
