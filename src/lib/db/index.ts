import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// prepare: false is REQUIRED for Supabase Transaction Pooler (port 6543)
// Session Pooler (port 5432) will exhaust connections on Vercel serverless
const client = postgres(process.env.DATABASE_URL as string, { prepare: false });

export const db = drizzle(client, { schema });
