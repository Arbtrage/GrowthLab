export type AiProvider = "google";

export const GEMINI_3_LITE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
] as const;

export type Gemini3LiteModel = (typeof GEMINI_3_LITE_MODELS)[number];

export type AiModelConfig = {
  id: Gemini3LiteModel;
  label: string;
  provider: AiProvider;
  enabled: boolean;
  default?: boolean;
};

const hasGeminiKey = Boolean(
  process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
);

const MODEL_LABELS: Record<Gemini3LiteModel, string> = {
  "gemini-3.5-flash-lite": "Gemini 3.5 Flash Lite",
  "gemini-3.1-flash-lite": "Gemini 3.1 Flash Lite",
};

export const DEFAULT_GEMINI_MODEL: Gemini3LiteModel = "gemini-3.5-flash-lite";

export const AI_MODELS: AiModelConfig[] = GEMINI_3_LITE_MODELS.map((id) => ({
  id,
  label: MODEL_LABELS[id],
  provider: "google" as const,
  enabled: hasGeminiKey,
  default: id === DEFAULT_GEMINI_MODEL,
}));

export function isGemini3LiteModel(modelId: string): modelId is Gemini3LiteModel {
  return (GEMINI_3_LITE_MODELS as readonly string[]).includes(modelId);
}

export function getEnabledModels(): AiModelConfig[] {
  return AI_MODELS.filter((model) => model.enabled);
}

export function resolveModel(modelId?: string): Gemini3LiteModel {
  const enabled = getEnabledModels();
  if (enabled.length === 0) {
    throw new Error("No AI models are configured. Set GEMINI_API_KEY in your environment.");
  }

  if (modelId && isGemini3LiteModel(modelId)) {
    const match = enabled.find((model) => model.id === modelId);
    if (match) return match.id;
  }

  return enabled.find((model) => model.default)?.id ?? enabled[0].id;
}

export function getDefaultModelId(): Gemini3LiteModel {
  return resolveModel();
}
