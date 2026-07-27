import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { EditionHeader } from "@/components/edition/EditionHeader";
import { PromptPanel } from "@/components/edition/PromptPanel";
import { WorkPanel } from "@/components/edition/WorkPanel";
import { ChallengeShell } from "@/components/system-design/ChallengeShell";
import { ReviewFeedback } from "@/components/system-design/ReviewFeedback";
import { buttonVariants } from "@/components/ui/button";
import { db, sdFeedback, sdSubmissions } from "@/lib/db";
import {
  getEditionByDateSlot,
  parseEditionDate,
  slotFromParam,
  slotToParam,
} from "@/lib/system-design/editions";
import { requireUser } from "@/lib/users";
import { cn } from "@/lib/utils";

interface ReviewPageProps {
  params: Promise<{ date: string; slot: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const user = await requireUser();
  const { date: dateParam, slot: slotParam } = await params;
  const slot = slotFromParam(slotParam);
  if (!slot) notFound();

  let editionDate: Date;
  try {
    editionDate = parseEditionDate(dateParam);
  } catch {
    notFound();
  }

  const edition = await getEditionByDateSlot(editionDate, slot);
  if (!edition) notFound();

  const [submission] = await db
    .select()
    .from(sdSubmissions)
    .where(and(eq(sdSubmissions.userId, user.id), eq(sdSubmissions.editionId, edition.id)))
    .limit(1);

  if (!submission?.submittedAt) {
    redirect(`/system-design/c/${dateParam}/${slotToParam(slot)}`);
  }

  const [feedback] = await db
    .select()
    .from(sdFeedback)
    .where(eq(sdFeedback.submissionId, submission.id))
    .limit(1);

  const constraints = edition.constraints as string[];
  const tasks = edition.tasks as Record<string, unknown>;
  const sections = (submission.sections ?? {}) as Record<string, string>;
  const strengths = (feedback?.strengths as string[]) ?? [];
  const gaps = (feedback?.gaps as string[]) ?? [];
  const followUpAnswers =
    (feedback?.followUpAnswers as Array<{ probe?: string; question?: string; answer?: string }>) ??
    [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <EditionHeader slot={slot} date={editionDate} title={edition.title} submitted />

      {feedback ? (
        <ReviewFeedback
          score={feedback.score}
          strengths={strengths}
          gaps={gaps}
          followUpAnswers={followUpAnswers}
          referenceOutline={edition.referenceOutline}
        />
      ) : null}

      <ChallengeShell
        breadcrumb={`${slot === "am" ? "Morning" : "Evening"} review`}
        promptPanel={
          <PromptPanel slot={slot} prompt={edition.prompt} constraints={constraints} tasks={tasks} />
        }
        workPanel={
          <WorkPanel
            editionId={edition.id}
            slot={slot}
            initialSections={sections}
            initialMermaid={submission.mermaidDiagram}
            initialExcalidraw={submission.excalidrawState}
            readOnly
            submitted
            reviewPath={`/system-design/c/${dateParam}/${slotToParam(slot)}/review`}
          />
        }
      />

      <Link href="/system-design/archive" className={cn(buttonVariants({ variant: "outline" }))}>
        Back to archive
      </Link>
    </div>
  );
}
