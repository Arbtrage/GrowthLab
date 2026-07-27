"use client";

import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalProgressBar } from "@/features/goals/GoalProgressBar";
import { getMetricConfig } from "@/lib/goals/metrics";

export type GoalItem = {
  id: string;
  module: string;
  type: string;
  metricKey: string;
  targetValue: number;
  achievedValue: number;
  periodStart: string;
  periodEnd: string;
  isActive: boolean;
  progressPercent: number;
};

type GoalCardProps = {
  goal: GoalItem;
};

export function GoalCard({ goal }: GoalCardProps) {
  const queryClient = useQueryClient();
  const metric = getMetricConfig(goal.metricKey);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["global-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });

  const complete = goal.achievedValue >= goal.targetValue;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{metric?.label ?? goal.metricKey}</CardTitle>
            <CardDescription>
              {goal.type} · {goal.module.replace("-", " ")} · {goal.periodStart} → {goal.periodEnd}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {complete ? (
              <Badge className="bg-success/10 text-success border-success/20">Complete</Badge>
            ) : goal.isActive ? (
              <Badge variant="secondary">In progress</Badge>
            ) : (
              <Badge variant="outline">Expired</Badge>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              aria-label="Delete goal"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <GoalProgressBar
          label="Progress"
          achievedValue={goal.achievedValue}
          targetValue={goal.targetValue}
          progressPercent={goal.progressPercent}
        />
      </CardContent>
    </Card>
  );
}
