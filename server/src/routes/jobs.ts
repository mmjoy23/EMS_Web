import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { ROLES } from "../lib/constants.js";
import { asyncHandler } from "../lib/http.js";
import { runFeedbackJob, runReminderJob } from "../scheduler.js";

const router = Router();

// Manual triggers so reminders / feedback requests can be demoed on demand
// (organizer or admin). The same jobs also run automatically on a timer.
router.post(
  "/reminders",
  requireAuth,
  requireRole(ROLES.ORGANIZER, ROLES.ADMIN),
  asyncHandler(async (_req, res) => {
    const queued = await runReminderJob();
    res.json({ ok: true, queued });
  }),
);

router.post(
  "/feedback",
  requireAuth,
  requireRole(ROLES.ORGANIZER, ROLES.ADMIN),
  asyncHandler(async (_req, res) => {
    const queued = await runFeedbackJob();
    res.json({ ok: true, queued });
  }),
);

export default router;
