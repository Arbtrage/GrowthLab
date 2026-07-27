-- Practice editions, practice submissions/feedback, chat tables

ALTER TABLE sd_generation_logs
  ADD COLUMN IF NOT EXISTS practice_edition_id UUID,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'daily';

CREATE TABLE IF NOT EXISTS sd_practice_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slot edition_slot NOT NULL DEFAULT 'pm',
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  constraints JSONB NOT NULL,
  tasks JSONB NOT NULL,
  rubric JSONB NOT NULL,
  follow_up_probes JSONB NOT NULL DEFAULT '[]',
  reference_outline TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sd_practice_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  practice_edition_id UUID NOT NULL REFERENCES sd_practice_editions(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '{}',
  mermaid_diagram TEXT NOT NULL DEFAULT '',
  excalidraw_state JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, practice_edition_id)
);

CREATE TABLE IF NOT EXISTS sd_practice_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES sd_practice_submissions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  strengths JSONB NOT NULL,
  gaps JSONB NOT NULL,
  follow_up_answers JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sd_practice_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_practice_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_practice_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY sd_practice_editions_own ON sd_practice_editions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY sd_practice_submissions_own ON sd_practice_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY sd_practice_feedback_own ON sd_practice_feedback FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sd_practice_submissions s
    WHERE s.id = submission_id AND s.user_id = auth.uid()
  ));
CREATE POLICY chat_conversations_own ON chat_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY chat_messages_own ON chat_messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM chat_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_sd_practice_editions_user ON sd_practice_editions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
