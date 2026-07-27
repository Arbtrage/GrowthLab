export type AiMemoryKind = "episodic" | "semantic";
export type AiAgentId = "coach";

export type AiMemory = {
  id: string;
  memory: string;
  score?: number;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type MemorySearchQuery = {
  query: string;
  userId: string;
  agentId?: AiAgentId;
  kinds?: AiMemoryKind[];
  topK?: number;
};

export type MemoryEpisode = {
  userId: string;
  agentId: AiAgentId;
  kind: AiMemoryKind;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  metadata?: Record<string, unknown>;
};

export interface MemoryPort {
  readonly enabled: boolean;
  search(query: MemorySearchQuery): Promise<AiMemory[]>;
  add(episode: MemoryEpisode): Promise<void>;
  deleteForUser(userId: string): Promise<void>;
}

export const nullMemoryPort: MemoryPort = {
  enabled: false,
  async search() {
    return [];
  },
  async add() {},
  async deleteForUser() {},
};
