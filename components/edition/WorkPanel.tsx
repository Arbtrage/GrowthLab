"use client";

import type { EditionSlot } from "@/lib/system-design/types";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ExcalidrawCanvas } from "@/components/diagrams/ExcalidrawCanvas";
import { MermaidEditor } from "@/components/diagrams/MermaidEditor";
import { SubmitDialog } from "@/components/edition/SubmitDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PM_SECTIONS } from "@/lib/ai/schemas";

interface WorkPanelProps {
  editionId: string;
  slot: EditionSlot;
  initialSections?: Record<string, string>;
  initialMermaid?: string;
  initialExcalidraw?: unknown;
  readOnly?: boolean;
  submitted?: boolean;
  reviewPath: string;
  submissionKind?: "daily" | "practice";
}

export function WorkPanel({
  editionId,
  slot,
  initialSections = {},
  initialMermaid = "",
  initialExcalidraw,
  readOnly,
  submitted,
  reviewPath,
  submissionKind = "daily",
}: WorkPanelProps) {
  const router = useRouter();
  const [sections, setSections] = useState<Record<string, string>>(initialSections);
  const [mermaidDiagram, setMermaidDiagram] = useState(initialMermaid);
  const [excalidrawState, setExcalidrawState] = useState<unknown>(
    initialExcalidraw ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const apiBase =
    submissionKind === "practice"
      ? "/api/system-design/practice/submissions"
      : "/api/submissions";
  const entityKey = submissionKind === "practice" ? "practiceEditionId" : "editionId";

  const saveDraft = useCallback(async () => {
    if (readOnly || submitted) return;

    setSaving(true);
    try {
      await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "draft",
          [entityKey]: editionId,
          sections,
          mermaidDiagram,
          excalidrawState,
        }),
      });
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  }, [
    apiBase,
    editionId,
    entityKey,
    sections,
    mermaidDiagram,
    excalidrawState,
    readOnly,
    submitted,
  ]);

  useEffect(() => {
    if (readOnly || submitted) return;
    const timer = setTimeout(saveDraft, 1500);
    return () => clearTimeout(timer);
  }, [sections, mermaidDiagram, excalidrawState, saveDraft, readOnly, submitted]);

  function updateSection(key: string, value: string) {
    setSections((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const response = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submit",
        [entityKey]: editionId,
        sections,
        mermaidDiagram,
        excalidrawState,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Submission failed");
      return;
    }

    toast.success("Submitted — generating feedback...");
    router.push(reviewPath);
  }

  if (slot === "am") {
    return (
      <div className="space-y-4">
        <SectionField
          label="Clarifying questions"
          description="List 5 questions you'd ask the interviewer."
          value={sections.clarifyingQuestions ?? ""}
          onChange={(v) => updateSection("clarifyingQuestions", v)}
          readOnly={readOnly || submitted}
        />
        <SectionField
          label="Back-of-envelope estimates"
          description="QPS, storage, bandwidth — show your math."
          value={sections.backOfEnvelope ?? ""}
          onChange={(v) => updateSection("backOfEnvelope", v)}
          readOnly={readOnly || submitted}
        />
        <SectionField
          label="Trade-off pick"
          description="Choose between two approaches and justify in one paragraph."
          value={sections.tradeOff ?? ""}
          onChange={(v) => updateSection("tradeOff", v)}
          readOnly={readOnly || submitted}
        />
        {!readOnly && !submitted && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {saving ? "Saving…" : "Saved"}
            </p>
            <Button onClick={() => setSubmitOpen(true)}>Submit warm-up</Button>
          </div>
        )}
        <SubmitDialog
          open={submitOpen}
          onOpenChange={setSubmitOpen}
          onConfirm={handleSubmit}
          title="Submit morning warm-up?"
          description="You'll receive AI feedback and can review the reference outline."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="requirements">
        <TabsList className="flex h-auto flex-wrap">
          {PM_SECTIONS.map((section) => (
            <TabsTrigger key={section.id} value={section.id}>
              {section.title}
            </TabsTrigger>
          ))}
          <TabsTrigger value="mermaid">Mermaid</TabsTrigger>
          <TabsTrigger value="excalidraw">Canvas</TabsTrigger>
        </TabsList>

        {PM_SECTIONS.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-4">
            <SectionField
              label={section.title}
              description={section.description}
              value={sections[section.id] ?? ""}
              onChange={(v) => updateSection(section.id, v)}
              readOnly={readOnly || submitted}
            />
          </TabsContent>
        ))}

        <TabsContent value="mermaid" className="mt-4">
          <MermaidEditor
            value={mermaidDiagram}
            onChange={setMermaidDiagram}
            readOnly={readOnly || submitted}
          />
        </TabsContent>

        <TabsContent value="excalidraw" className="mt-4">
          <ExcalidrawCanvas
            initialData={excalidrawState}
            onChange={setExcalidrawState}
            readOnly={readOnly || submitted}
          />
        </TabsContent>
      </Tabs>

      {!readOnly && !submitted && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {saving ? "Saving…" : "Saved"}
          </p>
          <Button onClick={() => setSubmitOpen(true)}>Submit design</Button>
        </div>
      )}

      <SubmitDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onConfirm={handleSubmit}
        title="Submit evening design?"
        description="Your work will be locked and AI feedback generated. This may take a moment."
      />
    </div>
  );
}

function SectionField({
  label,
  description,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {readOnly ? (
        <div className="min-h-[120px] whitespace-pre-wrap rounded-lg border bg-muted/20 p-3 text-sm">
          {value || "—"}
        </div>
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[160px]"
        />
      )}
    </div>
  );
}
