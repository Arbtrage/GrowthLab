import { requireUser } from "@/lib/users";
import { getGlobalDashboard } from "@/lib/dashboard/global";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getGlobalDashboard(user.id);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
