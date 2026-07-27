import { tool } from "ai";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  learningGoals,
  leetcodeAiSuggestions,
  sdPracticeEditions,
  sdPracticeSubmissions,
  sdSubmissions,
  sdEditions,
} from "@/lib/db";
import { getDashboardData } from "@/lib/leetcode/sync";
import { runSuggestForUserManual } from "@/lib/leetcode/suggest";
import { generatePracticeEdition } from "@/lib/system-design/practice";
import { getProfile, getUserPreferences } from "@/lib/users";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import { getMetricConfig } from "@/lib/goals/metrics";
import { getTodayDateInTimezone } from "@/lib/timezone";
import { getMemoryPort } from "@/lib/ai/memory";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function createChatTools(userId: string) {
  return {
    getUserProfile: tool({
      description: "Get the user's profile, timezone, and notification preferences.",
      inputSchema: z.object({}),
      execute: async () => {
        const [profile, prefs] = await Promise.all([
          getProfile(userId),
          getUserPreferences(userId),
        ]);
        return {
          name: profile?.name ?? null,
          timezone: profile?.timezone ?? "Asia/Kolkata",
          notificationsEnabled: prefs?.notificationsEnabled ?? true,
          leetcodeEmailEnabled: prefs?.leetcodeEmailEnabled ?? true,
          sysdesignEmailEnabled: prefs?.sysdesignEmailEnabled ?? true,
        };
      },
    }),

    getLeetcodeProgress: tool({
      description:
        "Get LeetCode stats including total solved, streak, ranking, difficulty breakdown, and recent submissions.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const data = await getDashboardData(userId);
          return {
            username: data.profileSettings.leetcodeUsername,
            totalSolved: data.profile.totalSolved,
            streak: data.calendar.streak,
            ranking: data.profile.ranking,
            solvedToday: data.solvedToday,
            easySolved: data.profile.easySolved,
            mediumSolved: data.profile.mediumSolved,
            hardSolved: data.profile.hardSolved,
            recentSubmissions: data.recentSubmissions.slice(0, 5).map((s) => ({
              title: s.title,
              lang: s.lang,
            })),
          };
        } catch (error) {
          return {
            error: error instanceof Error ? error.message : "LeetCode profile not configured",
            link: "/settings",
          };
        }
      },
    }),

    getTodayLeetcodeSuggestions: tool({
      description: "Get today's AI-generated LeetCode problem suggestions for the user.",
      inputSchema: z.object({}),
      execute: async () => {
        const profile = await getProfile(userId);
        const todayStr = formatDate(getTodayDateInTimezone(profile?.timezone ?? "Asia/Kolkata"));
        const [row] = await db
          .select()
          .from(leetcodeAiSuggestions)
          .where(
            and(
              eq(leetcodeAiSuggestions.userId, userId),
              eq(leetcodeAiSuggestions.date, todayStr),
            ),
          )
          .limit(1);

        if (!row) {
          return { date: todayStr, suggestions: [], status: "none", link: "/leetcode" };
        }

        return {
          date: todayStr,
          status: row.status,
          problems: row.problems,
          link: "/leetcode",
        };
      },
    }),

    generateLeetcodeSuggestions: tool({
      description:
        "Generate fresh LeetCode problem suggestions for today based on the user's weak areas.",
      inputSchema: z.object({}),
      execute: async () => {
        const result = await runSuggestForUserManual(userId);
        const profile = await getProfile(userId);
        const todayStr = formatDate(getTodayDateInTimezone(profile?.timezone ?? "Asia/Kolkata"));
        const [row] = await db
          .select()
          .from(leetcodeAiSuggestions)
          .where(
            and(
              eq(leetcodeAiSuggestions.userId, userId),
              eq(leetcodeAiSuggestions.date, todayStr),
            ),
          )
          .limit(1);

        return {
          success: "success" in result,
          summary: `Generated ${row?.problems ? (row.problems as unknown[]).length : 0} suggestions for today.`,
          problems: row?.problems ?? [],
          link: "/leetcode",
        };
      },
    }),

    getSystemDesignHistory: tool({
      description: "Get recent system design submissions from daily editions and personal practice.",
      inputSchema: z.object({}),
      execute: async () => {
        const daily = await db
          .select({
            title: sdEditions.title,
            topic: sdEditions.topic,
            slot: sdEditions.slot,
            submittedAt: sdSubmissions.submittedAt,
          })
          .from(sdSubmissions)
          .innerJoin(sdEditions, eq(sdSubmissions.editionId, sdEditions.id))
          .where(eq(sdSubmissions.userId, userId))
          .orderBy(desc(sdSubmissions.submittedAt))
          .limit(5);

        const practice = await db
          .select({
            title: sdPracticeEditions.title,
            topic: sdPracticeEditions.topic,
            slot: sdPracticeEditions.slot,
            submittedAt: sdPracticeSubmissions.submittedAt,
          })
          .from(sdPracticeSubmissions)
          .innerJoin(
            sdPracticeEditions,
            eq(sdPracticeSubmissions.practiceEditionId, sdPracticeEditions.id),
          )
          .where(eq(sdPracticeSubmissions.userId, userId))
          .orderBy(desc(sdPracticeSubmissions.submittedAt))
          .limit(5);

        return { dailyEditions: daily, practiceSessions: practice };
      },
    }),

    generatePracticeQuestion: tool({
      description: "Generate a personal system design practice question for the user.",
      inputSchema: z.object({
        slot: z
          .enum(["am", "pm"])
          .optional()
          .describe("am for warm-up, pm for full design. Defaults to pm."),
      }),
      execute: async ({ slot }) => {
        const result = await generatePracticeEdition(userId, { slot: slot ?? "pm" });
        return {
          success: true,
          summary: `Generated "${result.title}" on ${result.topic}.`,
          id: result.id,
          link: `/system-design/practice/${result.id}`,
        };
      },
    }),

    getLearningGoals: tool({
      description: "Get the user's active learning goals.",
      inputSchema: z.object({}),
      execute: async () => {
        await recomputeAllActiveGoals(userId);

        const profile = await getProfile(userId);
        const todayStr = formatDate(
          getTodayDateInTimezone(profile?.timezone ?? "Asia/Kolkata"),
        );

        const goals = await db
          .select()
          .from(learningGoals)
          .where(eq(learningGoals.userId, userId))
          .orderBy(desc(learningGoals.createdAt))
          .limit(10);

        const activeGoals = goals.filter((g) => g.periodEnd >= todayStr);

        return {
          goals: activeGoals.map((g) => ({
            module: g.module,
            type: g.type,
            metricKey: g.metricKey,
            label: getMetricConfig(g.metricKey)?.label ?? g.metricKey,
            targetValue: g.targetValue,
            achievedValue: g.achievedValue,
            progressPercent: Math.min(
              100,
              Math.round((g.achievedValue / Math.max(g.targetValue, 1)) * 100),
            ),
            periodStart: g.periodStart,
            periodEnd: g.periodEnd,
          })),
          link: "/goals",
        };
      },
    }),

    saveEpisodicMemory: tool({
      description: `Save a durable fact about the user to long-term episodic memory.
Call ONLY when the user shares something worth remembering across future sessions:
learning preferences, recurring weak areas, interview timeline, goals, constraints,
communication style, or explicit "remember this". Do NOT call for transient chat.`,
      inputSchema: z.object({
        content: z
          .string()
          .describe(
            "Concise third-person memory, e.g. 'User prefers visual diagrams for system design'",
          ),
        reason: z.string().optional().describe("Why this is worth storing"),
      }),
      execute: async ({ content, reason }) => {
        const memory = getMemoryPort();
        if (!memory.enabled) {
          return { saved: false, reason: "Mem0 not configured" };
        }
        await memory.add({
          userId,
          agentId: "coach",
          kind: "episodic",
          messages: [{ role: "user", content }],
          metadata: reason ? { reason } : undefined,
        });
        return { saved: true, summary: content };
      },
    }),
  };
}

export type ChatTools = ReturnType<typeof createChatTools>;
