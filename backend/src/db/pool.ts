import { Pool } from "pg";
import { config } from "../config";

/** Shared PostgreSQL connection pool. Used by both worker and web roles. */
export const pool = new Pool({
  connectionString: config.databaseUrl,
});
