import { NextResponse } from "next/server";
import { createGoal, listGoals } from "@/lib/goals/service";
import { createGoalSchema } from "@/lib/goals/schemas";
import { requireUser } from "@/lib/users";

export async function GET() {
  try {
    const user = await requireUser();
    const goals = await listGoals(user.id);
    return NextResponse.json({ goals });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = createGoalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const goal = await createGoal(user.id, parsed.data);
    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create goal" },
      { status: 400 },
    );
  }
}
