import { NextResponse } from "next/server";
import { getAnalytics, type AnalyticsRange } from "@/lib/analytics/aggregate";
import { requireUser } from "@/lib/users";

const VALID_RANGES: AnalyticsRange[] = ["7d", "30d", "90d"];

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") ?? "7d";
    const range = VALID_RANGES.includes(rangeParam as AnalyticsRange)
      ? (rangeParam as AnalyticsRange)
      : "7d";

    const data = await getAnalytics(user.id, range);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
