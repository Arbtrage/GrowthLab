import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { workspace } from "@/constants/design";
import { db, sdEditions, sdSubmissions } from "@/lib/db";
import {
  formatEditionDate,
  getEditionSchedule,
  slotToParam,
} from "@/lib/system-design/editions";
import { requireUser } from "@/lib/users";
import { cn } from "@/lib/utils";
import { and, eq } from "drizzle-orm";

export default async function SystemDesignPage() {
  const user = await requireUser();
  const schedule = getEditionSchedule();
  const dateStr = formatEditionDate(schedule.today);

  const editions = await db.select().from(sdEditions).where(eq(sdEditions.date, dateStr));

  const statuses = await Promise.all(
    editions.map(async (edition) => {
      const [sub] = await db
        .select()
        .from(sdSubmissions)
        .where(and(eq(sdSubmissions.userId, user.id), eq(sdSubmissions.editionId, edition.id)))
        .limit(1);
      return { edition, submitted: Boolean(sub?.submittedAt) };
    }),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className={workspace.pageHero}>
        <div className={workspace.pageHeroInner}>
          <h1 className="text-3xl font-semibold">System Design</h1>
          <p className="mt-2 text-muted-foreground">
            Today&apos;s AM warm-up and PM full design
          </p>
          {!schedule.isWaiting && schedule.nextRelease ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Next edition in{" "}
              {formatDistanceToNow(schedule.nextRelease, { addSuffix: true })}
            </p>
          ) : null}
        </div>
      </div>

      {schedule.isWaiting ? (
        <Card>
          <CardHeader>
            <CardTitle>Waiting for morning edition</CardTitle>
            <CardDescription>
              The AM edition releases at 01:30 UTC (
              {formatDistanceToNow(schedule.morningRelease, { addSuffix: true })}).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/system-design/waiting" className={cn(buttonVariants({ variant: "outline" }))}>
              View schedule
            </Link>
            <Link href="/system-design/practice" className={cn(buttonVariants({ variant: "outline" }))}>
              Practice while waiting
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {statuses.map(({ edition, submitted }) => {
          const slotParam = slotToParam(edition.slot);
          const href = submitted
            ? `/system-design/c/${dateStr}/${slotParam}/review`
            : `/system-design/c/${dateStr}/${slotParam}`;
          const isAm = edition.slot === "am";
          return (
            <Card
              key={edition.id}
              className={cn(
                "overflow-hidden",
                isAm ? "border-l-4 border-l-primary/40" : "border-l-4 border-l-primary",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{isAm ? "Morning" : "Evening"}</Badge>
                  <Badge variant="secondary">{isAm ? "~30 min" : "~60 min"}</Badge>
                </div>
                <CardTitle className="text-lg">{edition.title}</CardTitle>
                <CardDescription>{edition.topic}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant={submitted ? "default" : "secondary"}>
                  {submitted ? "Completed" : "Open"}
                </Badge>
                <Link href={href} className={cn(buttonVariants())}>
                  {submitted ? "View review" : "Start challenge"}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editions.length === 0 && !schedule.isWaiting ? (
        <Card>
          <CardHeader>
            <CardTitle>No editions yet today</CardTitle>
            <CardDescription>Editions generate at 01:30 and 13:30 UTC via cron.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link href="/system-design/archive" className={cn(buttonVariants({ variant: "outline" }))}>
          View archive
        </Link>
        <Link href="/system-design/practice" className={cn(buttonVariants({ variant: "outline" }))}>
          Personal practice
        </Link>
      </div>
    </div>
  );
}
