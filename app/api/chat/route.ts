import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { buildCoachSystemPrompt } from "@/lib/ai/chat/system-prompt";
import { createChatTools } from "@/lib/ai/chat/tools";
import {
  getOrCreateConversation,
  persistChatTurn,
} from "@/lib/ai/chat/persistence";
import { getGoogleModel } from "@/lib/ai/google-provider";
import { resolveModel } from "@/lib/ai/config";
import { getMemoryPort } from "@/lib/ai/memory";
import { createClient } from "@/lib/supabase/server";

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== "user") continue;
    return message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();
  }
  return "";
}

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "GEMINI_API_KEY is not configured. Add it in Settings or your environment." },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const messages = body.messages as UIMessage[];
    const modelId = resolveModel(body.model as string | undefined);
    const conversation = await getOrCreateConversation(
      user.id,
      body.conversationId as string | undefined,
    );

    const memory = getMemoryPort();
    const lastUserText = extractLastUserText(messages);
    let memories: Awaited<ReturnType<typeof memory.search>> = [];

    if (memory.enabled && lastUserText) {
      memories = await memory.search({
        query: lastUserText,
        userId: user.id,
        agentId: "coach",
        topK: 6,
        kinds: ["episodic"],
      });
    }

    const system = buildCoachSystemPrompt(memories);

    const result = streamText({
      model: getGoogleModel(modelId),
      system,
      messages: await convertToModelMessages(messages),
      tools: createChatTools(user.id),
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: finalMessages }) => {
        const userMessage = finalMessages.at(-2);
        const assistantMessage = finalMessages.at(-1);
        if (!userMessage || !assistantMessage || assistantMessage.role !== "assistant") {
          return;
        }

        await persistChatTurn({
          conversationId: conversation.id,
          userMessage,
          assistantMessage,
          model: modelId,
        });
      },
      messageMetadata: () => ({
        conversationId: conversation.id,
      }),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Chat request failed" },
      { status: 500 },
    );
  }
}
