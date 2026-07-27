"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GenerationOverlay } from "@/components/generation/generation-overlay";
import { LoadingButton } from "@/components/ui/loading-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GeneratePracticeButtonProps = {
  variant?: "card" | "button";
};

export function GeneratePracticeButton({ variant = "card" }: GeneratePracticeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [label, setLabel] = React.useState("Planning topic…");
  const [activeSlot, setActiveSlot] = React.useState<"am" | "pm">("pm");

  async function handleGenerate(slot: "am" | "pm") {
    setActiveSlot(slot);
    setLoading(true);
    setLabel(slot === "am" ? "Planning warm-up…" : "Planning topic…");

    const timer = window.setTimeout(
      () => setLabel(slot === "am" ? "Writing warm-up…" : "Writing challenge…"),
      4000,
    );

    try {
      const response = await fetch("/api/system-design/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed");
      }

      router.push(`/system-design/practice/${data.id}`);
      router.refresh();
    } catch (error) {
      setLoading(false);
      window.clearTimeout(timer);
      alert(error instanceof Error ? error.message : "Generation failed");
    }
  }

  if (variant === "button") {
    return (
      <LoadingButton
        loading={loading}
        loadingText="Generating…"
        onClick={() => handleGenerate("pm")}
      >
        Generate practice question
      </LoadingButton>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      {loading ? (
        <GenerationOverlay
          label={activeSlot === "am" ? "Generating warm-up…" : label}
        />
      ) : null}
      <CardHeader>
        <CardTitle>Personal practice</CardTitle>
        <CardDescription>
          Generate a one-off system design question just for you — separate from today&apos;s shared
          editions.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <LoadingButton
          loading={loading && activeSlot === "pm"}
          loadingText="Generating…"
          onClick={() => handleGenerate("pm")}
        >
          Full design (PM style)
        </LoadingButton>
        <LoadingButton
          variant="outline"
          loading={loading && activeSlot === "am"}
          loadingText="Generating…"
          onClick={() => handleGenerate("am")}
        >
          Warm-up (AM style)
        </LoadingButton>
      </CardContent>
    </Card>
  );
}
