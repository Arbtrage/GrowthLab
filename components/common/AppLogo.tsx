import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  href?: string;
  showText?: boolean;
  size?: "sm" | "md" | number;
  className?: string;
};

const SIZE_MAP = {
  sm: 20,
  md: 32,
} as const;

function resolveLogoSize(size: AppLogoProps["size"]) {
  if (typeof size === "number") return size;
  return SIZE_MAP[size ?? "sm"];
}

export function AppLogo({
  href,
  showText = true,
  size = "sm",
  className,
}: AppLogoProps) {
  const px = resolveLogoSize(size);

  const content = (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <Image
        src="/logo.svg"
        alt=""
        width={px}
        height={px}
        className="shrink-0 rounded-md"
        aria-hidden
        priority
      />
      {showText ? <span>GrowthLab</span> : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
