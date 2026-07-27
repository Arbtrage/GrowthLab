"use client";

import { useEffect, useId, useState } from "react";

import { Textarea } from "@/components/ui/textarea";

interface MermaidEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function MermaidEditor({ value, onChange, readOnly }: MermaidEditorProps) {
  const id = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value.trim()) {
      setSvg("");
      setError(null);
      return;
    }

    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
        });
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, value);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSvg("");
          setError(err instanceof Error ? err.message : "Invalid diagram syntax");
        }
      }
    }

    const timer = setTimeout(renderDiagram, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, id]);

  return (
    <div className="space-y-3">
      {!readOnly && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`graph TD\n  Client --> API\n  API --> DB`}
          className="min-h-[160px] font-mono text-sm"
        />
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {svg ? (
        <div
          className="overflow-auto rounded-lg border bg-muted/30 p-4"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        !readOnly && (
          <p className="text-sm text-muted-foreground">
            Live preview appears here as you type Mermaid syntax.
          </p>
        )
      )}
    </div>
  );
}
