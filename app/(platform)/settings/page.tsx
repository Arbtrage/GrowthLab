import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { SettingsForms } from "@/components/settings/SettingsForms";
import { Button } from "@/components/ui/button";
import { DEFAULT_GEMINI_MODEL, isGemini3LiteModel } from "@/lib/ai/config";
import { db, leetcodeProfiles, profiles, userPreferences } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);
  const [lcProfile] = await db
    .select()
    .from(leetcodeProfiles)
    .where(eq(leetcodeProfiles.userId, user.id))
    .limit(1);

  const selectedModel =
    lcProfile?.geminiModel && isGemini3LiteModel(lcProfile.geminiModel)
      ? lcProfile.geminiModel
      : DEFAULT_GEMINI_MODEL;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">Profile, notifications, and module preferences</p>
      </div>

      <SettingsForms
        email={user.email ?? ""}
        profile={{
          name: profile?.name ?? "",
          timezone: profile?.timezone ?? "Asia/Kolkata",
        }}
        prefs={{
          notificationHour: prefs?.notificationHour ?? 21,
          notificationsEnabled: prefs?.notificationsEnabled ?? true,
          leetcodeEmailEnabled: prefs?.leetcodeEmailEnabled ?? true,
          sysdesignEmailEnabled: prefs?.sysdesignEmailEnabled ?? true,
        }}
        leetcode={{
          username: lcProfile?.leetcodeUsername ?? "",
          dailyGoal: lcProfile?.dailyGoal ?? 2,
          difficultyPref: lcProfile?.difficultyPref ?? "mixed",
          geminiModel: selectedModel,
        }}
      />

      <form action={signOutAction}>
        <Button type="submit" variant="destructive">
          Sign out
        </Button>
      </form>
    </div>
  );
}
