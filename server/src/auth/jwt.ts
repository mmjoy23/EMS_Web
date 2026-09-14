import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env, isProd } from "../env.js";

const COOKIE_NAME = "uev_token";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type TokenPayload = { sub: string };

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string" || !decoded || typeof decoded.sub !== "string") {
    throw new Error("Invalid token payload");
  }
  return { sub: decoded.sub };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function readTokenFromRequest(cookies: Record<string, string> | undefined): string | null {
  return cookies?.[COOKIE_NAME] ?? null;
}
