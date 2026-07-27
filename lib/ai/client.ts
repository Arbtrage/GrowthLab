import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  DEFAULT_GEMINI_MODEL,
  getDefaultModelId,
  resolveModel,
  type Gemini3LiteModel,
} from "@/lib/ai/config";

let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

function getModelId(modelId?: string): Gemini3LiteModel {
  return modelId ? resolveModel(modelId) : getDefaultModelId();
}

export async function generateJson<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  modelId?: string;
  retry?: boolean;
}): Promise<{ text: string; parsed: T | null }> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: getModelId(params.modelId),
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
    },
  });

  const prompt = `${params.systemPrompt}\n\n${params.userPrompt}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as T;
    return { text, parsed };
  } catch (error) {
    if (params.retry !== false) {
      return generateJson({ ...params, retry: false });
    }
    throw error;
  }
}

export async function generateText(params: {
  systemPrompt: string;
  userPrompt: string;
  modelId?: string;
}): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: getModelId(params.modelId) });
  const prompt = `${params.systemPrompt}\n\n${params.userPrompt}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export const MODEL = DEFAULT_GEMINI_MODEL;
