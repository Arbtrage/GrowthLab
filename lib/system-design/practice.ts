import { and, desc, eq } from "drizzle-orm";
import { generateFeedbackWithFallback } from "@/lib/ai/feedback";
import { MODEL } from "@/lib/ai/client";
import { planEdition, recordTopicUsage } from "@/lib/ai/planner";
import { writeAmEdition, writePmEdition } from "@/lib/ai/writer";
import {
  db,
  sdGenerationLogs,
  sdPracticeEditions,
  sdPracticeFeedback,
  sdPracticeSubmissions,
} from "@/lib/db";
import { recordActivityEvent } from "@/lib/activity/events";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import type { Edition, EditionSlot } from "@/lib/system-design/types";

export async function generatePracticeEdition(
  userId: string,
  options?: { slot?: EditionSlot },
) {
  const slot = options?.slot ?? "pm";
  const date = new Date();

  const plan = await planEdition({ slot, date });
  const editionContent =
    slot === "am" ? await writeAmEdition(plan) : await writePmEdition(plan);

  const [edition] = await db
    .insert(sdPracticeEditions)
    .values({
      userId,
      slot,
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
    })
    .returning();

  await recordTopicUsage(plan.topic);
  await db.insert(sdGenerationLogs).values({
    practiceEditionId: edition.id,
    source: "practice",
    model: MODEL,
    status: "success",
    rawResponse: JSON.stringify(editionContent),
  });

  return { id: edition.id, title: edition.title, topic: edition.topic, slot: edition.slot };
}

export async function getPracticeEdition(id: string, userId: string) {
  const [edition] = await db
    .select()
    .from(sdPracticeEditions)
    .where(and(eq(sdPracticeEditions.id, id), eq(sdPracticeEditions.userId, userId)))
    .limit(1);
  return edition ?? null;
}

export async function listPracticeEditions(userId: string, limit = 30) {
  return db
    .select()
    .from(sdPracticeEditions)
    .where(eq(sdPracticeEditions.userId, userId))
    .orderBy(desc(sdPracticeEditions.createdAt))
    .limit(limit);
}

export async function savePracticeDraft(params: {
  userId: string;
  practiceEditionId: string;
  sections: Record<string, string>;
  mermaidDiagram: string;
  excalidrawState: unknown;
}) {
  const existing = await db
    .select()
    .from(sdPracticeSubmissions)
    .where(
      and(
        eq(sdPracticeSubmissions.userId, params.userId),
        eq(sdPracticeSubmissions.practiceEditionId, params.practiceEditionId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    const [updated] = await db
      .update(sdPracticeSubmissions)
      .set({
        sections: params.sections,
        mermaidDiagram: params.mermaidDiagram,
        excalidrawState: params.excalidrawState,
        updatedAt: new Date(),
      })
      .where(eq(sdPracticeSubmissions.id, existing[0].id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(sdPracticeSubmissions)
    .values({
      userId: params.userId,
      practiceEditionId: params.practiceEditionId,
      sections: params.sections,
      mermaidDiagram: params.mermaidDiagram,
      excalidrawState: params.excalidrawState,
    })
    .returning();
  return created;
}

function toEditionShape(edition: typeof sdPracticeEditions.$inferSelect): Edition {
  return {
    id: edition.id,
    date: edition.createdAt.toISOString().slice(0, 10),
    slot: edition.slot,
    topic: edition.topic,
    title: edition.title,
    prompt: edition.prompt,
    constraints: edition.constraints,
    tasks: edition.tasks,
    rubric: edition.rubric,
    followUpProbes: edition.followUpProbes,
    referenceOutline: edition.referenceOutline,
    pairedEditionId: null,
    generatedAt: edition.createdAt,
  };
}

export async function submitPracticeEdition(params: {
  userId: string;
  practiceEditionId: string;
  sections: Record<string, string>;
  mermaidDiagram: string;
  excalidrawState: unknown;
}) {
  const edition = await getPracticeEdition(params.practiceEditionId, params.userId);
  if (!edition) throw new Error("Practice edition not found");

  const existing = await db
    .select()
    .from(sdPracticeSubmissions)
    .where(
      and(
        eq(sdPracticeSubmissions.userId, params.userId),
        eq(sdPracticeSubmissions.practiceEditionId, params.practiceEditionId),
      ),
    )
    .limit(1);

  let submission;
  if (existing[0]) {
    [submission] = await db
      .update(sdPracticeSubmissions)
      .set({
        sections: params.sections,
        mermaidDiagram: params.mermaidDiagram,
        excalidrawState: params.excalidrawState,
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sdPracticeSubmissions.id, existing[0].id))
      .returning();
  } else {
    [submission] = await db
      .insert(sdPracticeSubmissions)
      .values({
        userId: params.userId,
        practiceEditionId: params.practiceEditionId,
        sections: params.sections,
        mermaidDiagram: params.mermaidDiagram,
        excalidrawState: params.excalidrawState,
        submittedAt: new Date(),
      })
      .returning();
  }

  const feedbackResult = await generateFeedbackWithFallback({
    edition: toEditionShape(edition),
    sections: params.sections,
    mermaidDiagram: params.mermaidDiagram,
    hasExcalidraw: Boolean(params.excalidrawState),
  });

  const existingFb = await db
    .select()
    .from(sdPracticeFeedback)
    .where(eq(sdPracticeFeedback.submissionId, submission.id))
    .limit(1);

  if (existingFb[0]) {
    await db
      .update(sdPracticeFeedback)
      .set({
        score: feedbackResult.score,
        strengths: feedbackResult.strengths,
        gaps: feedbackResult.gaps,
        followUpAnswers: feedbackResult.followUpAnswers,
        generatedAt: new Date(),
      })
      .where(eq(sdPracticeFeedback.id, existingFb[0].id));
  } else {
    await db.insert(sdPracticeFeedback).values({
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
    eventType: "practice_submitted",
    metadata: {
      practiceEditionId: params.practiceEditionId,
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
      practiceEditionId: params.practiceEditionId,
    },
  });

  await recomputeAllActiveGoals(params.userId);

  return submission;
}

export async function getPracticeSubmission(userId: string, practiceEditionId: string) {
  const [submission] = await db
    .select()
    .from(sdPracticeSubmissions)
    .where(
      and(
        eq(sdPracticeSubmissions.userId, userId),
        eq(sdPracticeSubmissions.practiceEditionId, practiceEditionId),
      ),
    )
    .limit(1);
  return submission ?? null;
}

export async function getPracticeFeedback(submissionId: string) {
  const [feedback] = await db
    .select()
    .from(sdPracticeFeedback)
    .where(eq(sdPracticeFeedback.submissionId, submissionId))
    .limit(1);
  return feedback ?? null;
}
