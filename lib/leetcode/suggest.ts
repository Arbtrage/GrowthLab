import { GoogleGenerativeAI } from "@google/generative-ai";
import { and, eq } from "drizzle-orm";
import {
  getDailyProblem,
  getProblemSet,
  getRecentAcSubmission,
  getSelectProblem,
  getSkillStats,
  getSubmissionCalendar,
  getUserProfileAggregate,
} from "@/lib/leetcode/service";
import type { SkillStats, SuggestedProblem } from "@/lib/leetcode/types";
import {
  db,
  leetcodeAiSuggestions,
  leetcodeDailySnapshots,
  leetcodeProfiles,
  notificationLogs,
  profiles,
  userPreferences,
} from "@/lib/db";
import {
  formatMissedDayEmail,
  formatSuggestionEmail,
  sendEmailNotification,
} from "@/lib/notify/resend";
import { getLeetcodeProfile, getProfile, listUsersWithLeetcodeProfiles } from "@/lib/users";
import {
  countSubmissionsToday,
  getTodayDateInTimezone,
  isWithinNotificationWindow,
} from "@/lib/timezone";
import { resolveModel } from "@/lib/ai/config";
import { createServiceClient } from "@/lib/supabase/server";

type LcProfileRow = typeof leetcodeProfiles.$inferSelect & { timezone: string };

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getWeakestTags(skills: {
  fundamental: SkillStats[];
  intermediate: SkillStats[];
  advanced: SkillStats[];
}) {
  const all = [...skills.fundamental, ...skills.intermediate, ...skills.advanced];
  return all
    .filter((t) => t.problemsSolved < 10)
    .sort((a, b) => a.problemsSolved - b.problemsSolved)
    .slice(0, 3);
}

async function fetchCandidates(
  weakTags: SkillStats[],
  recentSlugs: Set<string>,
  difficultyPref: string,
) {
  const candidates: Array<{ slug: string; title: string; difficulty: string; tags: string[] }> = [];
  for (const tag of weakTags) {
    const difficulty = difficultyPref === "mixed" ? undefined : difficultyPref.toUpperCase();
    const result = await getProblemSet({ tags: tag.tagSlug, difficulty, limit: 10 });
    for (const question of result.problemsetQuestionList) {
      const item = question as {
        title: string;
        titleSlug: string;
        difficulty: string;
        topicTags?: { name: string }[];
      };
      if (recentSlugs.has(item.titleSlug)) continue;
      candidates.push({
        slug: item.titleSlug,
        title: item.title,
        difficulty: item.difficulty,
        tags: item.topicTags?.map((t) => t.name) ?? [tag.tagName],
      });
    }
  }
  return candidates.slice(0, 30);
}

async function validateSuggestions(raw: Array<{ slug: string; reason: string }>) {
  const validated: SuggestedProblem[] = [];
  for (const item of raw) {
    try {
      const problem = await getSelectProblem(item.slug);
      validated.push({
        slug: problem.titleSlug,
        title: problem.questionTitle,
        difficulty: problem.difficulty,
        reason: item.reason,
        leetcodeUrl: problem.link,
      });
    } catch {
      /* skip invalid */
    }
  }
  return validated;
}

async function fallbackSuggestions(weakTags: SkillStats[]) {
  const daily = await getDailyProblem();
  const suggestions: SuggestedProblem[] = [
    {
      slug: daily.titleSlug,
      title: daily.questionTitle,
      difficulty: daily.difficulty,
      reason: "Official daily challenge",
      leetcodeUrl: daily.questionLink,
    },
  ];
  if (weakTags[0]) {
    const result = await getProblemSet({ tags: weakTags[0].tagSlug, limit: 5 });
    const question = result.problemsetQuestionList[0] as {
      title: string;
      titleSlug: string;
      difficulty: string;
    };
    if (question) {
      suggestions.push({
        slug: question.titleSlug,
        title: question.title,
        difficulty: question.difficulty,
        reason: `Practice weak area: ${weakTags[0].tagName}`,
        leetcodeUrl: `https://leetcode.com/problems/${question.titleSlug}`,
      });
    }
  }
  return suggestions;
}

