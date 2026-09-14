import "dotenv/config";

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  JWT_SECRET: process.env.JWT_SECRET ?? "unievents-dev-secret-change-me",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  SMTP_URL: process.env.SMTP_URL ?? "",
};

export const isProd = env.NODE_ENV === "production";
