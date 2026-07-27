"use client";

import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type GoalProgressBarProps = {
  label: string;
  achievedValue: number;
  targetValue: number;
  progressPercent: number;
  className?: string;
};

export function GoalProgressBar({
  label,
  achievedValue,
  targetValue,
  progressPercent,
  className,
}: GoalProgressBarProps) {
  const complete = progressPercent >= 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {achievedValue}/{targetValue}
        </span>
      </div>
      <Progress value={progressPercent}>
        <ProgressTrack className="h-2">
          <ProgressIndicator
            className={cn(complete && "bg-success")}
          />
        </ProgressTrack>
      </Progress>
    </div>
  );
}
