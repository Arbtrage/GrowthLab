import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { EditionHeader } from "@/components/edition/EditionHeader";
import { PromptPanel } from "@/components/edition/PromptPanel";
import { WorkPanel } from "@/components/edition/WorkPanel";
import { ChallengeShell } from "@/components/system-design/ChallengeShell";
import { db, sdSubmissions } from "@/lib/db";
import {
  getEditionByDateSlot,
  parseEditionDate,
  slotFromParam,
  slotToParam,
} from "@/lib/system-design/editions";
import { requireUser } from "@/lib/users";

interface ChallengePageProps {
  params: Promise<{ date: string; slot: string }>;
}

export default async function ChallengePage({ params }: ChallengePageProps) {
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

  const submitted = Boolean(submission?.submittedAt);
  const reviewPath = `/system-design/c/${dateParam}/${slotToParam(slot)}/review`;

  if (submitted) redirect(reviewPath);

  const constraints = edition.constraints as string[];
  const tasks = edition.tasks as Record<string, unknown>;
  const sections = (submission?.sections ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <EditionHeader slot={slot} date={editionDate} title={edition.title} submitted={submitted} />
      <ChallengeShell
        breadcrumb={slot === "am" ? "Morning warm-up" : "Evening design"}
        promptPanel={
          <PromptPanel slot={slot} prompt={edition.prompt} constraints={constraints} tasks={tasks} />
        }
        workPanel={
          <WorkPanel
            editionId={edition.id}
            slot={slot}
            initialSections={sections}
            initialMermaid={submission?.mermaidDiagram ?? ""}
            initialExcalidraw={submission?.excalidrawState}
            reviewPath={reviewPath}
          />
        }
      />
    </div>
  );
}
