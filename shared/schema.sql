-- ============================================================
-- NOTEPIPE — Canonical Supabase DDL
-- Run this in Supabase SQL editor to create all tables.
-- ============================================================

-- connections
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('fireflies', 'hubspot', 'pipedrive')),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, service)
);
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_connections" ON connections FOR ALL USING (auth.uid() = user_id);

-- templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  system_prompt TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  crm_actions JSONB NOT NULL DEFAULT '{
    "create_contact": true,
    "create_company": true,
    "attach_note": true,
    "update_deal_stage": false,
    "extract_followups": true
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_templates" ON templates FOR ALL USING (auth.uid() = user_id);

-- runs
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  fireflies_meeting_id TEXT NOT NULL,
  meeting_title TEXT DEFAULT 'Untitled Meeting',
  meeting_date TIMESTAMPTZ,
  crm_target TEXT NOT NULL CHECK (crm_target IN ('hubspot', 'pipedrive')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  extracted_data JSONB,
  crm_results JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_runs" ON runs FOR ALL USING (auth.uid() = user_id);

-- webhook_events (no RLS — service role only)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  user_id UUID,
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
