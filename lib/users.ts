import { eq } from "drizzle-orm";
import { db, leetcodeProfiles, profiles, userPreferences } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function getProfile(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  return profile ?? null;
}

export async function getLeetcodeProfile(userId: string) {
  const [lp] = await db
    .select()
    .from(leetcodeProfiles)
    .where(eq(leetcodeProfiles.userId, userId))
    .limit(1);
  return lp ?? null;
}

export async function getUserPreferences(userId: string) {
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return prefs ?? null;
}

export async function listUsersWithLeetcodeProfiles() {
  return db
    .select({
      userId: leetcodeProfiles.userId,
      leetcodeUsername: leetcodeProfiles.leetcodeUsername,
      dailyGoal: leetcodeProfiles.dailyGoal,
      difficultyPref: leetcodeProfiles.difficultyPref,
      tagsFocus: leetcodeProfiles.tagsFocus,
      geminiModel: leetcodeProfiles.geminiModel,
      timezone: profiles.timezone,
    })
    .from(leetcodeProfiles)
    .innerJoin(profiles, eq(profiles.id, leetcodeProfiles.userId));
}
