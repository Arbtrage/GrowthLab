import { endOfWeek, format, startOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { GoalTypeKey } from "@/lib/goals/metrics";
import { getDateOnlyString, getTodayDateInTimezone } from "@/lib/timezone";

export function computePeriod(
  type: GoalTypeKey,
  timezone: string,
): { periodStart: string; periodEnd: string } {
  const todayStr = getDateOnlyString(getTodayDateInTimezone(timezone));

  if (type === "daily") {
    return { periodStart: todayStr, periodEnd: todayStr };
  }

  const zoned = toZonedTime(new Date(), timezone);
  const weekStart = startOfWeek(zoned, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(zoned, { weekStartsOn: 1 });

  return {
    periodStart: format(weekStart, "yyyy-MM-dd"),
    periodEnd: format(weekEnd, "yyyy-MM-dd"),
  };
}
