import { and, eq, gte } from "drizzle-orm";
import { db, sdTopicRotation } from "@/lib/db";
import { generateJson } from "@/lib/ai/client";
import { plannerOutputSchema, TOPICS, type PlannerOutput } from "@/lib/ai/schemas";

const COOLDOWN_DAYS = 14;

export async function planEdition(params: {
  slot: "am" | "pm";
  date: Date;
  amTopic?: string;
}): Promise<PlannerOutput> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - COOLDOWN_DAYS);

  const recentTopics = await db
    .select({ topic: sdTopicRotation.topic })
    .from(sdTopicRotation)
    .where(gte(sdTopicRotation.lastUsedAt, cutoff));

  const usedSet = new Set(recentTopics.map((t) => t.topic));
  const availableTopics = TOPICS.filter((t) => !usedSet.has(t));
  const topicPool =
    params.slot === "pm" && params.amTopic
      ? [params.amTopic]
      : availableTopics.length > 0
        ? availableTopics
        : [...TOPICS];

  const systemPrompt = `You are a system design interview coach. Plan the next daily challenge.
Return JSON only with: topic, skills (array of 2-4 skills), difficulty (1-5), companyStyle (generic|startup|meta|google|amazon).`;

  const userPrompt = `Slot: ${params.slot}
Date: ${params.date.toISOString().split("T")[0]}
Available topics: ${topicPool.join(", ")}
Recently used: ${[...usedSet].join(", ") || "none"}
${params.amTopic ? `Morning topic: ${params.amTopic}` : ""}`;

  const { parsed } = await generateJson<PlannerOutput>({ systemPrompt, userPrompt });
  const validated = plannerOutputSchema.parse(parsed);
  if (params.slot === "pm" && params.amTopic) validated.topic = params.amTopic;
  return validated;
}

export async function recordTopicUsage(topic: string) {
  const [existing] = await db
    .select()
    .from(sdTopicRotation)
    .where(eq(sdTopicRotation.topic, topic))
    .limit(1);

  if (existing) {
    await db
      .update(sdTopicRotation)
      .set({ lastUsedAt: new Date(), useCount: existing.useCount + 1 })
      .where(eq(sdTopicRotation.id, existing.id));
  } else {
    await db.insert(sdTopicRotation).values({ topic, lastUsedAt: new Date(), useCount: 1 });
  }
}
