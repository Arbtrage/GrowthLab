"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateGoalDialog } from "@/features/goals/CreateGoalDialog";
import { GoalCard, type GoalItem } from "@/features/goals/GoalCard";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function GoalsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to load goals");
      return res.json() as Promise<{ goals: GoalItem[] }>;
    },
  });

  const recomputeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/goals/recompute", { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["global-dashboard"] });
    },
  });

  const goals = data?.goals ?? [];
  const activeGoals = goals.filter((g) => g.isActive);
  const pastGoals = goals.filter((g) => !g.isActive);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Could not load goals.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Goals</h1>
          <p className="text-muted-foreground">
            Daily and weekly targets across LeetCode, System Design, and global activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => recomputeMutation.mutate()}
            disabled={recomputeMutation.isPending}
          >
            <RefreshCw className={cn("mr-1 size-4", recomputeMutation.isPending && "animate-spin")} />
            Refresh
          </Button>
          <CreateGoalDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" />
                New goal
              </Button>
            }
          />
        </div>
      </div>

      {activeGoals.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No active goals yet.</p>
          <CreateGoalDialog
            trigger={
              <button type="button" className={cn(buttonVariants({ variant: "link" }), "mt-2")}>
                Set your first goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Active</h2>
          {activeGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {pastGoals.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Past</h2>
          {pastGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
