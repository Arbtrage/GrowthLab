import { and, desc, eq, gte } from "drizzle-orm";
import { format, parseISO, startOfDay } from "date-fns";
import { generateFeedbackWithFallback } from "@/lib/ai/feedback";
import { planEdition, recordTopicUsage } from "@/lib/ai/planner";
import { writeAmEdition, writePmEdition } from "@/lib/ai/writer";
import { MODEL } from "@/lib/ai/client";
import {
  db,
  sdEditions,
  sdFeedback,
  sdGenerationLogs,
  sdSubmissions,
} from "@/lib/db";
import { recordActivityEvent } from "@/lib/activity/events";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import { sendEditionEmailsToUsers } from "@/lib/system-design/email";
import type { Edition, EditionSlot } from "@/lib/system-design/types";

export const MORNING_UTC_HOUR = 1;
export const MORNING_UTC_MINUTE = 30;
export const EVENING_UTC_HOUR = 13;
export const EVENING_UTC_MINUTE = 30;

export function formatEditionDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseEditionDate(dateStr: string): Date {
  return startOfDay(parseISO(dateStr));
}

export function slotFromParam(slot: string): EditionSlot | null {
  if (slot === "am") return "am";
  if (slot === "pm") return "pm";
  return null;
}

export function slotToParam(slot: EditionSlot): "am" | "pm" {
  return slot;
}

export function getEditionSchedule(now = new Date()) {
  const utcNow = new Date(now.toISOString());
  const today = startOfDay(utcNow);
  const morningRelease = new Date(today);
  morningRelease.setUTCHours(MORNING_UTC_HOUR, MORNING_UTC_MINUTE, 0, 0);
  const eveningRelease = new Date(today);
  eveningRelease.setUTCHours(EVENING_UTC_HOUR, EVENING_UTC_MINUTE, 0, 0);

  let activeSlot: EditionSlot;
  let nextRelease: Date;
  let nextSlot: EditionSlot;

  if (utcNow >= eveningRelease) {
    activeSlot = "pm";
    nextRelease = new Date(today);
    nextRelease.setUTCDate(nextRelease.getUTCDate() + 1);
    nextRelease.setUTCHours(MORNING_UTC_HOUR, MORNING_UTC_MINUTE, 0, 0);
    nextSlot = "am";
  } else if (utcNow >= morningRelease) {
    activeSlot = "am";
    nextRelease = eveningRelease;
    nextSlot = "pm";
  } else {
    activeSlot = "am";
    nextRelease = morningRelease;
    nextSlot = "am";
  }

  return { today, morningRelease, eveningRelease, activeSlot, nextRelease, nextSlot, isWaiting: utcNow < morningRelease };
}

export async function getEditionByDateSlot(date: Date, slot: EditionSlot) {
  const dateStr = formatEditionDate(date);
  const [edition] = await db
    .select()
    .from(sdEditions)
    .where(and(eq(sdEditions.date, dateStr), eq(sdEditions.slot, slot)))
    .limit(1);
  return edition ?? null;
}

export async function getActiveEditionPath(now = new Date()): Promise<string> {
  const schedule = getEditionSchedule(now);
  const dateStr = formatEditionDate(schedule.today);
  if (schedule.isWaiting) return "/system-design/waiting";
  const utcNow = new Date(now.toISOString());
  if (utcNow >= schedule.eveningRelease) return `/system-design/c/${dateStr}/pm`;
  return `/system-design/c/${dateStr}/am`;
}

export async function generateAndDeliverEdition(slot: "am" | "pm", date = new Date()) {
  const editionDate = startOfDay(date);
  const dateStr = formatEditionDate(editionDate);
  const editionSlot = slot;

  const [existing] = await db
    .select()
    .from(sdEditions)
    .where(and(eq(sdEditions.date, dateStr), eq(sdEditions.slot, slot)))
    .limit(1);

  if (existing) return { edition: existing, skipped: true, emailsSent: 0 };

  let amTopic: string | undefined;
  let pairedEditionId: string | undefined;

  if (slot === "pm") {
    const [amEdition] = await db
      .select()
      .from(sdEditions)
      .where(and(eq(sdEditions.date, dateStr), eq(sdEditions.slot, "am")))
      .limit(1);
    if (amEdition) {
      amTopic = amEdition.topic;
      pairedEditionId = amEdition.id;
    }
  }

  const plan = await planEdition({ slot, date: editionDate, amTopic });
  const editionContent =
    slot === "am" ? await writeAmEdition(plan) : await writePmEdition(plan);

  const [edition] = await db
    .insert(sdEditions)
    .values({
      date: dateStr,
      slot: editionSlot,
      topic: plan.topic,
      title: editionContent.title,
      prompt: editionContent.prompt,
      constraints: editionContent.constraints,
      tasks: editionContent.tasks,
      rubric: editionContent.rubric,
      followUpProbes:
        slot === "pm" && "followUpProbes" in editionContent
          ? editionContent.followUpProbes
          : [],
      referenceOutline: editionContent.referenceOutline,
      pairedEditionId,
    })
    .returning();

  await recordTopicUsage(plan.topic);
  await db.insert(sdGenerationLogs).values({
    editionId: edition.id,
    source: "daily",
    model: MODEL,
    status: "success",
    rawResponse: JSON.stringify(editionContent),
  });

  const emailsSent = await sendEditionEmailsToUsers({ slot, title: edition.title, date: dateStr });
  return { edition, skipped: false, emailsSent };
}

