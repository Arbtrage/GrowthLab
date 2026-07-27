"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { COACH_NAME } from "@/constants/ai-persona";
import { Button } from "@/components/ui/button";

const MAX_TEXTAREA_ROWS = 4;
const LINE_HEIGHT_PX = 24;

type ChatInputProps = {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
  loading?: boolean;
};

export function ChatInput({ onSend, disabled, loading }: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = LINE_HEIGHT_PX * MAX_TEXTAREA_ROWS;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [input]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || disabled || loading) return;
    setInput("");
    await onSend(text);
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/80 to-transparent pb-4 pt-12">
      <form
        onSubmit={handleSubmit}
        className="pointer-events-auto mx-auto max-w-3xl px-4"
      >
        <div className="flex items-end gap-2 rounded-lg border border-border/60 bg-background/95 p-2 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit(event);
              }
            }}
            placeholder={`Ask ${COACH_NAME}...`}
            rows={1}
            className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
            disabled={disabled || loading}
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0"
            disabled={disabled || loading || !input.trim()}
          >
            <Send className="size-4" aria-hidden="true" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
