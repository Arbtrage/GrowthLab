-- GrowthLab initial schema + RLS + profile trigger
-- Run via: npm run db:migrate (or apply in Supabase SQL editor)

CREATE TYPE edition_slot AS ENUM ('am', 'pm');
CREATE TYPE goal_module AS ENUM ('leetcode', 'system-design', 'global');
CREATE TYPE goal_type AS ENUM ('daily', 'weekly');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_hour INTEGER NOT NULL DEFAULT 21,
  leetcode_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sysdesign_email_enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module goal_module NOT NULL,
  type goal_type NOT NULL,
  metric_key TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  achieved_value INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB,
  date DATE NOT NULL,
  UNIQUE(user_id, date, type, module)
);

CREATE TABLE leetcode_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  leetcode_username TEXT NOT NULL,
  daily_goal INTEGER NOT NULL DEFAULT 2,
  difficulty_pref TEXT NOT NULL DEFAULT 'mixed',
  tags_focus JSONB,
  gemini_model TEXT NOT NULL DEFAULT 'gemini-2.0-flash'
);

CREATE TABLE leetcode_daily_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_solved INTEGER NOT NULL,
  easy_solved INTEGER NOT NULL,
  medium_solved INTEGER NOT NULL,
  hard_solved INTEGER NOT NULL,
  streak INTEGER NOT NULL,
  submission_count_today INTEGER NOT NULL DEFAULT 0,
  calendar_fragment JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE leetcode_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  lang TEXT NOT NULL,
  UNIQUE(user_id, title_slug, timestamp)
);

CREATE TABLE leetcode_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  problems JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE sd_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  slot edition_slot NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  constraints JSONB NOT NULL,
  tasks JSONB NOT NULL,
  rubric JSONB NOT NULL,
  follow_up_probes JSONB NOT NULL DEFAULT '[]',
  reference_outline TEXT NOT NULL,
  paired_edition_id UUID REFERENCES sd_editions(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, slot)
);

CREATE TABLE sd_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  edition_id UUID NOT NULL REFERENCES sd_editions(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '{}',
  mermaid_diagram TEXT NOT NULL DEFAULT '',
  excalidraw_state JSONB,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, edition_id)
);

CREATE TABLE sd_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL UNIQUE REFERENCES sd_submissions(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  strengths JSONB NOT NULL,
  gaps JSONB NOT NULL,
  follow_up_answers JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sd_topic_rotation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL UNIQUE,
  last_used_at TIMESTAMPTZ NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE sd_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID REFERENCES sd_editions(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  raw_response TEXT,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leetcode_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sd_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_own ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY user_preferences_own ON user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY learning_goals_own ON learning_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY activity_events_own ON activity_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY notification_logs_own ON notification_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY leetcode_profiles_own ON leetcode_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY leetcode_snapshots_own ON leetcode_daily_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY leetcode_submissions_own ON leetcode_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY leetcode_suggestions_own ON leetcode_ai_suggestions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY sd_submissions_own ON sd_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY sd_feedback_own ON sd_feedback FOR ALL
  USING (EXISTS (SELECT 1 FROM sd_submissions s WHERE s.id = submission_id AND s.user_id = auth.uid()));

-- Public read for editions (same challenge for all users)
ALTER TABLE sd_editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sd_editions_read ON sd_editions FOR SELECT USING (true);

CREATE INDEX idx_activity_events_user_occurred ON activity_events(user_id, occurred_at);
CREATE INDEX idx_leetcode_snapshots_user_date ON leetcode_daily_snapshots(user_id, date);
CREATE INDEX idx_sd_submissions_user ON sd_submissions(user_id);
