import { requireUser } from "@/lib/users";
import { getDashboardData } from "@/lib/leetcode/sync";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getDashboardData(user.id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 },
    );
  }
}
