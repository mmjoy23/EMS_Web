import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./env.js";
import { ApiError } from "./lib/http.js";
import { startScheduler } from "./scheduler.js";

import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import eventRoutes from "./routes/events.js";
import registrationRoutes from "./routes/registrations.js";
import checkinRoutes from "./routes/checkin.js";
import feedbackRoutes from "./routes/feedback.js";
import outboxRoutes from "./routes/outbox.js";
import statsRoutes from "./routes/stats.js";
import userRoutes from "./routes/users.js";
import jobRoutes from "./routes/jobs.js";

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "8mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "unievents-api",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/outbox", outboxRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);

// Unknown API route.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler — maps ApiError / { status } to JSON.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    err instanceof ApiError
      ? err.status
      : typeof (err as { status?: number })?.status === "number"
        ? (err as { status: number }).status
        : 500;
  const message = err instanceof Error ? err.message : "Something went wrong";
  if (status >= 500) console.error("[api] unhandled error:", err);
  res.status(status).json({ error: message });
});

app.listen(env.PORT, () => {
  console.log(
    `\n  UniEvents API ready → http://localhost:${env.PORT}/api/health\n`,
  );
  startScheduler();
});
