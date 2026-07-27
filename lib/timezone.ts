import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export function getTodayDateInTimezone(timezone: string): Date {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  return new Date(
    Date.UTC(zoned.getFullYear(), zoned.getMonth(), zoned.getDate()),
  );
}

export function getDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isWithinNotificationWindow(
  timezone: string,
  notificationHour: number,
): boolean {
  const hour = Number.parseInt(
    formatInTimeZone(new Date(), timezone, 'H'),
    10,
  );
  return hour >= notificationHour;
}

export function countSubmissionsToday(
  submissions: { timestamp: string }[],
  timezone: string,
): number {
  const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
  return submissions.filter((submission) => {
    const submissionDate = formatInTimeZone(
      new Date(Number.parseInt(submission.timestamp, 10) * 1000),
      timezone,
      'yyyy-MM-dd',
    );
    return submissionDate === today;
  }).length;
}

export function parseSubmissionCalendar(calendarJson: string): Record<string, number> {
  try {
    return JSON.parse(calendarJson) as Record<string, number>;
  } catch {
    return {};
  }
}
