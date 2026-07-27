import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  activityEvents,
  db,
  learningGoals,
  leetcodeAiSuggestions,
  leetcodeDailySnapshots,
  leetcodeProfiles,
  sdEditions,
  sdFeedback,
  sdSubmissions,
} from "@/lib/db";
import { getMetricConfig } from "@/lib/goals/metrics";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import { getEditionSchedule, formatEditionDate } from "@/lib/system-design/editions";
import { getTodayDateInTimezone } from "@/lib/timezone";
import { getLeetcodeProfile, getProfile } from "@/lib/users";
import type { SuggestedProblem } from "@/lib/leetcode/types";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildWeekActivity(
  today: Date,
  rows: { date: string; count: number }[],
): { date: string; count: number }[] {
  const map = new Map(rows.map((r) => [r.date, r.count]));
  const buckets: { date: string; count: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = formatDate(d);
    buckets.push({ date: dateStr, count: map.get(dateStr) ?? 0 });
  }

  return buckets;
}

export async function getGlobalDashboard(userId: string) {
  const profile = await getProfile(userId);
  const timezone = profile?.timezone ?? "Asia/Kolkata";
  const today = getTodayDateInTimezone(timezone);
  const todayStr = formatDate(today);
  const schedule = getEditionSchedule();
  const editionDateStr = formatEditionDate(schedule.today);

  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);

  await recomputeAllActiveGoals(userId);

  const [
    lcProfile,
    todaySnapshot,
    todaySuggestion,
    todayEditions,
    recentScores,
    weekActivity,
    activeGoals,
  ] = await Promise.all([
    getLeetcodeProfile(userId),
    db
      .select()
      .from(leetcodeDailySnapshots)
      .where(
        and(eq(leetcodeDailySnapshots.userId, userId), eq(leetcodeDailySnapshots.date, todayStr)),
      )
      .limit(1),
    db
      .select()
      .from(leetcodeAiSuggestions)
      .where(
        and(eq(leetcodeAiSuggestions.userId, userId), eq(leetcodeAiSuggestions.date, todayStr)),
      )
      .limit(1),
    db
      .select()
      .from(sdEditions)
      .where(eq(sdEditions.date, editionDateStr)),
    db
      .select({ score: sdFeedback.score })
      .from(sdFeedback)
      .innerJoin(sdSubmissions, eq(sdSubmissions.id, sdFeedback.submissionId))
      .where(eq(sdSubmissions.userId, userId))
      .orderBy(desc(sdFeedback.generatedAt))
      .limit(10),
    db
      .select({
        date: sql<string>`date(${activityEvents.occurredAt})`.as("date"),
        count: sql<number>`count(*)`.as("count"),
      })
      .from(activityEvents)
      .where(
        and(eq(activityEvents.userId, userId), gte(activityEvents.occurredAt, weekStart)),
      )
      .groupBy(sql`date(${activityEvents.occurredAt})`),
    db
      .select()
      .from(learningGoals)
      .where(and(eq(learningGoals.userId, userId), gte(learningGoals.periodEnd, todayStr)))
      .orderBy(desc(learningGoals.createdAt)),
  ]);

  const snapshot = todaySnapshot[0];
  const suggestion = todaySuggestion[0];
  const problems = (suggestion?.problems as SuggestedProblem[] | undefined) ?? [];

  const amEdition = todayEditions.find((e) => e.slot === "am");
  const pmEdition = todayEditions.find((e) => e.slot === "pm");

  const submissionStatuses = await Promise.all(
    todayEditions.map(async (edition) => {
      const [sub] = await db
        .select()
        .from(sdSubmissions)
        .where(and(eq(sdSubmissions.userId, userId), eq(sdSubmissions.editionId, edition.id)))
        .limit(1);
      return {
        edition,
        submitted: Boolean(sub?.submittedAt),
        score: sub
          ? (
              await db
                .select()
                .from(sdFeedback)
                .where(eq(sdFeedback.submissionId, sub.id))
                .limit(1)
            )[0]?.score
          : undefined,
      };
    }),
  );

  const avgScore =
    recentScores.length > 0
      ? Math.round(recentScores.reduce((s, r) => s + r.score, 0) / recentScores.length)
      : null;

  const goalsHit = activeGoals.filter((g) => g.achievedValue >= g.targetValue).length;
  const goalsTotal = activeGoals.length;

  const weekActivityFilled = buildWeekActivity(
    today,
    weekActivity.map((a) => ({ date: a.date, count: Number(a.count) })),
  );

  const weekTotal = weekActivityFilled.reduce((sum, d) => sum + d.count, 0);

  const topGoals = activeGoals
    .filter((g) => g.achievedValue < g.targetValue)
    .slice(0, 2)
    .map((g) => ({
      id: g.id,
      label: getMetricConfig(g.metricKey)?.label ?? g.metricKey,
      module: g.module,
      achievedValue: g.achievedValue,
      targetValue: g.targetValue,
      progressPercent: Math.min(
        100,
        Math.round((g.achievedValue / Math.max(g.targetValue, 1)) * 100),
      ),
    }));

  return {
    greeting: profile?.name ?? "Learner",
    streak: snapshot?.streak ?? 0,
    leetcode: {
      configured: Boolean(lcProfile),
      solvedToday: snapshot?.submissionCountToday ?? 0,
      dailyGoal: lcProfile?.dailyGoal ?? 2,
      suggestionCount: problems.length,
      problems: problems.slice(0, 3),
    },
    systemDesign: {
      am: amEdition
        ? {
            title: amEdition.title,
            submitted: submissionStatuses.find((s) => s.edition.slot === "am")?.submitted ?? false,
            href: `/system-design/c/${editionDateStr}/am`,
          }
        : null,
      pm: pmEdition
        ? {
            title: pmEdition.title,
            submitted: submissionStatuses.find((s) => s.edition.slot === "pm")?.submitted ?? false,
            href: `/system-design/c/${editionDateStr}/pm`,
          }
        : null,
    },
    metrics: {
      avgSdScore: avgScore,
      goalsProgress: goalsTotal > 0 ? Math.round((goalsHit / goalsTotal) * 100) : 0,
      goalsHit,
      goalsTotal,
      streak: snapshot?.streak ?? 0,
      weekTotal,
    },
    weekActivity: weekActivityFilled,
    topGoals,
  };
}
