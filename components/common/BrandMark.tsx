import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  tagline?: string;
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
};

export function BrandMark({
  href = "/dashboard",
  tagline = "Your learning platform",
  showTagline = true,
  className,
  onClick,
}: BrandMarkProps) {
  const content = (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Image
        src="/logo.svg"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-lg shadow-elegant"
        aria-hidden
        priority
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold tracking-tight">GrowthLab</span>
        {showTagline && tagline ? (
          <span className="block truncate text-[11px] text-muted-foreground">{tagline}</span>
        ) : null}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex min-w-0 hover:opacity-90" onClick={onClick}>
        {content}
      </Link>
    );
  }

  return content;
}
