"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEnabledModels, getDefaultModelId, type AiModelConfig } from "@/lib/ai/config";

type ModelSelectorProps = {
  value: string;
  onChange: (modelId: string) => void;
  models?: AiModelConfig[];
};

export function ModelSelector({ value, onChange, models }: ModelSelectorProps) {
  const enabledModels = models ?? getEnabledModels();

  if (enabledModels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No models configured. Set GEMINI_API_KEY.</p>
    );
  }

  return (
    <Select
      value={value || getDefaultModelId()}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
    >
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        {enabledModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