export async function submitEdition(params: {
  userId: string;
  editionId: string;
  sections: Record<string, string>;
  mermaidDiagram: string;
  excalidrawState: unknown;
}) {
  const [edition] = await db
    .select()
    .from(sdEditions)
    .where(eq(sdEditions.id, params.editionId))
    .limit(1);
  if (!edition) throw new Error("Edition not found");

  const existing = await db
    .select()
    .from(sdSubmissions)
    .where(
      and(eq(sdSubmissions.userId, params.userId), eq(sdSubmissions.editionId, params.editionId)),
    )
    .limit(1);

  let submission;
  if (existing[0]) {
    [submission] = await db
      .update(sdSubmissions)
      .set({
        sections: params.sections,
        mermaidDiagram: params.mermaidDiagram,
        excalidrawState: params.excalidrawState,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sdSubmissions.id, existing[0].id))
      .returning();
  } else {
    [submission] = await db
      .insert(sdSubmissions)
      .values({
        userId: params.userId,
        editionId: params.editionId,
        sections: params.sections,
        mermaidDiagram: params.mermaidDiagram,
        excalidrawState: params.excalidrawState,
        submittedAt: new Date(),
      })
      .returning();
  }

  const feedbackResult = await generateFeedbackWithFallback({
    edition: edition as Edition,
    sections: params.sections,
    mermaidDiagram: params.mermaidDiagram,
    hasExcalidraw: Boolean(params.excalidrawState),
  });

  const existingFb = await db
    .select()
    .from(sdFeedback)
    .where(eq(sdFeedback.submissionId, submission.id))
    .limit(1);

  if (existingFb[0]) {
    await db
      .update(sdFeedback)
      .set({
        score: feedbackResult.score,
        strengths: feedbackResult.strengths,
        gaps: feedbackResult.gaps,
        followUpAnswers: feedbackResult.followUpAnswers,
        generatedAt: new Date(),
      })
      .where(eq(sdFeedback.id, existingFb[0].id));
  } else {
    await db.insert(sdFeedback).values({
      submissionId: submission.id,
      score: feedbackResult.score,
      strengths: feedbackResult.strengths,
      gaps: feedbackResult.gaps,
      followUpAnswers: feedbackResult.followUpAnswers,
    });
  }

  await recordActivityEvent({
    userId: params.userId,
    module: "system-design",
    eventType: "edition_submitted",
    metadata: {
      editionId: params.editionId,
      slot: edition.slot,
      topic: edition.topic,
    },
  });

  await recordActivityEvent({
    userId: params.userId,
    module: "system-design",
    eventType: "feedback_received",
    metadata: {
      score: feedbackResult.score,
      editionId: params.editionId,
    },
  });

  await recomputeAllActiveGoals(params.userId);

  return submission;
}

export async function saveDraft(params: {
  userId: string;
  editionId: string;
  sections: Record<string, string>;
  mermaidDiagram: string;
  excalidrawState: unknown;
}) {
  const existing = await db
    .select()
    .from(sdSubmissions)
    .where(
      and(eq(sdSubmissions.userId, params.userId), eq(sdSubmissions.editionId, params.editionId)),
    )
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(sdSubmissions)
      .set({
        sections: params.sections,
        mermaidDiagram: params.mermaidDiagram,
        excalidrawState: params.excalidrawState,
        updatedAt: new Date(),
      })
      .where(eq(sdSubmissions.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(sdSubmissions)
    .values({
      userId: params.userId,
      editionId: params.editionId,
      sections: params.sections,
      mermaidDiagram: params.mermaidDiagram,
      excalidrawState: params.excalidrawState,
    })
    .returning();
  return created;
}

export async function getRecentEditions(limit = 60) {
  return db.select().from(sdEditions).orderBy(desc(sdEditions.date)).limit(limit);
}

export type { Edition };
