import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { EditionHeader } from "@/components/edition/EditionHeader";
import { PromptPanel } from "@/components/edition/PromptPanel";
import { WorkPanel } from "@/components/edition/WorkPanel";
import {
  getPracticeEdition,
  getPracticeSubmission,
} from "@/lib/system-design/practice";
import { requireUser } from "@/lib/users";

interface PracticeChallengePageProps {
  params: Promise<{ id: string }>;
}

export default async function PracticeChallengePage({ params }: PracticeChallengePageProps) {
  const user = await requireUser();
  const { id } = await params;

  const edition = await getPracticeEdition(id, user.id);
  if (!edition) notFound();

  const submission = await getPracticeSubmission(user.id, edition.id);
  const submitted = Boolean(submission?.submittedAt);
  const reviewPath = `/system-design/practice/${id}/review`;

  if (submitted) redirect(reviewPath);

  const constraints = edition.constraints as string[];
  const tasks = edition.tasks as Record<string, unknown>;
  const sections = (submission?.sections ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-6xl">
      <EditionHeader
        slot={edition.slot}
        date={edition.createdAt}
        title={edition.title}
        submitted={submitted}
        subtitle={`Personal practice · ${format(edition.createdAt, "MMM d, yyyy")}`}
      />
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <PromptPanel
          slot={edition.slot}
          prompt={edition.prompt}
          constraints={constraints}
          tasks={tasks}
        />
        <WorkPanel
          editionId={edition.id}
          slot={edition.slot}
          initialSections={sections}
          initialMermaid={submission?.mermaidDiagram ?? ""}
          initialExcalidraw={submission?.excalidrawState}
          reviewPath={reviewPath}
          submissionKind="practice"
        />
      </div>
    </div>
  );
}
