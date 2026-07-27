import { NextResponse } from "next/server";
import { recomputeAllActiveGoals } from "@/lib/goals/recompute";
import { requireUser } from "@/lib/users";

export async function POST() {
  try {
    const user = await requireUser();
    const goals = await recomputeAllActiveGoals(user.id);
    return NextResponse.json({ goals });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
