import { verifyCronAuth } from "@/lib/cron/auth";
import { db, learningGoals } from "@/lib/db";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import { gte } from "drizzle-orm";
import { getDateOnlyString, getTodayDateInTimezone } from "@/lib/timezone";

export async function POST(request: Request) {
  const unauthorized = verifyCronAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const todayStr = getDateOnlyString(getTodayDateInTimezone("UTC"));

    const usersWithGoals = await db
      .selectDistinct({ userId: learningGoals.userId })
      .from(learningGoals)
      .where(gte(learningGoals.periodEnd, todayStr));

    const results = [];
    for (const { userId } of usersWithGoals) {
      try {
        const updated = await recomputeAllActiveGoals(userId);
        results.push({ userId, updated: updated.length });
      } catch (error) {
        results.push({
          userId,
          error: error instanceof Error ? error.message : "Recompute failed",
        });
      }
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Recompute failed" },
      { status: 500 },
    );
  }
}
