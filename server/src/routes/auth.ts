import bcrypt from "bcryptjs";
import { Router } from "express";
import { prisma } from "../db.js";
import { optionalAuth } from "../auth/middleware.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../auth/jwt.js";
import { asyncHandler, conflict, unauthorized } from "../lib/http.js";
import { ROLES } from "../lib/constants.js";
import { serializeUser } from "../lib/serialize.js";
import { loginSchema, parseBody, registerSchema } from "../lib/validate.js";

// A small palette of gradient keys the UI uses for avatar chips.
const AVATAR_COLORS = ["indigo", "violet", "fuchsia", "sky", "emerald", "amber", "rose"];
const pickAvatarColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

const router = Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = parseBody(registerSchema, req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw conflict("An account with this email already exists");

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: bcrypt.hashSync(data.password, 10),
        role: ROLES.STUDENT,
        department: data.department ?? null,
        studentId: data.studentId ?? null,
        avatarColor: pickAvatarColor(),
      },
    });

    setAuthCookie(res, signToken(user.id));
    res.status(201).json({ user: serializeUser(user) });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = parseBody(loginSchema, req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !bcrypt.compareSync(data.password, user.passwordHash)) {
      throw unauthorized("Incorrect email or password");
    }
    setAuthCookie(res, signToken(user.id));
    res.json({ user: serializeUser(user) });
  }),
);

router.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    clearAuthCookie(res);
    res.json({ ok: true });
  }),
);

router.get(
  "/me",
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) return res.json({ user: null });
    const full = await prisma.user.findUnique({ where: { id: req.user.id } });
    res.json({ user: full ? serializeUser(full) : null });
  }),
);

export default router;
