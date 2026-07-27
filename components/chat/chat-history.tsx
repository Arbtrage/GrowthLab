"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  title: string | null;
  updatedAt: string;
};

export function ChatHistoryClient() {
  const router = useRouter();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void fetch("/api/chat/conversations")
      .then((res) => res.json())
      .then((data) => setConversations(data.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((c) =>
    (c.title ?? "New chat").toLowerCase().includes(search.toLowerCase()),
  );

  async function handleDelete(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Chat history</h1>
          <p className="text-sm text-muted-foreground">Resume past conversations with your coach</p>
        </div>
        <Link href="/chat" className={cn(buttonVariants())}>
          <Plus className="mr-1.5 size-4" />
          New chat
        </Link>
      </div>

      <Input
        placeholder="Search conversations…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No conversations yet.{" "}
            <Link href="/chat" className="text-primary underline">
              Start a new chat
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => router.push(`/chat?id=${conversation.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-muted/30"
            >
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{conversation.title ?? "New chat"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(event) => void handleDelete(conversation.id, event)}
                aria-label="Delete conversation"
              >
                <Trash2 className="size-4 text-muted-foreground" />
              </Button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
