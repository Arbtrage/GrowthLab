import Image from "next/image";
import { cn } from "@/lib/utils";

type CoachAvatarProps = {
  className?: string;
  size?: number;
};

export function CoachAvatar({ className, size = 28 }: CoachAvatarProps) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-lg border border-border bg-card",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.svg"
        alt=""
        width={Math.round(size * 0.55)}
        height={Math.round(size * 0.55)}
        className="rounded-sm"
        aria-hidden
      />
    </div>
  );
}
