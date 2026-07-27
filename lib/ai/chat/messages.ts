import type { UIMessage } from "ai";

export function dbMessagesToUiMessages(
  rows: Array<{ role: string; content: string; id: string }>,
): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role as UIMessage["role"],
    parts: [{ type: "text", text: row.content }],
  }));
}
