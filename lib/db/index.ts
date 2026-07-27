import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false,
  ssl: connectionString.includes("supabase") ? "require" : undefined,
});

export const db = drizzle(client, { schema });

export * from "./schema";
