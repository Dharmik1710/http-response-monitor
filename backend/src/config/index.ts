import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Centralised application configuration parsed from environment variables. */
export const config = {
  /** Process role: "monolith" (default) runs both, "worker"/"web" for split deployment */
  appRole: (process.env.APP_ROLE || "monolith") as "worker" | "web" | "monolith",
  /** HTTP port for the web role */
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  /** PostgreSQL connection string — no default, must be set */
  databaseUrl: required("DATABASE_URL"),
  /** Redis connection string for pub/sub */
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  /** Target URL for httpbin pings */
  httpbinUrl:
    process.env.HTTPBIN_URL || "https://httpbin.org/anything",
  /** Interval between pings in milliseconds (default 5 minutes) */
  pingIntervalMs: parseInt(
    process.env.PING_INTERVAL_MS || "300000",
    10
  ),

  /** Comma-separated allowed CORS origins (required in production for split deploy) */
  frontendUrl: process.env.FRONTEND_URL || "",
};
