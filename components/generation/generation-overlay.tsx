import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GenerationOverlayProps = {
  label: string;
  className?: string;
};

export function GenerationOverlay({ label, className }: GenerationOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-sm",
        className,
      )}
    >
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-foreground">{label}</p>
    </div>
  );
}
