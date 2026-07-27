import { createGoogle } from "@ai-sdk/google";
import { resolveModel } from "@/lib/ai/config";

let provider: ReturnType<typeof createGoogle> | null = null;

function getGoogleProvider() {
  if (!provider) {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    provider = createGoogle({ apiKey });
  }
  return provider;
}

export function getGoogleModel(modelId?: string) {
  return getGoogleProvider()(resolveModel(modelId));
}
