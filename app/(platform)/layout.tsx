import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/users";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);

  return (
    <PlatformShell
      userName={profile?.name ?? user.email}
      userEmail={user.email}
      avatarUrl={profile?.avatarUrl}
    >
      {children}
    </PlatformShell>
  );
}
