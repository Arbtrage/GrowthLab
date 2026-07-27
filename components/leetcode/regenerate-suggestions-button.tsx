"use client";

import * as React from "react";
import { regenerateSuggestions } from "@/app/actions";
import { LoadingButton } from "@/components/ui/loading-button";

export function RegenerateSuggestionsButton() {
  const [isPending, startTransition] = React.useTransition();

  return (
    <LoadingButton
      type="button"
      variant="outline"
      size="sm"
      loading={isPending}
      loadingText="Regenerating…"
      onClick={() => {
        startTransition(async () => {
          await regenerateSuggestions();
        });
      }}
    >
      Regenerate
    </LoadingButton>
  );
}
