import type { Edition } from "@/lib/system-design/types";

import { generateJson } from "./client";
import {
  feedbackOutputSchema,
  type FeedbackOutput,
  type SubmissionSections,
} from "./schemas";

export async function generateFeedback(params: {
  edition: Edition;
  sections: SubmissionSections;
  mermaidDiagram: string;
  hasExcalidraw: boolean;
}): Promise<FeedbackOutput> {
  const systemPrompt = `You are a senior system design interviewer providing post-submit feedback.
Score the submission 0-100 against the rubric. Be specific and constructive.
Return JSON only:
{
  "score": number,
  "strengths": ["2 specific strengths"],
  "gaps": ["3 specific gaps with actionable advice"],
  "followUpAnswers": [{"probe": "question", "answer": "ideal answer summary"}]
}`;

  const userPrompt = `Challenge: ${params.edition.title}
Prompt: ${params.edition.prompt}
Constraints: ${JSON.stringify(params.edition.constraints)}
Rubric: ${JSON.stringify(params.edition.rubric)}
Follow-up probes: ${JSON.stringify(params.edition.followUpProbes)}

Submission:
${JSON.stringify(params.sections, null, 2)}

Mermaid diagram:
${params.mermaidDiagram || "(none)"}

Excalidraw diagram provided: ${params.hasExcalidraw ? "yes" : "no"}`;

  const { parsed } = await generateJson<FeedbackOutput>({
    systemPrompt,
    userPrompt,
  });

  return feedbackOutputSchema.parse(parsed);
}

export function createFallbackFeedback(edition: Edition): FeedbackOutput {
  return {
    score: 70,
    strengths: [
      "You submitted a complete response for this edition.",
      "Engaging with daily practice builds interview fluency over time.",
    ],
    gaps: [
      "Add more quantitative estimates to strengthen your back-of-envelope reasoning.",
      "Call out explicit trade-offs between consistency, latency, and cost.",
      "Describe failure modes and mitigations for your highest-risk components.",
    ],
    followUpAnswers: ((edition.followUpProbes as string[]) ?? []).map((probe) => ({
      probe,
      answer: "Review the reference outline for a strong answer to this probe.",
    })),
  };
}

async function safeGenerateFeedback(params: {
  edition: Edition;
  sections: SubmissionSections;
  mermaidDiagram: string;
  hasExcalidraw: boolean;
}): Promise<FeedbackOutput> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return createFallbackFeedback(params.edition);
  }

  try {
    return await generateFeedback(params);
  } catch (error) {
    console.error("Feedback generation failed, using fallback:", error);
    return createFallbackFeedback(params.edition);
  }
}

export { safeGenerateFeedback as generateFeedbackWithFallback };
