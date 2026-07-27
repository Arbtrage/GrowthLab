import MemoryClient from "mem0ai";
import type { AiMemory } from "@/lib/ai/memory/port";
import type {
  MemoryEpisode,
  MemoryPort,
  MemorySearchQuery,
} from "@/lib/ai/memory/port";

const DEFAULT_TOP_K = 5;

function buildFilters(query: MemorySearchQuery): Record<string, unknown> {
  const and: Array<Record<string, unknown>> = [{ user_id: query.userId }];

  if (query.agentId) and.push({ agent_id: query.agentId });
  if (query.kinds?.length) {
    and.push({ "metadata.kind": { in: query.kinds } });
  }

  return { AND: and };
}

function toAiMemory(row: {
  id: string;
  memory?: string;
  score?: number;
  createdAt?: Date;
  metadata?: unknown;
}): AiMemory | null {
  const text = row.memory?.trim();
  if (!text) return null;

  return {
    id: row.id,
    memory: text,
    score: row.score,
    createdAt: row.createdAt?.toISOString?.(),
    metadata: (row.metadata as Record<string, unknown> | undefined) ?? undefined,
  };
}

export function createMem0Port(apiKey: string): MemoryPort {
  const client = new MemoryClient({ apiKey });

  return {
    enabled: true,

    async search(query) {
      try {
        const { results } = await client.search(query.query, {
          filters: buildFilters(query),
          topK: query.topK ?? DEFAULT_TOP_K,
          rerank: true,
        });

        return results
          .map(toAiMemory)
          .filter((memory): memory is AiMemory => memory !== null);
      } catch (error) {
        console.error("[mem0] search failed", error);
        return [];
      }
    },

    async add(episode: MemoryEpisode) {
      try {
        const messages = episode.messages
          .map((message) => ({
            role: message.role,
            content: message.content.trim(),
          }))
          .filter((message) => message.content.length > 0);

        if (messages.length === 0) return;

        await client.add(messages, {
          userId: episode.userId,
          agentId: episode.agentId,
          metadata: {
            kind: episode.kind,
            ...episode.metadata,
          },
        });
      } catch (error) {
        console.error("[mem0] add failed", error);
      }
    },

    async deleteForUser(userId: string) {
      try {
        await client.deleteAll({ userId });
      } catch (error) {
        console.error("[mem0] delete failed", error);
      }
    },
  };
}
