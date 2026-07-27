import { generateJson } from "./client";
import {
  amEditionSchema,
  pmEditionSchema,
  type AmEditionOutput,
  type PmEditionOutput,
  type PlannerOutput,
} from "./schemas";

export async function writeAmEdition(plan: PlannerOutput): Promise<AmEditionOutput> {
  const systemPrompt = `You write morning "sketch" system design warm-ups for a daily challenger app.
Return JSON only matching this shape:
{
  "title": "short title",
  "prompt": "2-3 sentence scenario",
  "constraints": ["3 concrete constraints with numbers"],
  "tasks": {
    "clarifyingQuestionsPrompt": "instruction for listing 5 clarifying questions",
    "backOfEnvelopePrompt": "instruction for QPS/storage/bandwidth estimates",
    "tradeOffPrompt": "instruction to pick between 2 technologies with one sentence why"
  },
  "rubric": ["4-5 evaluation criteria"],
  "referenceOutline": "markdown outline of a good warm-up answer"
}`;

  const userPrompt = `Topic: ${plan.topic}
Skills: ${plan.skills.join(", ")}
Difficulty: ${plan.difficulty}/5
Style: ${plan.companyStyle}`;

  const { parsed } = await generateJson<AmEditionOutput>({
    systemPrompt,
    userPrompt,
  });

  return amEditionSchema.parse(parsed);
}

export async function writePmEdition(plan: PlannerOutput): Promise<PmEditionOutput> {
  const systemPrompt = `You write evening full system design challenges for a daily challenger app.
Return JSON only matching this shape:
{
  "title": "short title",
  "prompt": "full design scenario paragraph",
  "constraints": ["4-5 NFRs with numbers"],
  "tasks": {
    "sections": [
      {"id": "requirements", "title": "Requirements", "description": "..."},
      {"id": "api", "title": "API Design", "description": "..."},
      {"id": "hldNotes", "title": "High-Level Design", "description": "..."},
      {"id": "deepDive", "title": "Deep Dive", "description": "..."},
      {"id": "failureModes", "title": "Failure Modes", "description": "..."}
    ]
  },
  "rubric": ["5-6 evaluation criteria"],
  "followUpProbes": ["3 interviewer follow-up questions"],
  "referenceOutline": "detailed markdown reference solution"
}`;

  const userPrompt = `Topic: ${plan.topic}
Skills: ${plan.skills.join(", ")}
Difficulty: ${plan.difficulty}/5
Style: ${plan.companyStyle}
This continues this morning's warm-up on the same topic. Reference earlier estimates naturally.`;

  const { parsed } = await generateJson<PmEditionOutput>({
    systemPrompt,
    userPrompt,
  });

  return pmEditionSchema.parse(parsed);
}
