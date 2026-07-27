import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { EditionHeader } from "@/components/edition/EditionHeader";
import { PromptPanel } from "@/components/edition/PromptPanel";
import { WorkPanel } from "@/components/edition/WorkPanel";
import { ChallengeShell } from "@/components/system-design/ChallengeShell";
import { ReviewFeedback } from "@/components/system-design/ReviewFeedback";
import { buttonVariants } from "@/components/ui/button";
import {
  getPracticeEdition,
  getPracticeFeedback,
  getPracticeSubmission,
} from "@/lib/system-design/practice";
import { requireUser } from "@/lib/users";
import { cn } from "@/lib/utils";

interface PracticeReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PracticeReviewPage({ params }: PracticeReviewPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const edition = await getPracticeEdition(id, user.id);
  if (!edition) notFound();

  const submission = await getPracticeSubmission(user.id, edition.id);
  if (!submission?.submittedAt) {
    redirect(`/system-design/practice/${id}`);
  }

  const feedback = await getPracticeFeedback(submission.id);
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
      <EditionHeader
        slot={edition.slot}
        date={edition.createdAt}
        title={edition.title}
        submitted
        subtitle={`Personal practice · ${format(edition.createdAt, "MMM d, yyyy")}`}
      />

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
        breadcrumb="Practice review"
        promptPanel={
          <PromptPanel
            slot={edition.slot}
            prompt={edition.prompt}
            constraints={constraints}
            tasks={tasks}
          />
        }
        workPanel={
          <WorkPanel
            editionId={edition.id}
            slot={edition.slot}
            initialSections={sections}
            initialMermaid={submission.mermaidDiagram}
            initialExcalidraw={submission.excalidrawState}
            readOnly
            submitted
            reviewPath={`/system-design/practice/${id}/review`}
            submissionKind="practice"
          />
        }
      />

      <Link href="/system-design/practice" className={cn(buttonVariants({ variant: "outline" }))}>
        Back to practice
      </Link>
    </div>
  );
}
