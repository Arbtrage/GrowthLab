import { verifyCronAuth } from "@/lib/cron/auth";
import { syncAllUsers } from "@/lib/leetcode/sync";

export async function POST(request: Request) {
  const unauthorized = verifyCronAuth(request);
  if (unauthorized) return unauthorized;
  try {
    const result = await syncAllUsers();
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 },
    );
  }
}
