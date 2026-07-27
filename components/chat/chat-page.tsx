"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { History, Plus } from "lucide-react";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ModelSelector } from "@/components/chat/model-selector";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import type { AiModelConfig } from "@/lib/ai/config";
import { dbMessagesToUiMessages } from "@/lib/ai/chat/messages";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "How am I doing on LeetCode this week?",
  "What's today's system design edition about?",
  "Create a daily learning goal for me",
  "Which topics should I focus on next?",
];

type ChatPageClientProps = {
  models: AiModelConfig[];
  defaultModel: string;
  userName?: string | null;
};

export function ChatPageClient({ models, defaultModel, userName }: ChatPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlConversationId = searchParams.get("id");

  const [model, setModel] = React.useState(defaultModel);
  const [conversationId, setConversationId] = React.useState<string | undefined>(
    urlConversationId ?? undefined,
  );
  const [initialMessages, setInitialMessages] = React.useState<UIMessage[] | undefined>(
    undefined,
  );
  const [hydrated, setHydrated] = React.useState(!urlConversationId);

  React.useEffect(() => {
    if (!urlConversationId) {
      setConversationId(undefined);
      setInitialMessages(undefined);
      setHydrated(true);
      return;
    }

    setConversationId(urlConversationId);
    setHydrated(false);

    void fetch(`/api/chat/conversations/${urlConversationId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load conversation");
        return res.json();
      })
      .then((data) => {
        setInitialMessages(dbMessagesToUiMessages(data.messages ?? []));
        if (data.conversation?.model) {
          setModel(data.conversation.model);
        }
      })
      .catch(() => {
        setInitialMessages([]);
      })
      .finally(() => setHydrated(true));
  }, [urlConversationId]);

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ model, conversationId }),
      }),
    [model, conversationId],
  );

  const chatKey = urlConversationId ?? "new";

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    );
  }

  return (
    <ChatSession
      key={chatKey}
      transport={transport}
      initialMessages={initialMessages}
      model={model}
      models={models}
      userName={userName}
      onModelChange={setModel}
      onConversationId={(id) => {
        setConversationId(id);
        if (id && id !== urlConversationId) {
          router.replace(`/chat?id=${id}`, { scroll: false });
        }
      }}
      onNewChat={() => {
        setConversationId(undefined);
        setInitialMessages(undefined);
        router.push("/chat");
      }}
    />
  );
}

type ChatSessionProps = {
  transport: DefaultChatTransport<UIMessage>;
  initialMessages?: UIMessage[];
  model: string;
  models: AiModelConfig[];
  userName?: string | null;
  onModelChange: (model: string) => void;
  onConversationId: (id: string) => void;
  onNewChat: () => void;
};

function ChatSession({
  transport,
  initialMessages,
  model,
  models,
  userName,
  onModelChange,
  onConversationId,
  onNewChat,
}: ChatSessionProps) {
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    messages: initialMessages,
  });

  React.useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  React.useEffect(() => {
    for (const message of messages) {
      const metadata = (message as UIMessage & { metadata?: { conversationId?: string } })
        .metadata;
      if (metadata?.conversationId) {
        onConversationId(metadata.conversationId);
        break;
      }
    }
  }, [messages, onConversationId]);

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/chat/history" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            <History className="mr-1.5 size-4" />
            History
          </Link>
          <Button variant="ghost" size="sm" onClick={onNewChat}>
            <Plus className="mr-1.5 size-4" />
            New chat
          </Button>
        </div>
        <ModelSelector value={model} onChange={onModelChange} models={models} />
      </div>

      {error ? (
        <div className="mx-4 mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </div>
      ) : null}

      <ChatMessages
        messages={messages}
        status={status}
        userName={userName}
        suggestedPrompts={SUGGESTED_PROMPTS}
        onSuggestedPrompt={(text) => sendMessage({ text })}
        isLoading={isLoading}
      />

      <ChatInput
        loading={isLoading}
        disabled={status === "error"}
        onSend={(text) => sendMessage({ text })}
      />
    </div>
  );
}
