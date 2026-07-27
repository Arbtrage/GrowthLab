import { and, desc, eq } from "drizzle-orm";
import { db, chatConversations, chatMessages } from "@/lib/db";

export async function listConversations(userId: string, limit = 50) {
  return db
    .select({
      id: chatConversations.id,
      title: chatConversations.title,
      model: chatConversations.model,
      createdAt: chatConversations.createdAt,
      updatedAt: chatConversations.updatedAt,
    })
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(limit);
}

export async function getConversation(userId: string, conversationId: string) {
  const [conversation] = await db
    .select()
    .from(chatConversations)
    .where(
      and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, userId)),
    )
    .limit(1);

  return conversation ?? null;
}

export async function deleteConversation(userId: string, conversationId: string) {
  const conversation = await getConversation(userId, conversationId);
  if (!conversation) return false;

  await db.delete(chatConversations).where(eq(chatConversations.id, conversationId));
  return true;
}

export async function getConversationMessages(userId: string, conversationId: string) {
  const conversation = await getConversation(userId, conversationId);
  if (!conversation) return null;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);

  return { conversation, messages };
}
