import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { relations } from "./relations";

// `DATABSE_URL` was used by an early local environment template. Keep the
// fallback while developers migrate to the correctly named `DATABASE_URL`.
const databaseUrl = process.env.DATABASE_URL ?? process.env.DATABSE_URL;

if (!databaseUrl) {
  throw new Error(
    "Database connection is not configured. Add DATABASE_URL to your .env file.",
  );
}

const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, relations });
