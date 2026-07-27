import { and, eq, gte, lte, sql } from "drizzle-orm";
import { recordActivityEvent } from "@/lib/activity/events";
import { countDistinctActiveDays, countEvents } from "@/lib/activity/queries";
import {
  db,
  learningGoals,
  leetcodeAiSuggestions,
  leetcodeSubmissions,
  sdFeedback,
  sdPracticeFeedback,
  sdPracticeSubmissions,
  sdSubmissions,
} from "@/lib/db";
import { getMetricConfig } from "@/lib/goals/metrics";
import { getDateOnlyString, getTodayDateInTimezone } from "@/lib/timezone";
import { getProfile } from "@/lib/users";

function periodBounds(periodStart: string, periodEnd: string) {
  const from = new Date(`${periodStart}T00:00:00.000Z`);
  const to = new Date(`${periodEnd}T23:59:59.999Z`);
  return { from, to };
}

async function countLeetcodeProblemsSolved(
  userId: string,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const { from, to } = periodBounds(periodStart, periodEnd);
  const [row] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(leetcodeSubmissions)
    .where(
      and(
        eq(leetcodeSubmissions.userId, userId),
        gte(leetcodeSubmissions.timestamp, from),
        lte(leetcodeSubmissions.timestamp, to),
      ),
    );
  return Number(row?.count ?? 0);
}

async function countSuggestionsCompleted(
  userId: string,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(leetcodeAiSuggestions)
    .where(
      and(
        eq(leetcodeAiSuggestions.userId, userId),
        eq(leetcodeAiSuggestions.status, "completed"),
        gte(leetcodeAiSuggestions.date, periodStart),
        lte(leetcodeAiSuggestions.date, periodEnd),
      ),
    );
  return Number(row?.count ?? 0);
}

async function countSdEditionsCompleted(
  userId: string,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const { from, to } = periodBounds(periodStart, periodEnd);

  const [dailyRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(sdSubmissions)
    .where(
      and(
        eq(sdSubmissions.userId, userId),
        sql`${sdSubmissions.submittedAt} is not null`,
        gte(sdSubmissions.submittedAt, from),
        lte(sdSubmissions.submittedAt, to),
      ),
    );

  const [practiceRow] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(sdPracticeSubmissions)
    .where(
      and(
        eq(sdPracticeSubmissions.userId, userId),
        sql`${sdPracticeSubmissions.submittedAt} is not null`,
        gte(sdPracticeSubmissions.submittedAt, from),
        lte(sdPracticeSubmissions.submittedAt, to),
      ),
    );

  return Number(dailyRow?.count ?? 0) + Number(practiceRow?.count ?? 0);
}

async function avgSdScore(
  userId: string,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const { from, to } = periodBounds(periodStart, periodEnd);

  const dailyScores = await db
    .select({ score: sdFeedback.score })
    .from(sdFeedback)
    .innerJoin(sdSubmissions, eq(sdSubmissions.id, sdFeedback.submissionId))
    .where(
      and(
        eq(sdSubmissions.userId, userId),
        gte(sdFeedback.generatedAt, from),
        lte(sdFeedback.generatedAt, to),
      ),
    );

  const practiceScores = await db
    .select({ score: sdPracticeFeedback.score })
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
    );

  const scores = [...dailyScores, ...practiceScores].map((s) => s.score);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

async function computeAchievedValue(
  userId: string,
  metricKey: string,
  periodStart: string,
  periodEnd: string,
): Promise<number> {
  const { from, to } = periodBounds(periodStart, periodEnd);

  switch (metricKey) {
    case "leetcode_problems_solved":
      return countLeetcodeProblemsSolved(userId, periodStart, periodEnd);
    case "leetcode_daily_suggestions_done":
      return countSuggestionsCompleted(userId, periodStart, periodEnd);
    case "sd_editions_completed":
      return countSdEditionsCompleted(userId, periodStart, periodEnd);
    case "sd_avg_score":
      return avgSdScore(userId, periodStart, periodEnd);
    case "global_active_days":
      return countDistinctActiveDays(userId, from, to);
    case "global_total_events":
      return countEvents(userId, from, to);
    default:
      return 0;
  }
}

export async function recomputeGoalProgress(userId: string, goalId?: string) {
  const profile = await getProfile(userId);
  const todayStr = getDateOnlyString(
    getTodayDateInTimezone(profile?.timezone ?? "Asia/Kolkata"),
  );

  const goals = goalId
    ? await db
        .select()
        .from(learningGoals)
        .where(and(eq(learningGoals.userId, userId), eq(learningGoals.id, goalId)))
    : await db
        .select()
        .from(learningGoals)
        .where(and(eq(learningGoals.userId, userId), gte(learningGoals.periodEnd, todayStr)));

  const updated = [];

  for (const goal of goals) {
    if (!getMetricConfig(goal.metricKey)) continue;

    const previous = goal.achievedValue;
    const achievedValue = await computeAchievedValue(
      userId,
      goal.metricKey,
      goal.periodStart,
      goal.periodEnd,
    );

    if (achievedValue !== previous) {
      await db
        .update(learningGoals)
        .set({ achievedValue })
        .where(eq(learningGoals.id, goal.id));
    }

    if (previous < goal.targetValue && achievedValue >= goal.targetValue) {
      await recordActivityEvent({
        userId,
        module: goal.module as "leetcode" | "system-design" | "global",
        eventType: "goal_achieved",
        metadata: {
          goalId: goal.id,
          metricKey: goal.metricKey,
          targetValue: goal.targetValue,
          achievedValue,
        },
      });
    }

    updated.push({ ...goal, achievedValue });
  }

  return updated;
}

export async function recomputeAllActiveGoals(userId: string) {
  return recomputeGoalProgress(userId);
}
