"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GOAL_METRICS,
  getMetricsForModule,
  type GoalModuleKey,
  type GoalTypeKey,
} from "@/lib/goals/metrics";

const PRESETS = [
  {
    label: "Solve 2 LeetCode problems daily",
    module: "leetcode" as GoalModuleKey,
    type: "daily" as GoalTypeKey,
    metricKey: "leetcode_problems_solved",
    targetValue: 2,
  },
  {
    label: "Complete 1 SD edition daily",
    module: "system-design" as GoalModuleKey,
    type: "daily" as GoalTypeKey,
    metricKey: "sd_editions_completed",
    targetValue: 1,
  },
  {
    label: "3 active days per week",
    module: "global" as GoalModuleKey,
    type: "weekly" as GoalTypeKey,
    metricKey: "global_active_days",
    targetValue: 3,
  },
];

type CreateGoalDialogProps = {
  trigger: React.ReactElement;
};

export function CreateGoalDialog({ trigger }: CreateGoalDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [module, setModule] = useState<GoalModuleKey>("leetcode");
  const [type, setType] = useState<GoalTypeKey>("daily");
  const [metricKey, setMetricKey] = useState("leetcode_problems_solved");
  const [targetValue, setTargetValue] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const moduleMetrics = getMetricsForModule(module).filter((m) =>
    m.supportedTypes.includes(type),
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, type, metricKey, targetValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create goal");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["global-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      setOpen(false);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setModule(preset.module);
    setType(preset.type);
    setMetricKey(preset.metricKey);
    setTargetValue(preset.targetValue);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create goal</DialogTitle>
          <DialogDescription>
            Set a daily or weekly target. Weekly periods run Monday–Sunday in your timezone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-lg border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goal-module">Module</Label>
              <select
                id="goal-module"
                value={module}
                onChange={(e) => {
                  const nextModule = e.target.value as GoalModuleKey;
                  setModule(nextModule);
                  const metrics = getMetricsForModule(nextModule).filter((m) =>
                    m.supportedTypes.includes(type),
                  );
                  if (metrics[0]) setMetricKey(metrics[0].metricKey);
                }}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="leetcode">LeetCode</option>
                <option value="system-design">System Design</option>
                <option value="global">Global</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-type">Type</Label>
              <select
                id="goal-type"
                value={type}
                onChange={(e) => {
                  const nextType = e.target.value as GoalTypeKey;
                  setType(nextType);
                  const metrics = getMetricsForModule(module).filter((m) =>
                    m.supportedTypes.includes(nextType),
                  );
                  if (metrics[0]) setMetricKey(metrics[0].metricKey);
                }}
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-metric">Metric</Label>
            <select
              id="goal-metric"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              {moduleMetrics.map((metric) => (
                <option key={metric.metricKey} value={metric.metricKey}>
                  {metric.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {GOAL_METRICS.find((m) => m.metricKey === metricKey)?.description}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-target">Target</Label>
            <Input
              id="goal-target"
              type="number"
              min={1}
              max={1000}
              value={targetValue}
              onChange={(e) => setTargetValue(Number.parseInt(e.target.value, 10) || 1)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <LoadingButton
            className="w-full"
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Create goal
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
