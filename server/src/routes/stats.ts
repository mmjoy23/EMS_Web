import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth/middleware.js";
import { EVENT_STATUS, REGISTRATION_STATUS, ROLES } from "../lib/constants.js";
import { asyncHandler } from "../lib/http.js";

const router = Router();

const MONTH_LABEL = (d: Date) => new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);

/** Build [{ key, label }] for the last `n` months, oldest first. */
function lastMonths(n: number) {
  const out: { key: string; label: string }[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABEL(d) });
  }
  return out;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

// ---------------------------------------------------------------------------
// GET /api/stats — role-appropriate dashboard aggregates
// ---------------------------------------------------------------------------
router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const role = req.user!.role;

    // ----------------------------- Admin -----------------------------------
    if (role === ROLES.ADMIN) {
      const [totalUsers, totalEvents, upcomingEvents, registeredRegs, checkedInCount] =
        await Promise.all([
          prisma.user.count(),
          prisma.event.count({ where: { status: EVENT_STATUS.PUBLISHED } }),
          prisma.event.count({
            where: { status: EVENT_STATUS.PUBLISHED, startsAt: { gte: now } },
          }),
          prisma.registration.findMany({
            where: { status: REGISTRATION_STATUS.REGISTERED },
            select: {
              createdAt: true,
              checkedInAt: true,
              event: { select: { category: { select: { name: true, color: true } } } },
            },
          }),
          prisma.registration.count({
            where: { status: REGISTRATION_STATUS.REGISTERED, checkedInAt: { not: null } },
          }),
        ]);

      // Registrations by category (pie).
      const byCat = new Map<string, { name: string; color: string; value: number }>();
      for (const r of registeredRegs) {
        const name = r.event.category?.name ?? "Other";
        const color = r.event.category?.color ?? "#94a3b8";
        const entry = byCat.get(name) ?? { name, color, value: 0 };
        entry.value += 1;
        byCat.set(name, entry);
      }

      // 6-month trend of registrations vs check-ins.
      const months = lastMonths(6);
      const trend = months.map((m) => ({ month: m.label, registrations: 0, checkIns: 0 }));
      const idx = new Map(months.map((m, i) => [m.key, i]));
      for (const r of registeredRegs) {
        const i = idx.get(monthKey(r.createdAt));
        if (i !== undefined) trend[i].registrations += 1;
        if (r.checkedInAt) {
          const j = idx.get(monthKey(r.checkedInAt));
          if (j !== undefined) trend[j].checkIns += 1;
        }
      }

      const recent = await prisma.registration.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { name: true } }, event: { select: { title: true } } },
      });

      return res.json({
        role,
        stats: {
          totalUsers,
          totalEvents,
          upcomingEvents,
          totalRegistrations: registeredRegs.length,
          totalCheckIns: checkedInCount,
          attendanceRate: registeredRegs.length
            ? Math.round((checkedInCount / registeredRegs.length) * 100)
            : 0,
          categoryBreakdown: [...byCat.values()].sort((a, b) => b.value - a.value),
          monthlyTrend: trend,
          recentActivity: recent.map((r) => ({
            user: r.user.name,
            event: r.event.title,
            at: r.createdAt.toISOString(),
          })),
        },
      });
    }

    // --------------------------- Organizer ----------------------------------
    if (role === ROLES.ORGANIZER) {
      const managed = await prisma.event.findMany({
        where: {
          OR: [{ hostId: req.user!.id }, { coHosts: { some: { userId: req.user!.id } } }],
        },
        select: { id: true, title: true, startsAt: true, seatLimit: true, status: true },
        orderBy: { startsAt: "asc" },
      });
      const ids = managed.map((e) => e.id);
      const regs = ids.length
        ? await prisma.registration.findMany({
            where: { eventId: { in: ids }, status: REGISTRATION_STATUS.REGISTERED },
            select: { eventId: true, checkedInAt: true },
          })
        : [];

      const perEvent = new Map<string, { registered: number; checkedIn: number }>();
      for (const id of ids) perEvent.set(id, { registered: 0, checkedIn: 0 });
      for (const r of regs) {
        const e = perEvent.get(r.eventId)!;
        e.registered += 1;
        if (r.checkedInAt) e.checkedIn += 1;
      }
      const totalReg = regs.length;
      const totalCheck = regs.filter((r) => r.checkedInAt).length;

      return res.json({
        role,
        stats: {
          managedEvents: managed.length,
          upcomingEvents: managed.filter((e) => e.startsAt >= now).length,
          totalRegistrations: totalReg,
          totalCheckIns: totalCheck,
          attendanceRate: totalReg ? Math.round((totalCheck / totalReg) * 100) : 0,
          events: managed.map((e) => ({
            id: e.id,
            title: e.title,
            startsAt: e.startsAt.toISOString(),
            status: e.status,
            seatLimit: e.seatLimit,
            registered: perEvent.get(e.id)!.registered,
            checkedIn: perEvent.get(e.id)!.checkedIn,
          })),
        },
      });
    }

    // ---------------------------- Student -----------------------------------
    const myRegs = await prisma.registration.findMany({
      where: { userId: req.user!.id, status: REGISTRATION_STATUS.REGISTERED },
      include: { event: { select: { startsAt: true, endsAt: true, title: true } } },
    });
    const upcoming = myRegs.filter((r) => r.event.startsAt >= now);
    const past = myRegs.filter((r) => r.event.endsAt < now);
    const attended = myRegs.filter((r) => r.checkedInAt != null);
    const feedbackGiven = await prisma.feedback.count({ where: { userId: req.user!.id } });
    const next = upcoming.sort((a, b) => +a.event.startsAt - +b.event.startsAt)[0];

    return res.json({
      role,
      stats: {
        upcomingCount: upcoming.length,
        pastCount: past.length,
        attendedCount: attended.length,
        totalRegistrations: myRegs.length,
        pendingFeedbackCount: Math.max(0, past.length - feedbackGiven),
        nextEvent: next
          ? { title: next.event.title, startsAt: next.event.startsAt.toISOString() }
          : null,
      },
    });
  }),
);

export default router;
