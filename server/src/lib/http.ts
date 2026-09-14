import type { NextFunction, Request, Response } from "express";

/** An error with an attached HTTP status code. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const badRequest = (m = "Bad request") => new ApiError(400, m);
export const unauthorized = (m = "Not authenticated") => new ApiError(401, m);
export const forbidden = (m = "Not allowed") => new ApiError(403, m);
export const notFound = (m = "Not found") => new ApiError(404, m);
export const conflict = (m = "Conflict") => new ApiError(409, m);

/** Wraps an async route handler so thrown/rejected errors reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => unknown,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
