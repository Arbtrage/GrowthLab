import { eq } from "drizzle-orm";
import type { UIMessage } from "ai";
import { db, chatConversations, chatMessages } from "@/lib/db";
import { getDefaultModelId } from "@/lib/ai/config";

export async function getOrCreateConversation(userId: string, conversationId?: string) {
  if (conversationId) {
    const [existing] = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.id, conversationId))
      .limit(1);
    if (existing && existing.userId === userId) return existing;
  }

  const [created] = await db
    .insert(chatConversations)
    .values({
      userId,
      model: getDefaultModelId(),
      title: "New chat",
    })
    .returning();

  return created;
}

export async function loadConversationMessages(conversationId: string) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);
}

function extractText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export async function persistChatTurn(params: {
  conversationId: string;
  userMessage: UIMessage;
  assistantMessage: UIMessage;
  model: string;
}) {
  const userText = extractText(params.userMessage);
  const assistantText = extractText(params.assistantMessage);

  await db.insert(chatMessages).values([
    {
      conversationId: params.conversationId,
      role: "user",
      content: userText,
    },
    {
      conversationId: params.conversationId,
      role: "assistant",
      content: assistantText,
      toolCalls: params.assistantMessage.parts.filter((part) => part.type.startsWith("tool-")),
    },
  ]);

  const title =
    userText.slice(0, 80).trim() || "GrowthLab chat";

  await db
    .update(chatConversations)
    .set({
      model: params.model,
      title,
      updatedAt: new Date(),
    })
    .where(eq(chatConversations.id, params.conversationId));
}

export { dbMessagesToUiMessages } from "@/lib/ai/chat/messages";
