import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { activityEvents, db } from "@/lib/db";

export async function getActivityByDay(userId: string, from: Date, to: Date) {
  return db
    .select({
      date: sql<string>`date(${activityEvents.occurredAt})`.as("date"),
      module: activityEvents.module,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.userId, userId),
        gte(activityEvents.occurredAt, from),
        lte(activityEvents.occurredAt, to),
      ),
    )
    .groupBy(sql`date(${activityEvents.occurredAt})`, activityEvents.module);
}

export async function getActivityByModule(userId: string, from: Date, to: Date) {
  return db
    .select({
      module: activityEvents.module,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.userId, userId),
        gte(activityEvents.occurredAt, from),
        lte(activityEvents.occurredAt, to),
      ),
    )
    .groupBy(activityEvents.module);
}

export async function getRecentEvents(userId: string, limit = 20) {
  return db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.userId, userId))
    .orderBy(desc(activityEvents.occurredAt))
    .limit(limit);
}

export async function countDistinctActiveDays(userId: string, from: Date, to: Date) {
  const [row] = await db
    .select({
      count: sql<number>`count(distinct date(${activityEvents.occurredAt}))`.as("count"),
    })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.userId, userId),
        gte(activityEvents.occurredAt, from),
        lte(activityEvents.occurredAt, to),
      ),
    );
  return Number(row?.count ?? 0);
}

export async function countEvents(userId: string, from: Date, to: Date) {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.userId, userId),
        gte(activityEvents.occurredAt, from),
        lte(activityEvents.occurredAt, to),
      ),
    );
  return Number(row?.count ?? 0);
}
