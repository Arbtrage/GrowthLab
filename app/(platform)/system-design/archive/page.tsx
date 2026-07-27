import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ArchiveList } from "@/components/system-design/ArchiveList";
import { db, sdEditions, sdFeedback, sdSubmissions } from "@/lib/db";
import { slotToParam } from "@/lib/system-design/editions";
import { requireUser } from "@/lib/users";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ArchivePage() {
  const user = await requireUser();

  const editions = await db.select().from(sdEditions).orderBy(desc(sdEditions.date)).limit(60);

  const submissions = await db
    .select({
      editionId: sdSubmissions.editionId,
      submittedAt: sdSubmissions.submittedAt,
      submissionId: sdSubmissions.id,
    })
    .from(sdSubmissions)
    .where(eq(sdSubmissions.userId, user.id));

  const submissionMap = new Map(
    submissions.map((s) => [s.editionId, { submittedAt: s.submittedAt, id: s.submissionId }]),
  );

  const feedbackRows =
    submissions.length > 0
      ? await db
          .select({ submissionId: sdFeedback.submissionId, score: sdFeedback.score })
          .from(sdFeedback)
      : [];

  const scoreMap = new Map(feedbackRows.map((f) => [f.submissionId, f.score]));

  const archiveEditions = editions.map((edition) => {
    const dateStr = edition.date;
    const slotParam = slotToParam(edition.slot);
    const sub = submissionMap.get(edition.id);
    const submitted = Boolean(sub?.submittedAt);
    const href = submitted
      ? `/system-design/c/${dateStr}/${slotParam}/review`
      : `/system-design/c/${dateStr}/${slotParam}`;

    return {
      id: edition.id,
      date: dateStr,
      slot: edition.slot as "am" | "pm",
      title: edition.title,
      href,
      submitted,
      score: sub ? (scoreMap.get(sub.id) ?? null) : null,
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Archive</h1>
        <p className="text-muted-foreground">Past editions and completion status</p>
      </div>

      {editions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No editions yet. Editions are generated daily at 01:30 and 13:30 UTC.
        </p>
      ) : (
        <ArchiveList editions={archiveEditions} />
      )}

      <Link href="/system-design" className={cn(buttonVariants({ variant: "outline" }))}>
        Back to today
      </Link>
    </div>
  );
}
