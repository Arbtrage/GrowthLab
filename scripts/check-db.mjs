import fs from "node:fs";
import postgres from "postgres";

function loadDatabaseUrl() {
  const envPath = ".env.local";
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }

  const line = fs
    .readFileSync(envPath, "utf8")
    .split("\n")
    .find((entry) => entry.startsWith("DATABASE_URL="));

  if (!line) {
    console.error("DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  return line.slice("DATABASE_URL=".length).replace(/^["']|["']$/g, "");
}

function validateDatabaseUrl(connectionString) {
  let url;

  try {
    url = new URL(connectionString);
  } catch {
    console.error("DATABASE_URL is not a valid URL.");
    printConnectionStringHelp();
    process.exit(1);
  }

  if (!url.password) {
    console.error("DATABASE_URL is missing a password.");
    printConnectionStringHelp();
    process.exit(1);
  }

  try {
    decodeURIComponent(url.password);
  } catch {
    console.error("DATABASE_URL has a malformed password (invalid URL encoding).");
    console.error("");
    console.error("Common causes:");
    console.error("- Double-encoded characters (e.g. %%40 instead of %40)");
    console.error("- An unencoded @, #, or % in the password");
    console.error("- Manually editing the password instead of copying Supabase's URI");
    console.error("");
    printConnectionStringHelp();
    process.exit(1);
  }

  return url;
}

function printConnectionStringHelp() {
  console.error("Fix:");
  console.error("1. Supabase Dashboard → Project Settings → Database");
  console.error("2. Connection string → Transaction pooler (port 6543) → URI tab");
  console.error("3. Copy the entire URI and replace DATABASE_URL in .env.local");
  console.error("4. Do not edit the password manually — Supabase URL-encodes it for you");
}

const connectionString = loadDatabaseUrl();
const url = validateDatabaseUrl(connectionString);
const host = url.hostname;

console.log(`Checking ${host} ...`);

const sql = postgres(connectionString, {
  prepare: false,
  max: 1,
  connect_timeout: 10,
  ssl: host.includes("supabase") ? "require" : undefined,
});

try {
  await sql`SELECT 1 AS ok`;

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  `;

  if (tables.length === 0) {
    console.error("Connected, but public.profiles is missing.");
    console.error("Run drizzle/0000_init.sql in the Supabase SQL editor.");
    process.exit(1);
  }

  const [{ count }] = await sql`SELECT count(*)::int AS count FROM profiles`;
  console.log(`Connection OK. profiles table exists (${count} rows).`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("URI malformed")) {
    console.error("DATABASE_URL password encoding is invalid.");
    printConnectionStringHelp();
  } else if (message.includes("ECIRCUITBREAKER") || message.includes("authentication")) {
    console.error("Database authentication failed.");
    console.error("");
    console.error("If you recently fixed DATABASE_URL, wait 2–5 minutes for Supabase's");
    console.error("connection limiter to reset, then run: pnpm run db:check");
    console.error("");
    printConnectionStringHelp();
  } else {
    console.error("Database check failed:", message);
  }

  process.exit(1);
} finally {
  await sql.end({ timeout: 2 });
}
