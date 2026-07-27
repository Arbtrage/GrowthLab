import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type GenerationStatusState = "idle" | "loading" | "success" | "error";

type GenerationStatusProps = {
  status: GenerationStatusState;
  label?: string;
  className?: string;
};

const STATUS_CONFIG: Record<
  GenerationStatusState,
  { icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "destructive" | "outline"; text: string }
> = {
  idle: { icon: Circle, variant: "outline", text: "Ready" },
  loading: { icon: Loader2, variant: "secondary", text: "Generating…" },
  success: { icon: CheckCircle2, variant: "default", text: "Done" },
  error: { icon: XCircle, variant: "destructive", text: "Failed" },
};

export function GenerationStatus({ status, label, className }: GenerationStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)}>
      <Icon className={cn("size-3", status === "loading" && "animate-spin")} />
      {label ?? config.text}
    </Badge>
  );
}
