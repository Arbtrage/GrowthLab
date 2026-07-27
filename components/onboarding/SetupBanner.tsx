import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SetupBannerProps = {
  hasLeetcodeProfile: boolean;
};

export function SetupBanner({ hasLeetcodeProfile }: SetupBannerProps) {
  if (hasLeetcodeProfile) return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <AlertCircle className="size-5 shrink-0 text-warning" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-medium">Finish setting up GrowthLab</p>
          <ul className="list-inside list-disc text-sm text-muted-foreground">
            <li>Add your LeetCode username in Settings</li>
            <li>Configure notification preferences</li>
            <li>Try the AI coach for personalized suggestions</li>
          </ul>
          <Link href="/settings" className={cn(buttonVariants({ size: "sm" }), "mt-2")}>
            Go to Settings
            <ArrowRight className="ml-1.5 size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
