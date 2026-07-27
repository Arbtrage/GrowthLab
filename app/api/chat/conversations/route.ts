import { NextResponse } from "next/server";
import { listConversations } from "@/lib/ai/chat/conversations";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await listConversations(user.id);
  return NextResponse.json({ conversations });
}
