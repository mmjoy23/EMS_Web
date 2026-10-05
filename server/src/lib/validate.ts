import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(200),
  department: z.string().trim().max(80).optional(),
  studentId: z.string().trim().max(40).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Accepts ISO strings, timestamps, or Date; always yields a Date.
const isoDate = z.coerce.date();

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(5000).optional().default(""),
  categorySlug: z.string().trim().min(1),
  location: z.string().trim().min(1).max(200),
  startsAt: isoDate,
  endsAt: isoDate,
  seatLimit: z.coerce.number().int().min(1).max(100000),
  priceCents: z.coerce
    .number()
    .int()
    .min(0)
    .max(100000000)
    .optional()
    .default(0),
  pricingMode: z.enum(["free", "fixed", "category"]).optional().default("free"),
  seatCategories: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        priceCents: z.coerce.number().int().min(0).max(100000000),
        totalSeats: z.coerce.number().int().min(1).max(100000),
        sortOrder: z.coerce.number().int().min(0).optional().default(0),
      }),
    )
    .max(20)
    .optional()
    .default([]),
  registrationDeadline: isoDate.optional().nullable(),
  coverImage: z.string().trim().url().optional().nullable(),
  featured: z.boolean().optional().default(false),
  status: z
    .enum(["draft", "published", "cancelled"])
    .optional()
    .default("published"),
  tags: z.array(z.string().trim().max(40)).max(12).optional().default([]),
  coHostIds: z.array(z.string()).max(20).optional().default([]),
  agenda: z
    .array(
      z.object({
        time: z.string(),
        title: z.string(),
        speaker: z.string().optional().default(""),
      }),
    )
    .optional()
    .default([]),
  speakers: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().optional().default(""),
        initials: z.string().optional().default(""),
      }),
    )
    .optional()
    .default([]),
  qrCheckinEnabled: z.boolean().optional().default(true),
  sendConfirmation: z.boolean().optional().default(true),
  sendReminder: z.boolean().optional().default(true),
  allowCancellation: z.boolean().optional().default(false),
  requireApproval: z.boolean().optional().default(false),
});

export const updateEventSchema = createEventSchema.partial();

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().default(""),
});

export const checkinSchema = z.object({
  code: z.string().trim().min(1, "No code provided").max(200),
  eventId: z.string().optional(),
});

export const coHostSchema = z.object({
  userId: z.string().min(1),
});

/** Parse and throw a 400 with a readable message on failure. */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.join(".");
    const msg = first
      ? `${path ? path + ": " : ""}${first.message}`
      : "Invalid request";
    const err = new Error(msg) as Error & { status?: number };
    err.status = 400;
    throw err;
  }
  return result.data;
}
