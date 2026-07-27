import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { ChatPageClient } from "@/components/chat/chat-page";
import {
  getEnabledModels,
  getDefaultModelId,
  isGemini3LiteModel,
  DEFAULT_GEMINI_MODEL,
} from "@/lib/ai/config";
import { db, leetcodeProfiles } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/users";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user.id) : null;

  let defaultModel = getDefaultModelId();
  if (user) {
    const [lcProfile] = await db
      .select()
      .from(leetcodeProfiles)
      .where(eq(leetcodeProfiles.userId, user.id))
      .limit(1);
    if (lcProfile?.geminiModel && isGemini3LiteModel(lcProfile.geminiModel)) {
      defaultModel = lcProfile.geminiModel;
    } else if (lcProfile?.geminiModel) {
      defaultModel = DEFAULT_GEMINI_MODEL;
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Loading chat…
        </div>
      }
    >
      <ChatPageClient
        models={getEnabledModels()}
        defaultModel={defaultModel}
        userName={profile?.name ?? user?.email}
      />
    </Suspense>
  );
}
