import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getEditionSchedule, MORNING_UTC_HOUR, MORNING_UTC_MINUTE, EVENING_UTC_HOUR, EVENING_UTC_MINUTE } from "@/lib/system-design/editions";
import { requireUser } from "@/lib/users";
import { getProfile } from "@/lib/users";
import { cn } from "@/lib/utils";

export default async function WaitingPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const timezone = profile?.timezone ?? "UTC";
  const schedule = getEditionSchedule();

  const morningLocal = formatInTimeZone(
    schedule.morningRelease,
    timezone,
    "h:mm a zzz",
  );
  const eveningLocal = formatInTimeZone(
    schedule.eveningRelease,
    timezone,
    "h:mm a zzz",
  );

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Waiting for edition</h1>
      <Card>
        <CardHeader>
          <CardTitle>Morning edition coming soon</CardTitle>
          <CardDescription>
            AM releases at {String(MORNING_UTC_HOUR).padStart(2, "0")}:
            {String(MORNING_UTC_MINUTE).padStart(2, "0")} UTC ({morningLocal} your time).
            PM releases at {String(EVENING_UTC_HOUR).padStart(2, "0")}:
            {String(EVENING_UTC_MINUTE).padStart(2, "0")} UTC ({eveningLocal} your time).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Next release: {schedule.nextRelease.toISOString()}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/system-design/archive" className={cn(buttonVariants({ variant: "outline" }))}>
              Browse archive
            </Link>
            <Link href="/system-design/practice" className={cn(buttonVariants({ variant: "outline" }))}>
              Practice while waiting
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
