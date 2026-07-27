import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, sdFeedback, sdSubmissions } from "@/lib/db";
import { saveDraft, submitEdition } from "@/lib/system-design/editions";
import { requireUser } from "@/lib/users";

const draftSchema = z.object({
  editionId: z.string().uuid(),
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
      const submission = await saveDraft({
        userId: user.id,
        editionId: parsed.data.editionId,
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
        .from(sdSubmissions)
        .where(
          and(
            eq(sdSubmissions.userId, user.id),
            eq(sdSubmissions.editionId, parsed.data.editionId),
          ),
        )
        .limit(1);

      if (existing?.submittedAt) {
        return NextResponse.json({ error: "Already submitted" }, { status: 409 });
      }

      const submission = await submitEdition({
        userId: user.id,
        editionId: parsed.data.editionId,
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

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const editionId = searchParams.get("editionId");
    if (!editionId) {
      return NextResponse.json({ error: "editionId required" }, { status: 400 });
    }

    const [submission] = await db
      .select()
      .from(sdSubmissions)
      .where(
        and(eq(sdSubmissions.userId, user.id), eq(sdSubmissions.editionId, editionId)),
      )
      .limit(1);

    if (!submission) {
      return NextResponse.json({ submission: null });
    }

    const [feedback] = await db
      .select()
      .from(sdFeedback)
      .where(eq(sdFeedback.submissionId, submission.id))
      .limit(1);

    return NextResponse.json({ submission: { ...submission, feedback: feedback ?? null } });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
