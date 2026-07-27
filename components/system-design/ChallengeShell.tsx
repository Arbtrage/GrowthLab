import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ChallengeShellProps = {
  breadcrumb: string;
  title?: string;
  promptPanel: React.ReactNode;
  workPanel: React.ReactNode;
  className?: string;
};

export function ChallengeShell({
  breadcrumb,
  title,
  promptPanel,
  workPanel,
  className,
}: ChallengeShellProps) {
  return (
    <div className={cn("mx-auto max-w-6xl space-y-6", className)}>
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/system-design" className="hover:text-foreground">
          Today
        </Link>
        <ChevronRight className="size-4" />
        <span className="text-foreground">{breadcrumb}</span>
      </nav>
      {title ? <h2 className="text-lg font-medium">{title}</h2> : null}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="lg:sticky lg:top-6 lg:self-start">{promptPanel}</div>
        <div className="min-w-0">{workPanel}</div>
      </div>
    </div>
  );
}
