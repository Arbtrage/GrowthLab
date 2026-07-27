# GrowthLab

Unified personal learning platform for LeetCode progress, system design practice, AI coaching, goals, and cross-module analytics.

## Features

- **LeetCode** — Sync stats from LeetCode, daily AI problem suggestions, streak tracking, skill gap charts
- **System Design** — Twice-daily shared editions (AM warm-up / PM full design) with Mermaid + Excalidraw workspace and AI feedback
- **Personal SD Practice** — On-demand practice editions generated for your account
- **AI Coach** — Chat with tool access to your progress, suggestions, goals, and practice generation (Gemini 3 Lite)
- **Goals** — Daily and weekly targets across LeetCode, System Design, and global activity with live progress
- **Analytics** — 7 / 30 / 90-day activity charts, module breakdown, SD score trends, goal completion
- **Dashboard** — Cross-module KPIs, 7-day activity, active goal progress, today's focus

## Stack

| Layer | Technology |
|-------|------------|
| App | Next.js 16 (App Router), React 19, TypeScript |
| Auth & DB | Supabase Auth + Postgres, Drizzle ORM, RLS |
| AI | Vercel AI SDK, Google Gemini 3 Lite (`gemini-3.5-flash-lite` default) |
| Email | Resend + React Email templates |
| UI | Tailwind CSS 4, shadcn/ui, Recharts |
| Cron | GitHub Actions → Vercel API routes |
| Deploy | Vercel |

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) (recommended) or npm
- Supabase project (Auth + Postgres)
- Google AI Studio API key ([Gemini](https://aistudio.google.com/apikey))
- Resend account (optional, for email notifications)

## Setup

### 1. Clone and install

```bash
git clone <repo-url> growthlab
cd growthlab
pnpm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in the **SQL Editor** (in order):
   - [`drizzle/0000_init.sql`](drizzle/0000_init.sql) — core schema, RLS, goals, activity events
   - [`drizzle/0001_practice_chat.sql`](drizzle/0001_practice_chat.sql) — practice editions, AI chat tables
3. Enable **Google OAuth** under Authentication → Providers (optional)
4. Copy API keys from **Project Settings → API**
5. Copy **Database → Connection string → Transaction pooler** (port 6543, URI tab)

### 3. Environment

```bash
cp .env.example .env.local
```

Fill in all required values (see [Environment variables](#environment-variables)). Then verify the database connection:

```bash
pnpm run db:check
```

### 4. Run locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and configure your LeetCode username under **Settings**.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (cron, admin user lookup) |
| `DATABASE_URL` | Yes | Postgres URI from Supabase pooler (port 6543). Paste the full URI; do not double-encode the password |
| `GEMINI_API_KEY` | Yes | Google AI Studio API key for suggestions, SD editions, feedback, chat |
| `RESEND_API_KEY` | No | Email delivery |
| `RESEND_FROM_EMAIL` | No | Sender address for Resend |
| `CRON_SECRET` | Prod | Bearer token for `/api/cron/*` routes |
| `APP_URL` | Prod | Public app URL (e.g. `https://your-app.vercel.app`). Used for OG metadata and GitHub Actions cron |
| `MEM0_API_KEY` | No | Optional memory layer for AI chat |

**Database URL tips:** If `db:check` reports a malformed URI, re-copy the connection string from Supabase. Passwords containing `@` or `%` must use Supabase's encoded form (`%40` for `@`), not manual edits like `%%40`.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm lint` | ESLint |
| `pnpm db:check` | Validate `DATABASE_URL` connectivity |
| `pnpm db:studio` | Drizzle Studio (schema browser) |
| `pnpm db:push` | Push schema changes (dev only) |
| `pnpm backfill:activity` | Seed `activity_events` from historical submissions (optional one-time) |

## Routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Global home — KPIs, 7-day activity, goal progress, today's focus |
| `/leetcode` | Stats, sync, today's AI suggestions |
| `/leetcode/progress` | 30-day charts and skill gaps |
| `/leetcode/suggestions` | Suggestion list |
| `/system-design` | Today's editions + generate personal practice |
| `/system-design/c/[date]/[slot]` | Daily edition workspace (am/pm) |
| `/system-design/practice/[id]` | Personal practice workspace |
| `/chat` | AI learning coach |
| `/goals` | Create and track daily/weekly goals |
| `/analytics` | Cross-module analytics (7d / 30d / 90d) |
| `/settings` | Profile, timezone, LeetCode username, Gemini model, notifications |

## Goals & activity

Goals track progress against metrics such as problems solved, SD editions completed, active days, and average SD score. Progress is recomputed automatically after:

- LeetCode sync (new submissions)
- Marking suggestions done/skipped
- System design submission (daily or practice)

Activity events are written to `activity_events` and power analytics charts. To backfill history from existing data:

```bash
pnpm run backfill:activity          # all users
pnpm run backfill:activity <userId> # single user
```

**Goal limits:** Max 5 active goals; no duplicate metric in the same period. Weekly periods run Monday–Sunday in the user's timezone.

## AI models

All AI features use **Gemini 3 Lite** only:

- `gemini-3.5-flash-lite` (default)
- `gemini-3.1-flash-lite`

Configured in [`lib/ai/config.ts`](lib/ai/config.ts). Chat model selector and LeetCode settings expose only these two.

## API routes

### Authenticated (session)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/global` | Dashboard payload |
| GET | `/api/dashboard/leetcode` | LeetCode progress data |
| GET/POST | `/api/goals` | List / create goals |
| PATCH/DELETE | `/api/goals/[id]` | Update / delete goal |
| POST | `/api/goals/recompute` | Manual progress refresh |
| GET | `/api/analytics?range=7d\|30d\|90d` | Analytics aggregate |
| POST | `/api/chat` | AI chat stream |

### Cron (Bearer `CRON_SECRET`)

| Endpoint | Description |
|----------|-------------|
| `POST /api/cron/sync` | Sync LeetCode stats for all users |
| `POST /api/cron/suggest` | Generate daily AI suggestions |
| `POST /api/cron/check-missed` | Evening missed-day reminders |
| `POST /api/cron/generate?slot=am\|pm` | Generate SD daily editions |
| `POST /api/cron/recompute-goals` | Recompute active goal progress |

## Cron workflows

Set GitHub Actions secrets: `APP_URL`, `CRON_SECRET`.

| Workflow | Schedule (UTC) | Endpoint |
|----------|----------------|----------|
| `nightly-sync` | 00:00 daily | `/api/cron/sync` |
| `morning-suggest` | 06:00 daily | `/api/cron/suggest` |
| `evening-reminder` | 18:00 daily | `/api/cron/check-missed` |
| `daily-editions` | 01:30, 13:30 daily | `/api/cron/generate?slot=am\|pm` |
| `recompute-goals` | 01:30 daily | `/api/cron/recompute-goals` |

## Project structure

```
app/
  (auth)/          Login, signup
  (platform)/      Authenticated pages
  api/             REST + cron + chat
  actions.ts       Server actions
components/        UI, layout, module widgets
features/          Page-level client features (dashboard, goals, analytics)
lib/
  activity/        Event recording and queries
  ai/              Gemini client, chat, SD generation
  analytics/       Aggregation for /analytics
  dashboard/       Global dashboard data
  goals/           Metrics, periods, recompute, CRUD
  leetcode/        GraphQL client, sync, suggestions
  system-design/   Editions, practice, feedback
drizzle/           SQL migrations
scripts/           db:check, activity backfill
emails/            React Email templates
```

## Deployment (Vercel)

1. Import the repo and set all environment variables from `.env.example`
2. Set `APP_URL` to your production domain
3. Add `CRON_SECRET` and configure GitHub Actions secrets to match
4. Ensure both SQL migrations have been applied to production Supabase

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Failed query` / ECIRCUITBREAKER on profiles | Fix `DATABASE_URL` — run `pnpm db:check` |
| No AI suggestions | Set `GEMINI_API_KEY`; configure LeetCode username in Settings |
| Hydration warning `cz-shortcut-listen` | Browser extension injecting DOM attrs — safe to ignore or test incognito |
| `/sw.js` 404 | No service worker registered — expected |
| Slow LeetCode sync | LeetCode API + per-submission DB upserts; normal for first sync |

## Replaces

This repo consolidates:

- **alfa-leetcode-api** — LeetCode GraphQL client + progress dashboard
- **system-design-challenger** — twice-daily system design practice

Delete the old repos after verifying production deployment.
