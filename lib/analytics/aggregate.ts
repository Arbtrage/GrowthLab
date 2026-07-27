import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getActivityByDay, getActivityByModule } from "@/lib/activity/queries";
import {
  db,
  learningGoals,
  leetcodeDailySnapshots,
  leetcodeSubmissions,
  sdFeedback,
  sdPracticeFeedback,
  sdPracticeSubmissions,
  sdSubmissions,
} from "@/lib/db";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import { getDateOnlyString, getTodayDateInTimezone } from "@/lib/timezone";
import { getLeetcodeProfile, getProfile } from "@/lib/users";

export type AnalyticsRange = "7d" | "30d" | "90d";

function rangeToDays(range: AnalyticsRange): number {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
  }
}

function fillDailyBuckets(
  from: Date,
  days: number,
  rows: { date: string; count: number }[],
): { date: string; count: number }[] {
  const map = new Map(rows.map((r) => [r.date, r.count]));
  const buckets: { date: string; count: number }[] = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    buckets.push({ date: dateStr, count: map.get(dateStr) ?? 0 });
  }

  return buckets;
}

export async function getAnalytics(userId: string, range: AnalyticsRange = "7d") {
  const profile = await getProfile(userId);
  const timezone = profile?.timezone ?? "Asia/Kolkata";
  const today = getTodayDateInTimezone(timezone);
  const todayStr = getDateOnlyString(today);
  const days = rangeToDays(range);

  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - (days - 1));
  const fromStr = getDateOnlyString(from);
  const to = new Date(`${todayStr}T23:59:59.999Z`);

  await recomputeAllActiveGoals(userId);

  const lcProfile = await getLeetcodeProfile(userId);

  const [
    activityByDay,
    activityByModule,
    lcSubmissions,
    sdDailyCount,
    sdPracticeCount,
    dailyScores,
    practiceScores,
    snapshots,
    activeGoals,
  ] = await Promise.all([
    getActivityByDay(userId, from, to),
    getActivityByModule(userId, from, to),
    db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(leetcodeSubmissions)
      .where(
        and(
          eq(leetcodeSubmissions.userId, userId),
          gte(leetcodeSubmissions.timestamp, from),
          lte(leetcodeSubmissions.timestamp, to),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(sdSubmissions)
      .where(
        and(
          eq(sdSubmissions.userId, userId),
          sql`${sdSubmissions.submittedAt} is not null`,
          gte(sdSubmissions.submittedAt, from),
          lte(sdSubmissions.submittedAt, to),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(sdPracticeSubmissions)
      .where(
        and(
          eq(sdPracticeSubmissions.userId, userId),
          sql`${sdPracticeSubmissions.submittedAt} is not null`,
          gte(sdPracticeSubmissions.submittedAt, from),
          lte(sdPracticeSubmissions.submittedAt, to),
        ),
      ),
    db
      .select({
        score: sdFeedback.score,
        generatedAt: sdFeedback.generatedAt,
        title: sql<string>`'Daily edition'`.as("title"),
      })
      .from(sdFeedback)
      .innerJoin(sdSubmissions, eq(sdSubmissions.id, sdFeedback.submissionId))
      .where(
        and(
          eq(sdSubmissions.userId, userId),
          gte(sdFeedback.generatedAt, from),
          lte(sdFeedback.generatedAt, to),
        ),
      )
      .orderBy(desc(sdFeedback.generatedAt)),
    db
      .select({
        score: sdPracticeFeedback.score,
        generatedAt: sdPracticeFeedback.generatedAt,
      })
      .from(sdPracticeFeedback)
      .innerJoin(
        sdPracticeSubmissions,
        eq(sdPracticeSubmissions.id, sdPracticeFeedback.submissionId),
      )
      .where(
        and(
          eq(sdPracticeSubmissions.userId, userId),
          gte(sdPracticeFeedback.generatedAt, from),
          lte(sdPracticeFeedback.generatedAt, to),
        ),
      )
      .orderBy(desc(sdPracticeFeedback.generatedAt)),
    db
      .select()
      .from(leetcodeDailySnapshots)
      .where(
        and(
          eq(leetcodeDailySnapshots.userId, userId),
          gte(leetcodeDailySnapshots.date, fromStr),
          lte(leetcodeDailySnapshots.date, todayStr),
        ),
      )
      .orderBy(leetcodeDailySnapshots.date),
    db
      .select()
      .from(learningGoals)
      .where(and(eq(learningGoals.userId, userId), gte(learningGoals.periodEnd, fromStr))),
  ]);

  const dailyTotals = new Map<string, number>();
  for (const row of activityByDay) {
    dailyTotals.set(row.date, (dailyTotals.get(row.date) ?? 0) + Number(row.count));
  }

  const timeSeries = fillDailyBuckets(
    from,
    days,
    [...dailyTotals.entries()].map(([date, count]) => ({ date, count })),
  );

  const moduleMap = new Map<string, number>();
  for (const row of activityByModule) {
    moduleMap.set(row.module, Number(row.count));
  }

  const leetcodeEvents = moduleMap.get("leetcode") ?? 0;
  const sdEvents = moduleMap.get("system-design") ?? 0;
  const globalEvents = moduleMap.get("global") ?? 0;

  const lcProblemsSolved = Number(lcSubmissions[0]?.count ?? 0);
  const sdCompleted =
    Number(sdDailyCount[0]?.count ?? 0) + Number(sdPracticeCount[0]?.count ?? 0);

  const allScores = [
    ...dailyScores.map((s) => ({ score: s.score, date: s.generatedAt.toISOString().slice(0, 10) })),
    ...practiceScores.map((s) => ({
      score: s.score,
      date: s.generatedAt.toISOString().slice(0, 10),
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const avgSdScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length)
      : null;

  const goalsInRange = activeGoals.filter((g) => g.periodEnd >= fromStr);
  const goalsHit = goalsInRange.filter((g) => g.achievedValue >= g.targetValue).length;

  const latestSnapshot = snapshots[snapshots.length - 1];

  return {
    range,
    summary: {
      leetcode: {
        configured: Boolean(lcProfile),
        problemsSolved: lcProblemsSolved,
        events: leetcodeEvents,
        streak: latestSnapshot?.streak ?? 0,
      },
      systemDesign: {
        editionsCompleted: sdCompleted,
        events: sdEvents,
        avgScore: avgSdScore,
      },
      global: {
        totalEvents: leetcodeEvents + sdEvents + globalEvents,
        activeDays: timeSeries.filter((d) => d.count > 0).length,
      },
    },
    timeSeries,
    scoreHistory: allScores,
    moduleComparison: [
      { module: "LeetCode", count: leetcodeEvents || lcProblemsSolved },
      { module: "System Design", count: sdEvents || sdCompleted },
    ],
    goalSummary: {
      total: goalsInRange.length,
      hit: goalsHit,
      completionRate:
        goalsInRange.length > 0 ? Math.round((goalsHit / goalsInRange.length) * 100) : 0,
    },
  };
}
