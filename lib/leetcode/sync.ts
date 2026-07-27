import { and, desc, eq } from "drizzle-orm";
import {
  getRecentAcSubmission,
  getSkillStats,
  getSubmissionCalendar,
  getUserProfileAggregate,
} from "@/lib/leetcode/service";
import {
  db,
  leetcodeAiSuggestions,
  leetcodeDailySnapshots,
  leetcodeProfiles,
  leetcodeSubmissions,
  profiles,
} from "@/lib/db";
import { getLeetcodeProfile, getProfile } from "@/lib/users";
import { recordActivityEvent } from "@/lib/activity/events";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import {
  countSubmissionsToday,
  getTodayDateInTimezone,
  parseSubmissionCalendar,
} from "@/lib/timezone";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function syncLeetCodeStats(userId: string) {
  const lcProfile = await getLeetcodeProfile(userId);
  if (!lcProfile) throw new Error("LeetCode profile not configured");
  const profile = await getProfile(userId);
  const timezone = profile?.timezone ?? "Asia/Kolkata";
  const todayStr = formatDate(getTodayDateInTimezone(timezone));
  const username = lcProfile.leetcodeUsername;

  const [lcData, calendar, recentAc] = await Promise.all([
    getUserProfileAggregate(username),
    getSubmissionCalendar({ username, year: new Date().getFullYear() }),
    getRecentAcSubmission({ username, limit: 100 }),
  ]);

  const solvedToday = countSubmissionsToday(recentAc.submission, timezone);
  const calendarData =
    typeof calendar.submissionCalendar === "string"
      ? parseSubmissionCalendar(calendar.submissionCalendar)
      : (calendar.submissionCalendar as Record<string, number>);

  const snapshotValues = {
    totalSolved: lcData.totalSolved,
    easySolved: lcData.easySolved,
    mediumSolved: lcData.mediumSolved,
    hardSolved: lcData.hardSolved,
    streak: calendar.streak,
    submissionCountToday: solvedToday,
    calendarFragment: calendarData,
  };

  const existing = await db
    .select()
    .from(leetcodeDailySnapshots)
    .where(
      and(eq(leetcodeDailySnapshots.userId, userId), eq(leetcodeDailySnapshots.date, todayStr)),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(leetcodeDailySnapshots)
      .set(snapshotValues)
      .where(eq(leetcodeDailySnapshots.id, existing[0].id));
  } else {
    await db.insert(leetcodeDailySnapshots).values({ userId, date: todayStr, ...snapshotValues });
  }

  for (const submission of recentAc.submission) {
    const ts = new Date(Number.parseInt(submission.timestamp, 10) * 1000);
    const existingSub = await db
      .select()
      .from(leetcodeSubmissions)
      .where(
        and(
          eq(leetcodeSubmissions.userId, userId),
          eq(leetcodeSubmissions.titleSlug, submission.titleSlug),
          eq(leetcodeSubmissions.timestamp, ts),
        ),
      )
      .limit(1);
    if (!existingSub[0]) {
      await db.insert(leetcodeSubmissions).values({
        userId,
        titleSlug: submission.titleSlug,
        title: submission.title,
        difficulty: "Unknown",
        timestamp: ts,
        lang: submission.lang,
      });
      await recordActivityEvent({
        userId,
        module: "leetcode",
        eventType: "problem_solved",
        metadata: {
          titleSlug: submission.titleSlug,
          title: submission.title,
          lang: submission.lang,
        },
        occurredAt: ts,
      });
    }
  }

  await recordActivityEvent({
    userId,
    module: "leetcode",
    eventType: "sync_completed",
    metadata: { solvedToday, streak: calendar.streak },
  });

  await recomputeAllActiveGoals(userId);

  return { success: true, userId, date: todayStr, solvedToday, streak: calendar.streak };
}

export async function syncAllUsers() {
  const users = await db.select({ userId: leetcodeProfiles.userId }).from(leetcodeProfiles);
  const results = [];
  for (const { userId } of users) {
    try {
      results.push(await syncLeetCodeStats(userId));
    } catch (error) {
      results.push({
        userId,
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }
  return { processed: results.length, results };
}

export async function getDashboardData(userId: string) {
  const lcProfile = await getLeetcodeProfile(userId);
  if (!lcProfile) throw new Error("LeetCode profile not configured");
  const profile = await getProfile(userId);
  const timezone = profile?.timezone ?? "Asia/Kolkata";
  const todayStr = formatDate(getTodayDateInTimezone(timezone));
  const username = lcProfile.leetcodeUsername;

  const [lcData, calendar, skills, snapshots, suggestionRows, recentAc] = await Promise.all([
    getUserProfileAggregate(username),
    getSubmissionCalendar({ username, year: new Date().getFullYear() }),
    getSkillStats(username),
    db
      .select()
      .from(leetcodeDailySnapshots)
      .where(eq(leetcodeDailySnapshots.userId, userId))
      .orderBy(desc(leetcodeDailySnapshots.date))
      .limit(30),
    db
      .select()
      .from(leetcodeAiSuggestions)
      .where(
        and(eq(leetcodeAiSuggestions.userId, userId), eq(leetcodeAiSuggestions.date, todayStr)),
      )
      .limit(1),
    getRecentAcSubmission({ username, limit: 20 }),
  ]);

  const solvedToday = countSubmissionsToday(recentAc.submission, timezone);

  return {
    profileSettings: { ...lcProfile, timezone },
    profile: lcData,
    calendar,
    skills,
    snapshots: snapshots.reverse(),
    todaySuggestion: suggestionRows[0] ?? null,
    solvedToday,
    recentSubmissions: recentAc.submission.slice(0, 5),
  };
}
