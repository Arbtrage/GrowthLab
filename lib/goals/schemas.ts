import { z } from "zod";

export const createGoalSchema = z.object({
  module: z.enum(["leetcode", "system-design", "global"]),
  type: z.enum(["daily", "weekly"]),
  metricKey: z.string().min(1),
  targetValue: z.number().int().min(1).max(1000),
});

export const updateGoalSchema = z.object({
  targetValue: z.number().int().min(1).max(1000),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
