"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  db,
  leetcodeAiSuggestions,
  leetcodeProfiles,
  profiles,
  userPreferences,
} from "@/lib/db";
import { syncLeetCodeStats } from "@/lib/leetcode/sync";
import { DEFAULT_GEMINI_MODEL, isGemini3LiteModel } from "@/lib/ai/config";
import { recordActivityEvent } from "@/lib/activity/events";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import { runSuggestForUserManual } from "@/lib/leetcode/suggest";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/users";
import { getTodayDateInTimezone } from "@/lib/timezone";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function markSuggestionCompleted(slug: string): Promise<void> {
  await updateSuggestionStatus("completed", slug);
}

export async function markSuggestionSkipped(slug: string): Promise<void> {
  await updateSuggestionStatus("skipped", slug);
}

async function updateSuggestionStatus(
  status: "completed" | "skipped",
  slug: string,
): Promise<void> {
  const userId = await getCurrentUserId();
  const profile = await getProfile(userId);
  if (!profile) return;
  const todayStr = formatDate(getTodayDateInTimezone(profile.timezone));

  await db
    .update(leetcodeAiSuggestions)
    .set({ status })
    .where(
      and(eq(leetcodeAiSuggestions.userId, userId), eq(leetcodeAiSuggestions.date, todayStr)),
    );

  await recordActivityEvent({
    userId,
    module: "leetcode",
    eventType: status === "completed" ? "suggestion_completed" : "suggestion_skipped",
    metadata: { slug },
  });

  await recomputeAllActiveGoals(userId);

  revalidatePath("/leetcode");
  revalidatePath("/leetcode/suggestions");
  revalidatePath("/dashboard");
  revalidatePath("/goals");
  revalidatePath("/analytics");
}

export async function regenerateSuggestions(): Promise<void> {
  const userId = await getCurrentUserId();
  await runSuggestForUserManual(userId);
  revalidatePath("/leetcode");
  revalidatePath("/dashboard");
}

export async function updateLeetcodeSettings(formData: FormData): Promise<void> {
  const userId = await getCurrentUserId();
  const leetcodeUsername = String(formData.get("leetcodeUsername") ?? "").trim();
  const dailyGoal = Number.parseInt(String(formData.get("dailyGoal") ?? "2"), 10);
  const difficultyPref = String(formData.get("difficultyPref") ?? "mixed");
  const rawModel = String(formData.get("geminiModel") ?? "");
  const geminiModel = isGemini3LiteModel(rawModel) ? rawModel : DEFAULT_GEMINI_MODEL;

  if (!leetcodeUsername) return;

  const existing = await db
    .select()
    .from(leetcodeProfiles)
    .where(eq(leetcodeProfiles.userId, userId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(leetcodeProfiles)
      .set({ leetcodeUsername, dailyGoal, difficultyPref, geminiModel })
      .where(eq(leetcodeProfiles.userId, userId));
  } else {
    await db.insert(leetcodeProfiles).values({
      userId,
      leetcodeUsername,
      dailyGoal,
      difficultyPref,
      geminiModel,
    });
  }

  revalidatePath("/settings");
  revalidatePath("/leetcode");
}

export async function updateProfileSettings(formData: FormData): Promise<void> {
  const userId = await getCurrentUserId();
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Asia/Kolkata");
  const notificationHour = Number.parseInt(String(formData.get("notificationHour") ?? "21"), 10);
  const notificationsEnabled = formData.get("notificationsEnabled") === "on";
  const leetcodeEmailEnabled = formData.get("leetcodeEmailEnabled") === "on";
  const sysdesignEmailEnabled = formData.get("sysdesignEmailEnabled") === "on";

  await db.update(profiles).set({ name: name || null, timezone }).where(eq(profiles.id, userId));

  await db
    .update(userPreferences)
    .set({
      notificationHour,
      notificationsEnabled,
      leetcodeEmailEnabled,
      sysdesignEmailEnabled,
    })
    .where(eq(userPreferences.userId, userId));

  revalidatePath("/settings");
}

export async function syncLeetCodeNow(): Promise<void> {
  const userId = await getCurrentUserId();
  await syncLeetCodeStats(userId);
  revalidatePath("/leetcode");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
