import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, sdPracticeFeedback, sdPracticeSubmissions } from "@/lib/db";
import { savePracticeDraft, submitPracticeEdition } from "@/lib/system-design/practice";
import { requireUser } from "@/lib/users";

const draftSchema = z.object({
  practiceEditionId: z.string().uuid(),
  sections: z.record(z.string(), z.string()),
  mermaidDiagram: z.string().optional(),
  excalidrawState: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const action = body.action as string;

    if (action === "draft") {
      const parsed = draftSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid draft data" }, { status: 400 });
      }
      const submission = await savePracticeDraft({
        userId: user.id,
        practiceEditionId: parsed.data.practiceEditionId,
        sections: parsed.data.sections,
        mermaidDiagram: parsed.data.mermaidDiagram ?? "",
        excalidrawState: parsed.data.excalidrawState ?? null,
      });
      return NextResponse.json({ success: true, submissionId: submission.id });
    }

    if (action === "submit") {
      const parsed = draftSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid submission data" }, { status: 400 });
      }

      const [existing] = await db
        .select()
        .from(sdPracticeSubmissions)
        .where(
          and(
            eq(sdPracticeSubmissions.userId, user.id),
            eq(sdPracticeSubmissions.practiceEditionId, parsed.data.practiceEditionId),
          ),
        )
        .limit(1);

      if (existing?.submittedAt) {
        return NextResponse.json({ error: "Already submitted" }, { status: 409 });
      }

      const submission = await submitPracticeEdition({
        userId: user.id,
        practiceEditionId: parsed.data.practiceEditionId,
        sections: parsed.data.sections,
        mermaidDiagram: parsed.data.mermaidDiagram ?? "",
        excalidrawState: parsed.data.excalidrawState ?? null,
      });

      return NextResponse.json({ success: true, submissionId: submission.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed" },
      { status: 500 },
    );
  }
}
