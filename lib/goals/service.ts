import { and, desc, eq, gte } from "drizzle-orm";
import { db, learningGoals } from "@/lib/db";
import { getMetricConfig } from "@/lib/goals/metrics";
import { computePeriod } from "@/lib/goals/periods";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import type { CreateGoalInput, UpdateGoalInput } from "@/lib/goals/schemas";
import { getDateOnlyString, getTodayDateInTimezone } from "@/lib/timezone";
import { getProfile } from "@/lib/users";

const MAX_ACTIVE_GOALS = 5;

export async function listGoals(userId: string) {
  const profile = await getProfile(userId);
  const todayStr = getDateOnlyString(
    getTodayDateInTimezone(profile?.timezone ?? "Asia/Kolkata"),
  );

  await recomputeAllActiveGoals(userId);

  const goals = await db
    .select()
    .from(learningGoals)
    .where(eq(learningGoals.userId, userId))
    .orderBy(desc(learningGoals.createdAt));

  return goals.map((goal) => ({
    ...goal,
    isActive: goal.periodEnd >= todayStr,
    progressPercent: Math.min(
      100,
      Math.round((goal.achievedValue / Math.max(goal.targetValue, 1)) * 100),
    ),
  }));
}

export async function createGoal(userId: string, input: CreateGoalInput) {
  const metric = getMetricConfig(input.metricKey);
  if (!metric) {
    throw new Error("Invalid metric key");
  }
  if (metric.module !== input.module) {
    throw new Error("Metric does not belong to the selected module");
  }
  if (!metric.supportedTypes.includes(input.type)) {
    throw new Error("Metric does not support this goal type");
  }

  const profile = await getProfile(userId);
  const timezone = profile?.timezone ?? "Asia/Kolkata";
  const todayStr = getDateOnlyString(getTodayDateInTimezone(timezone));
  const { periodStart, periodEnd } = computePeriod(input.type, timezone);

  const activeGoals = await db
    .select()
    .from(learningGoals)
    .where(and(eq(learningGoals.userId, userId), gte(learningGoals.periodEnd, todayStr)));

  if (activeGoals.length >= MAX_ACTIVE_GOALS) {
    throw new Error(`Maximum ${MAX_ACTIVE_GOALS} active goals allowed`);
  }

  const duplicate = activeGoals.find(
    (g) =>
      g.module === input.module &&
      g.type === input.type &&
      g.metricKey === input.metricKey &&
      g.periodStart === periodStart,
  );
  if (duplicate) {
    throw new Error("An active goal with this metric already exists for the current period");
  }

  const [goal] = await db
    .insert(learningGoals)
    .values({
      userId,
      module: input.module,
      type: input.type,
      metricKey: input.metricKey,
      targetValue: input.targetValue,
      achievedValue: 0,
      periodStart,
      periodEnd,
    })
    .returning();

  await recomputeAllActiveGoals(userId);

  const [updated] = await db
    .select()
    .from(learningGoals)
    .where(eq(learningGoals.id, goal.id))
    .limit(1);

  return updated ?? goal;
}

export async function updateGoal(userId: string, goalId: string, input: UpdateGoalInput) {
  const [existing] = await db
    .select()
    .from(learningGoals)
    .where(and(eq(learningGoals.userId, userId), eq(learningGoals.id, goalId)))
    .limit(1);

  if (!existing) {
    throw new Error("Goal not found");
  }

  const [goal] = await db
    .update(learningGoals)
    .set({ targetValue: input.targetValue })
    .where(eq(learningGoals.id, goalId))
    .returning();

  await recomputeAllActiveGoals(userId);

  const [updated] = await db
    .select()
    .from(learningGoals)
    .where(eq(learningGoals.id, goalId))
    .limit(1);

  return updated ?? goal;
}

export async function deleteGoal(userId: string, goalId: string) {
  const [existing] = await db
    .select()
    .from(learningGoals)
    .where(and(eq(learningGoals.userId, userId), eq(learningGoals.id, goalId)))
    .limit(1);

  if (!existing) {
    throw new Error("Goal not found");
  }

  await db.delete(learningGoals).where(eq(learningGoals.id, goalId));
  return { success: true };
}
