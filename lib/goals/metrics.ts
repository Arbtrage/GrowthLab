export type GoalModuleKey = "leetcode" | "system-design" | "global";
export type GoalTypeKey = "daily" | "weekly";

export type GoalMetricConfig = {
  metricKey: string;
  label: string;
  module: GoalModuleKey;
  supportedTypes: GoalTypeKey[];
  description: string;
};

export const GOAL_METRICS: GoalMetricConfig[] = [
  {
    metricKey: "leetcode_problems_solved",
    label: "Problems solved",
    module: "leetcode",
    supportedTypes: ["daily", "weekly"],
    description: "LeetCode problems solved in the period",
  },
  {
    metricKey: "leetcode_daily_suggestions_done",
    label: "AI suggestions completed",
    module: "leetcode",
    supportedTypes: ["daily", "weekly"],
    description: "Daily suggestion lists marked complete",
  },
  {
    metricKey: "sd_editions_completed",
    label: "Editions completed",
    module: "system-design",
    supportedTypes: ["daily", "weekly"],
    description: "Daily and practice system design submissions",
  },
  {
    metricKey: "sd_avg_score",
    label: "Average SD score",
    module: "system-design",
    supportedTypes: ["weekly"],
    description: "Average feedback score across submissions",
  },
  {
    metricKey: "global_active_days",
    label: "Active days",
    module: "global",
    supportedTypes: ["weekly"],
    description: "Days with at least one learning activity",
  },
  {
    metricKey: "global_total_events",
    label: "Total activities",
    module: "global",
    supportedTypes: ["daily", "weekly"],
    description: "All tracked learning events in the period",
  },
];

export function isValidMetricKey(metricKey: string): boolean {
  return GOAL_METRICS.some((m) => m.metricKey === metricKey);
}

export function getMetricConfig(metricKey: string): GoalMetricConfig | undefined {
  return GOAL_METRICS.find((m) => m.metricKey === metricKey);
}

export function getMetricsForModule(module: GoalModuleKey): GoalMetricConfig[] {
  return GOAL_METRICS.filter((m) => m.module === module);
}
