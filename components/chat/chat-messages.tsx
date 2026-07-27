"use client";

import * as React from "react";
import Link from "next/link";
import type { UIMessage } from "ai";
import { Brain, Send } from "lucide-react";
import { CoachAvatar } from "@/components/common/CoachAvatar";
import { MarkdownContent } from "@/components/common/MarkdownContent";
import { COACH_NAME, COACH_TAGLINE } from "@/constants/ai-persona";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChatMessagesProps = {
  messages: UIMessage[];
  status: "submitted" | "streaming" | "ready" | "error";
  userName?: string | null;
  suggestedPrompts?: string[];
  onSuggestedPrompt?: (text: string) => void;
  isLoading?: boolean;
};

function getFirstName(name?: string | null) {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

function getToolOutput(part: UIMessage["parts"][number]): unknown {
  if (!part.type.startsWith("tool-")) return undefined;
  const record = part as Record<string, unknown>;
  return record.output ?? record.result;
}

function getToolName(part: UIMessage["parts"][number]): string {
  if (!part.type.startsWith("tool-")) return "tool";
  const record = part as Record<string, unknown>;
  if (typeof record.toolName === "string") return record.toolName;
  return part.type.replace(/^tool-/, "");
}

function renderToolPart(part: UIMessage["parts"][number], index: number) {
  const output = getToolOutput(part);
  const toolName = getToolName(part);

  if (toolName === "saveEpisodicMemory") {
    const saved =
      output && typeof output === "object" && output !== null && "saved" in output
        ? Boolean((output as { saved?: boolean }).saved)
        : false;
    const summary =
      output && typeof output === "object" && output !== null && "summary" in output
        ? String((output as { summary?: string }).summary ?? "")
        : "";

    return (
      <div
        key={index}
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary"
      >
        <Brain className="size-3" />
        {saved ? `Saved to memory${summary ? `: ${summary}` : ""}` : "Memory not configured"}
      </div>
    );
  }

  const link =
    output && typeof output === "object" && output !== null && "link" in output
      ? String((output as { link?: string }).link ?? "")
      : "";

  const summary =
    output && typeof output === "object" && output !== null && "summary" in output
      ? String((output as { summary?: string }).summary ?? "")
      : "";

  const goals =
    output && typeof output === "object" && output !== null && "goals" in output
      ? (output as { goals?: unknown[] }).goals
      : null;

  return (
    <Card key={index} className="border-dashed bg-muted/20">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium capitalize">
          {toolName.replace(/([A-Z])/g, " $1").trim()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-3 text-sm text-muted-foreground">
        {summary ? <p>{summary}</p> : null}
        {Array.isArray(goals) && goals.length > 0 ? (
          <ul className="list-inside list-disc space-y-1">
            {goals.slice(0, 5).map((goal, i) => (
              <li key={i}>
                {typeof goal === "object" && goal !== null && "label" in goal
                  ? String((goal as { label?: string }).label)
                  : JSON.stringify(goal)}
              </li>
            ))}
          </ul>
        ) : null}
        {link ? (
          <Link href={link} className="text-primary underline">
            Open result
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ChatMessages({
  messages,
  status,
  userName,
  suggestedPrompts = [],
  onSuggestedPrompt,
  isLoading,
}: ChatMessagesProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const firstName = getFirstName(userName);
  const loading = isLoading ?? (status === "submitted" || status === "streaming");

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-36 pt-4">
      {messages.length === 0 ? (
        <div className="mx-auto flex max-w-2xl flex-col items-center pt-8 text-center sm:pt-12">
          <div className="relative mb-6">
            <div
              className="absolute inset-0 scale-150 rounded-full bg-primary/20 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative flex size-14 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <CoachAvatar size={56} className="border-0 bg-transparent" />
            </div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {firstName ? `Hey ${firstName}, I'm ${COACH_NAME}` : `Hey there, I'm ${COACH_NAME}`}
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{COACH_TAGLINE}</p>
          <p className="mt-4 max-w-lg text-sm text-muted-foreground">
            Ask about LeetCode progress, system design practice, or your learning goals.
          </p>
          {suggestedPrompts.length > 0 && onSuggestedPrompt ? (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto whitespace-normal px-3 py-2 text-left text-xs"
                  onClick={() => onSuggestedPrompt(prompt)}
                  disabled={loading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {messages.map((message, messageIndex) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {message.role === "assistant" ? <CoachAvatar size={28} /> : null}
              <div
                className={cn(
                  "max-w-[85%] space-y-2 rounded-lg px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground/90",
                )}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    if (message.role === "assistant") {
                      return (
                        <MarkdownContent
                          key={index}
                          variant="chat"
                          isAnimating={loading && messageIndex === messages.length - 1}
                        >
                          {part.text}
                        </MarkdownContent>
                      );
                    }
                    return (
                      <p key={index} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    );
                  }
                  if (part.type.startsWith("tool-")) {
                    return renderToolPart(part, index);
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex gap-2">
              <CoachAvatar size={28} />
              <div className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="size-2 animate-pulse rounded-full bg-muted-foreground/60" />
                  <span className="size-2 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                  <span className="size-2 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