export async function generateDailySuggestions(userId: string, profileSettings: LcProfileRow) {
  const username = profileSettings.leetcodeUsername;
  const [profile, skills, recentAc, calendar] = await Promise.all([
    getUserProfileAggregate(username),
    getSkillStats(username),
    getRecentAcSubmission({ username, limit: 50 }),
    getSubmissionCalendar({ username, year: new Date().getFullYear() }),
  ]);

  const recentSlugs = new Set(recentAc.submission.map((s) => s.titleSlug));
  const weakTags = getWeakestTags(skills);
  const candidates = await fetchCandidates(
    weakTags,
    recentSlugs,
    profileSettings.difficultyPref,
  );

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackSuggestions(weakTags);

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelId = resolveModel(profileSettings.geminiModel);
  const model = genAI.getGenerativeModel({ model: modelId });
  const prompt = `You are a LeetCode coach. Pick ${profileSettings.dailyGoal} problems for today.
Return ONLY valid JSON: {"problems":[{"slug":"...","reason":"..."}]}
Context: streak=${calendar.streak}, weakTags=${JSON.stringify(weakTags.map((t) => t.tagSlug))}, difficultyPref=${profileSettings.difficultyPref}
Candidates: ${JSON.stringify(candidates)}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    const parsed = JSON.parse(jsonMatch[0]) as { problems: Array<{ slug: string; reason: string }> };
    const validated = await validateSuggestions(parsed.problems);
    if (validated.length > 0) return validated;
  } catch (error) {
    console.error("Gemini suggestion failed:", error);
  }
  return fallbackSuggestions(weakTags);
}

async function getUserEmail(userId: string) {
  const supabase = await createServiceClient();
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

export async function runSuggestForUser(userId: string) {
  const lcProfile = await getLeetcodeProfile(userId);
  const profile = await getProfile(userId);
  if (!lcProfile || !profile) throw new Error("Profile not found");

  const settings = { ...lcProfile, timezone: profile.timezone };
  const todayStr = formatDate(getTodayDateInTimezone(profile.timezone));

  const existing = await db
    .select()
    .from(leetcodeAiSuggestions)
    .where(
      and(eq(leetcodeAiSuggestions.userId, userId), eq(leetcodeAiSuggestions.date, todayStr)),
    )
    .limit(1);
  if (existing[0]) return { skipped: true, userId, reason: "Already exists" };

  const problems = await generateDailySuggestions(userId, settings);
  const modelUsed = resolveModel(lcProfile.geminiModel);
  await db.insert(leetcodeAiSuggestions).values({
    userId,
    date: todayStr,
    problems,
    modelUsed,
    status: "pending",
  });

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (prefs?.notificationsEnabled && prefs.leetcodeEmailEnabled) {
    const email = await getUserEmail(userId);
    if (email) {
      await sendEmailNotification({ ...formatSuggestionEmail(problems), to: email });
    }
  }

  await db.insert(notificationLogs).values({
    userId,
    module: "leetcode",
    type: "daily_suggest",
    date: todayStr,
    payload: { problems },
  });

  return { success: true, userId, count: problems.length };
}

export async function runMissedDayForUser(userId: string) {
  const lcProfile = await getLeetcodeProfile(userId);
  const profile = await getProfile(userId);
  if (!lcProfile || !profile) throw new Error("Profile not found");

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (!isWithinNotificationWindow(profile.timezone, prefs?.notificationHour ?? 21)) {
    return { skipped: true, userId, reason: "Outside window" };
  }
  if (!prefs?.notificationsEnabled || !prefs?.leetcodeEmailEnabled) {
    return { skipped: true, userId, reason: "Notifications disabled" };
  }

  const todayStr = formatDate(getTodayDateInTimezone(profile.timezone));
  const recentAc = await getRecentAcSubmission({ username: lcProfile.leetcodeUsername, limit: 20 });
  const solvedToday = countSubmissionsToday(recentAc.submission, profile.timezone);
  if (solvedToday > 0) return { skipped: true, userId, reason: "Already solved" };

  const alreadySent = await db
    .select()
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.userId, userId),
        eq(notificationLogs.date, todayStr),
        eq(notificationLogs.type, "missed_day"),
        eq(notificationLogs.module, "leetcode"),
      ),
    )
    .limit(1);
  if (alreadySent[0]) return { skipped: true, userId, reason: "Already sent" };

  const [snapshot] = await db
    .select()
    .from(leetcodeDailySnapshots)
    .where(
      and(eq(leetcodeDailySnapshots.userId, userId), eq(leetcodeDailySnapshots.date, todayStr)),
    )
    .limit(1);
  const calendar = await getSubmissionCalendar({
    username: lcProfile.leetcodeUsername,
    year: new Date().getFullYear(),
  });
  const streak = snapshot?.streak ?? calendar.streak;

  const [suggestion] = await db
    .select()
    .from(leetcodeAiSuggestions)
    .where(
      and(eq(leetcodeAiSuggestions.userId, userId), eq(leetcodeAiSuggestions.date, todayStr)),
    )
    .limit(1);
  const problems = (suggestion?.problems as SuggestedProblem[] | null) ?? [];

  const email = await getUserEmail(userId);
  if (email) {
    await sendEmailNotification({
      ...formatMissedDayEmail(
        streak,
        problems.map((p) => ({ title: p.title, leetcodeUrl: p.leetcodeUrl })),
      ),
      to: email,
    });
  }

  await db.insert(notificationLogs).values({
    userId,
    module: "leetcode",
    type: "missed_day",
    date: todayStr,
    payload: { streak, solvedToday },
  });

  return { success: true, userId, streak };
}

export async function runSuggestCron() {
  const users = await listUsersWithLeetcodeProfiles();
  const results = [];
  for (const user of users) {
    try {
      results.push(await runSuggestForUser(user.userId));
    } catch (error) {
      results.push({ userId: user.userId, error: error instanceof Error ? error.message : "Failed" });
    }
  }
  return { processed: results.length, results };
}

export async function runMissedDayCron() {
  const users = await listUsersWithLeetcodeProfiles();
  const results = [];
  for (const user of users) {
    try {
      results.push(await runMissedDayForUser(user.userId));
    } catch (error) {
      results.push({ userId: user.userId, error: error instanceof Error ? error.message : "Failed" });
    }
  }
  return { processed: results.length, results };
}

export async function runSuggestForUserManual(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) throw new Error("Profile not found");
  const todayStr = formatDate(getTodayDateInTimezone(profile.timezone));
  await db
    .delete(leetcodeAiSuggestions)
    .where(
      and(eq(leetcodeAiSuggestions.userId, userId), eq(leetcodeAiSuggestions.date, todayStr)),
    );
  return runSuggestForUser(userId);
}
