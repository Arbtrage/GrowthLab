"use client";

import { toast } from "sonner";
import { updateLeetcodeSettings, updateProfileSettings } from "@/app/actions";
import { AI_MODELS } from "@/lib/ai/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
];

type SettingsFormsProps = {
  email: string;
  profile: {
    name: string;
    timezone: string;
  };
  prefs: {
    notificationHour: number;
    notificationsEnabled: boolean;
    leetcodeEmailEnabled: boolean;
    sysdesignEmailEnabled: boolean;
  };
  leetcode: {
    username: string;
    dailyGoal: number;
    difficultyPref: string;
    geminiModel: string;
  };
};

export function SettingsForms({ email, profile, prefs, leetcode }: SettingsFormsProps) {
  async function handleProfileSubmit(formData: FormData) {
    try {
      await updateProfileSettings(formData);
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    }
  }

  async function handleLeetcodeSubmit(formData: FormData) {
    try {
      await updateLeetcodeSettings(formData);
      toast.success("LeetCode settings saved — run a sync from the LeetCode overview");
    } catch {
      toast.error("Failed to save LeetCode settings");
    }
  }

  async function handlePasswordReset() {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset email sent");
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={profile.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={profile.timezone}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notificationHour">Notification hour (local)</Label>
              <Input
                id="notificationHour"
                name="notificationHour"
                type="number"
                min={0}
                max={23}
                defaultValue={prefs.notificationHour}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notificationsEnabled"
                name="notificationsEnabled"
                defaultChecked={prefs.notificationsEnabled}
                className="size-4 rounded border"
              />
              <Label htmlFor="notificationsEnabled">Email notifications</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="leetcodeEmailEnabled"
                name="leetcodeEmailEnabled"
                defaultChecked={prefs.leetcodeEmailEnabled}
                className="size-4 rounded border"
              />
              <Label htmlFor="leetcodeEmailEnabled">LeetCode emails</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sysdesignEmailEnabled"
                name="sysdesignEmailEnabled"
                defaultChecked={prefs.sysdesignEmailEnabled}
                className="size-4 rounded border"
              />
              <Label htmlFor="sysdesignEmailEnabled">System Design emails</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Save profile</Button>
              <Button type="button" variant="outline" onClick={() => void handlePasswordReset()}>
                Forgot password?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LeetCode</CardTitle>
          <CardDescription>Sync and AI suggestion preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleLeetcodeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leetcodeUsername">LeetCode username</Label>
              <Input
                id="leetcodeUsername"
                name="leetcodeUsername"
                defaultValue={leetcode.username}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyGoal">Daily goal</Label>
              <Input
                id="dailyGoal"
                name="dailyGoal"
                type="number"
                min={1}
                max={10}
                defaultValue={leetcode.dailyGoal}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficultyPref">Difficulty preference</Label>
              <select
                id="difficultyPref"
                name="difficultyPref"
                defaultValue={leetcode.difficultyPref}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="geminiModel">Gemini model</Label>
              <select
                id="geminiModel"
                name="geminiModel"
                defaultValue={leetcode.geminiModel}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                {AI_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">Save LeetCode settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
