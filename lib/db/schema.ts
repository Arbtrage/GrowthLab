import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const editionSlotEnum = pgEnum("edition_slot", ["am", "pm"]);
export const goalModuleEnum = pgEnum("goal_module", [
  "leetcode",
  "system-design",
  "global",
]);
export const goalTypeEnum = pgEnum("goal_type", ["daily", "weekly"]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  timezone: text("timezone").default("Asia/Kolkata").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
  notificationHour: integer("notification_hour").default(21).notNull(),
  leetcodeEmailEnabled: boolean("leetcode_email_enabled").default(true).notNull(),
  sysdesignEmailEnabled: boolean("sysdesign_email_enabled").default(true).notNull(),
});

export const learningGoals = pgTable("learning_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  module: goalModuleEnum("module").notNull(),
  type: goalTypeEnum("type").notNull(),
  metricKey: text("metric_key").notNull(),
  targetValue: integer("target_value").notNull(),
  achievedValue: integer("achieved_value").default(0).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activityEvents = pgTable("activity_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  module: text("module").notNull(),
  eventType: text("event_type").notNull(),
  metadata: jsonb("metadata"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
    type: text("type").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
    payload: jsonb("payload"),
    date: date("date").notNull(),
  },
  (t) => [unique().on(t.userId, t.date, t.type, t.module)],
);

export const leetcodeProfiles = pgTable("leetcode_profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  leetcodeUsername: text("leetcode_username").notNull(),
  dailyGoal: integer("daily_goal").default(2).notNull(),
  difficultyPref: text("difficulty_pref").default("mixed").notNull(),
  tagsFocus: jsonb("tags_focus"),
  geminiModel: text("gemini_model").default("gemini-3.5-flash-lite").notNull(),
});

export const leetcodeDailySnapshots = pgTable(
  "leetcode_daily_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    totalSolved: integer("total_solved").notNull(),
    easySolved: integer("easy_solved").notNull(),
    mediumSolved: integer("medium_solved").notNull(),
    hardSolved: integer("hard_solved").notNull(),
    streak: integer("streak").notNull(),
    submissionCountToday: integer("submission_count_today").default(0).notNull(),
    calendarFragment: jsonb("calendar_fragment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.date)],
);

export const leetcodeSubmissions = pgTable(
  "leetcode_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    titleSlug: text("title_slug").notNull(),
    title: text("title").notNull(),
    difficulty: text("difficulty").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    lang: text("lang").notNull(),
  },
  (t) => [unique().on(t.userId, t.titleSlug, t.timestamp)],
);

export const leetcodeAiSuggestions = pgTable(
  "leetcode_ai_suggestions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    problems: jsonb("problems").notNull(),
    status: text("status").default("pending").notNull(),
    modelUsed: text("model_used").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.date)],
);

export const sdEditions = pgTable(
  "sd_editions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    date: date("date").notNull(),
    slot: editionSlotEnum("slot").notNull(),
    topic: text("topic").notNull(),
    title: text("title").notNull(),
    prompt: text("prompt").notNull(),
    constraints: jsonb("constraints").notNull(),
    tasks: jsonb("tasks").notNull(),
    rubric: jsonb("rubric").notNull(),
    followUpProbes: jsonb("follow_up_probes").default([]).notNull(),
    referenceOutline: text("reference_outline").notNull(),
    pairedEditionId: uuid("paired_edition_id"),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.date, t.slot)],
);

export const sdSubmissions = pgTable(
  "sd_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => sdEditions.id, { onDelete: "cascade" }),
    sections: jsonb("sections").default({}).notNull(),
    mermaidDiagram: text("mermaid_diagram").default("").notNull(),
    excalidrawState: jsonb("excalidraw_state"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.editionId)],
);

export const sdFeedback = pgTable("sd_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .notNull()
    .unique()
    .references(() => sdSubmissions.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  strengths: jsonb("strengths").notNull(),
  gaps: jsonb("gaps").notNull(),
  followUpAnswers: jsonb("follow_up_answers").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sdTopicRotation = pgTable("sd_topic_rotation", {
  id: uuid("id").defaultRandom().primaryKey(),
  topic: text("topic").notNull().unique(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull(),
  useCount: integer("use_count").default(1).notNull(),
});

export const sdGenerationLogs = pgTable("sd_generation_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  editionId: uuid("edition_id").references(() => sdEditions.id, { onDelete: "set null" }),
  practiceEditionId: uuid("practice_edition_id"),
  source: text("source").default("daily").notNull(),
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens"),
  rawResponse: text("raw_response"),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sdPracticeEditions = pgTable("sd_practice_editions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  slot: editionSlotEnum("slot").default("pm").notNull(),
  topic: text("topic").notNull(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  constraints: jsonb("constraints").notNull(),
  tasks: jsonb("tasks").notNull(),
  rubric: jsonb("rubric").notNull(),
  followUpProbes: jsonb("follow_up_probes").default([]).notNull(),
  referenceOutline: text("reference_outline").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sdPracticeSubmissions = pgTable(
  "sd_practice_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    practiceEditionId: uuid("practice_edition_id")
      .notNull()
      .references(() => sdPracticeEditions.id, { onDelete: "cascade" }),
    sections: jsonb("sections").default({}).notNull(),
    mermaidDiagram: text("mermaid_diagram").default("").notNull(),
    excalidrawState: jsonb("excalidraw_state"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.practiceEditionId)],
);

export const sdPracticeFeedback = pgTable("sd_practice_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id")
    .notNull()
    .unique()
    .references(() => sdPracticeSubmissions.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  strengths: jsonb("strengths").notNull(),
  gaps: jsonb("gaps").notNull(),
  followUpAnswers: jsonb("follow_up_answers").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title"),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  toolCalls: jsonb("tool_calls"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type LeetcodeProfile = typeof leetcodeProfiles.$inferSelect;
export type SdEdition = typeof sdEditions.$inferSelect;
export type SdSubmission = typeof sdSubmissions.$inferSelect;
export type SdPracticeEdition = typeof sdPracticeEditions.$inferSelect;
export type SdPracticeSubmission = typeof sdPracticeSubmissions.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
