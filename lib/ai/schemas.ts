import { z } from "zod";

export const plannerOutputSchema = z.object({
  topic: z.string(),
  skills: z.array(z.string()),
  difficulty: z.number().int().min(1).max(5),
  companyStyle: z.enum(["generic", "startup", "meta", "google", "amazon"]),
});

export const amTasksSchema = z.object({
  clarifyingQuestions: z.string(),
  backOfEnvelope: z.string(),
  tradeOff: z.string(),
});

export const amEditionSchema = z.object({
  title: z.string(),
  prompt: z.string(),
  constraints: z.array(z.string()),
  tasks: z.object({
    clarifyingQuestionsPrompt: z.string(),
    backOfEnvelopePrompt: z.string(),
    tradeOffPrompt: z.string(),
  }),
  rubric: z.array(z.string()),
  referenceOutline: z.string(),
});

export const pmEditionSchema = z.object({
  title: z.string(),
  prompt: z.string(),
  constraints: z.array(z.string()),
  tasks: z.object({
    sections: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
      }),
    ),
  }),
  rubric: z.array(z.string()),
  followUpProbes: z.array(z.string()),
  referenceOutline: z.string(),
});

export const feedbackOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  followUpAnswers: z.array(
    z.object({
      probe: z.string(),
      answer: z.string(),
    }),
  ),
});

export type PlannerOutput = z.infer<typeof plannerOutputSchema>;
export type AmEditionOutput = z.infer<typeof amEditionSchema>;
export type PmEditionOutput = z.infer<typeof pmEditionSchema>;
export type FeedbackOutput = z.infer<typeof feedbackOutputSchema>;

export const TOPICS = [
  "rate-limiter",
  "url-shortener",
  "notification-system",
  "chat-messaging",
  "news-feed",
  "video-streaming",
  "file-storage",
  "search-engine",
  "payment-system",
  "ride-sharing",
  "distributed-cache",
  "analytics-pipeline",
  "ticket-booking",
  "e-commerce-cart",
  "leaderboard",
  "web-crawler",
  "cdn",
  "email-service",
  "distributed-lock",
  "key-value-store",
] as const;

export type SubmissionSections = {
  clarifyingQuestions?: string;
  backOfEnvelope?: string;
  tradeOff?: string;
  requirements?: string;
  api?: string;
  hldNotes?: string;
  deepDive?: string;
  failureModes?: string;
};

export const PM_SECTIONS = [
  { id: "requirements", title: "Requirements", description: "Functional and non-functional requirements, scope, and assumptions." },
  { id: "api", title: "API Design", description: "Key endpoints, request/response shapes, and idempotency." },
  { id: "hldNotes", title: "High-Level Design", description: "Core components, data flow, and scaling approach." },
  { id: "deepDive", title: "Deep Dive", description: "Pick one component and explain it in detail." },
  { id: "failureModes", title: "Failure Modes", description: "What breaks at scale and how you handle it." },
] as const;
