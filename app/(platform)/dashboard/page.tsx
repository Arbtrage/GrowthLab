import { eq } from "drizzle-orm";
import { SetupBanner } from "@/components/onboarding/SetupBanner";
import { GlobalDashboard } from "@/features/dashboard/GlobalDashboard";
import { db, leetcodeProfiles } from "@/lib/db";
import { requireUser } from "@/lib/users";

export default async function DashboardPage() {
  const user = await requireUser();
  const [lcProfile] = await db
    .select()
    .from(leetcodeProfiles)
    .where(eq(leetcodeProfiles.userId, user.id))
    .limit(1);

  const hasLeetcodeProfile = Boolean(lcProfile?.leetcodeUsername?.trim());

  return (
    <div className="space-y-6">
      <SetupBanner hasLeetcodeProfile={hasLeetcodeProfile} />
      <GlobalDashboard />
    </div>
  );
}
