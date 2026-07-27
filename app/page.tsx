import Link from "next/link";
import { redirect } from "next/navigation";
import { AppLogo } from "@/components/common/AppLogo";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <div className="mb-6 flex justify-center">
          <AppLogo size="md" showText={false} />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">GrowthLab</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your personal learning platform — LeetCode progress, system design practice, and growth
          tracking in one dashboard.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-lg border px-6 text-sm font-medium"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
