import { activityEvents, db } from "@/lib/db";

export type ActivityModule = "leetcode" | "system-design" | "global";

export type ActivityEventType =
  | "problem_solved"
  | "sync_completed"
  | "suggestion_completed"
  | "suggestion_skipped"
  | "edition_submitted"
  | "practice_submitted"
  | "feedback_received"
  | "goal_achieved";

export async function recordActivityEvent(params: {
  userId: string;
  module: ActivityModule;
  eventType: ActivityEventType;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}): Promise<void> {
  try {
    await db.insert(activityEvents).values({
      userId: params.userId,
      module: params.module,
      eventType: params.eventType,
      metadata: params.metadata ?? null,
      occurredAt: params.occurredAt ?? new Date(),
    });
  } catch (error) {
    console.error("Failed to record activity event:", error);
  }
}
