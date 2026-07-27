import { verifyCronAuth } from "@/lib/cron/auth";
import { runSuggestCron } from "@/lib/leetcode/suggest";

export async function POST(request: Request) {
  const unauthorized = verifyCronAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await runSuggestCron();
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Suggest failed" },
      { status: 500 },
    );
  }
}
