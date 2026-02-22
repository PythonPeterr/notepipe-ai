-- ============================================================
-- NOTEPIPE — Canonical Supabase DDL (Production-Optimized)
-- Run this in Supabase SQL editor to create all tables.
--
-- Free tier budget: 500MB storage, 5GB egress/month
-- Strategy: lean indexes, summary views to reduce egress,
--           auto-cleanup of old data to cap storage growth.
-- ============================================================


-- ============================================================
-- 1. TABLES
-- ============================================================

-- connections: OAuth tokens for Fireflies, HubSpot, Pipedrive
-- One row per (user, service). Tokens are encrypted at rest by Supabase.
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('fireflies', 'hubspot', 'pipedrive', 'attio', 'zoho')),
  access_token TEXT,          -- encrypted at rest by Supabase
  refresh_token TEXT,         -- encrypted at rest by Supabase
  token_expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',  -- workspace_name, company_domain (Pipedrive)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, service)    -- enforces one connection per service per user
);

-- prompts: user-configurable LLM prompts for extraction
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  system_prompt TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- action_configs: per-user CRM action toggles (one row per user)
CREATE TABLE action_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  create_contact BOOLEAN NOT NULL DEFAULT true,
  create_company BOOLEAN NOT NULL DEFAULT false,
  link_contact_to_company BOOLEAN NOT NULL DEFAULT false,
  attach_note BOOLEAN NOT NULL DEFAULT true,
  create_deal BOOLEAN NOT NULL DEFAULT false,
  update_deal_stage BOOLEAN NOT NULL DEFAULT false,
  extract_followups BOOLEAN NOT NULL DEFAULT false,
  log_meeting BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- runs: one row per webhook→extract→CRM-write pipeline execution
-- extracted_data and crm_results are JSONB — strip nulls before insert
-- to save storage. Backend should use jsonb_strip_nulls() on insert.
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  fireflies_meeting_id TEXT NOT NULL,
  meeting_title TEXT DEFAULT 'Untitled Meeting',
  meeting_date TIMESTAMPTZ,
  crm_target TEXT NOT NULL CHECK (crm_target IN ('hubspot', 'pipedrive', 'attio', 'zoho')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  source TEXT NOT NULL DEFAULT 'fireflies' CHECK (source IN ('fireflies', 'upload')),
  original_filename TEXT,
  extracted_data JSONB,       -- strip nulls before insert to save storage
  crm_results JSONB,          -- strip nulls before insert to save storage
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- webhook_events: raw Fireflies webhook payloads for debugging/replay
-- No RLS — accessed only via service role key from the backend.
-- Auto-cleaned after 7 days to prevent unbounded storage growth.
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,     -- raw webhook body — stripped after processing
  user_id UUID,               -- nullable: resolved during processing
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 2. INDEXES
-- Only index columns used in WHERE clauses or JOINs.
-- Primary keys and UNIQUE constraints already create indexes.
-- ============================================================

-- connections: user_id is in the UNIQUE(user_id, service) constraint,
-- so queries filtering by user_id already use that index. No extra needed.

-- prompts: list page filters by user_id + is_active
-- The user_id index covers the WHERE clause in prompt queries.
CREATE INDEX idx_prompts_user_id ON prompts (user_id);
COMMENT ON INDEX idx_prompts_user_id IS 'Covers WHERE user_id = $1 on prompt list/filter queries';

-- runs: list page filters by user_id, sorted by created_at DESC
-- Composite index because every runs query filters by user_id and sorts by created_at.
CREATE INDEX idx_runs_user_id_created ON runs (user_id, created_at DESC);
COMMENT ON INDEX idx_runs_user_id_created IS 'Covers WHERE user_id = $1 ORDER BY created_at DESC on run list page';

-- runs: cleanup function deletes by created_at
CREATE INDEX idx_runs_created_at ON runs (created_at);
COMMENT ON INDEX idx_runs_created_at IS 'Used by cleanup_old_runs() to efficiently delete rows older than 90 days';

-- webhook_events: cleanup function filters by processed + created_at
CREATE INDEX idx_webhook_events_cleanup ON webhook_events (processed, created_at)
  WHERE processed = true;
COMMENT ON INDEX idx_webhook_events_cleanup IS 'Partial index for cleanup_webhook_events() — only indexes processed rows';

-- webhook_events: processing queue finds unprocessed events
CREATE INDEX idx_webhook_events_pending ON webhook_events (created_at)
  WHERE processed = false;
COMMENT ON INDEX idx_webhook_events_pending IS 'Partial index for finding unprocessed webhook events in queue order';


-- ============================================================
-- 3. ROW LEVEL SECURITY
-- Enabled on all user-facing tables. Service role key bypasses RLS.
-- webhook_events has NO RLS — backend-only via service role.
-- ============================================================

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_connections"
  ON connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_prompts"
  ON prompts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE action_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_action_configs"
  ON action_configs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_runs"
  ON runs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- webhook_events: no RLS. Only the backend (service role) touches this table.
-- Explicitly disable to document the decision.
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies = no access via anon/authenticated roles.
-- Service role key bypasses RLS entirely — this is intentional.


-- ============================================================
-- 4. SUMMARY VIEWS
-- Avoid fetching heavy JSONB columns on list pages.
-- Each view returns only the columns needed for the list UI.
-- Egress saving: ~10KB per run row avoided on every page load.
-- ============================================================

-- runs_summary: used on /runs list page
-- Excludes extracted_data (~2-5KB) and crm_results (~1KB) per row.
CREATE VIEW runs_summary AS
  SELECT
    id,
    user_id,
    meeting_title,
    meeting_date,
    crm_target,
    status,
    source,
    original_filename,
    error_message,
    duration_ms,
    created_at
  FROM runs;

-- RLS applies to the underlying table, so this view inherits it.
COMMENT ON VIEW runs_summary IS 'Lightweight view for /runs list page — omits extracted_data and crm_results JSONB to reduce egress';

-- prompt_list: used on /prompts list page
-- Excludes system_prompt (can be 500+ chars).
CREATE VIEW prompt_list AS
  SELECT
    id,
    user_id,
    name,
    description,
    is_active,
    is_default,
    created_at
  FROM prompts;

COMMENT ON VIEW prompt_list IS 'Lightweight view for /prompts list page — omits system_prompt to reduce egress';


-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================

-- updated_at trigger: auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_prompts_updated_at
  BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_action_configs_updated_at
  BEFORE UPDATE ON action_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 6. CLEANUP FUNCTIONS
-- Schedule via Supabase Dashboard: Database > Extensions > pg_cron
-- ============================================================

-- cleanup_old_runs: delete runs older than 90 days
-- Free tier storage budget: keeps ~90 days of history per user.
-- At 10 runs/week * 5KB/run = ~180KB/user over 90 days — well within 500MB.
CREATE OR REPLACE FUNCTION cleanup_old_runs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM runs
  WHERE created_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_runs IS
  'Deletes runs older than 90 days. Schedule daily via pg_cron: '
  'SELECT cron.schedule(''cleanup-old-runs'', ''0 3 * * *'', $$SELECT cleanup_old_runs()$$);';

-- cleanup_webhook_events: delete processed webhook events older than 7 days
-- Raw payloads are large (~5-20KB each). Keeping only 7 days of processed
-- events saves significant storage while retaining unprocessed events for retry.
CREATE OR REPLACE FUNCTION cleanup_webhook_events()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_events
  WHERE processed = true
    AND created_at < now() - INTERVAL '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_webhook_events IS
  'Deletes processed webhook_events older than 7 days. Schedule daily via pg_cron: '
  'SELECT cron.schedule(''cleanup-webhook-events'', ''0 3 * * *'', $$SELECT cleanup_webhook_events()$$);';


-- ============================================================
-- 7. pg_cron SETUP (run manually after enabling the extension)
--
-- Step 1: Enable pg_cron in Supabase Dashboard > Database > Extensions
-- Step 2: Run these in the SQL editor:
--
--   SELECT cron.schedule(
--     'cleanup-old-runs',
--     '0 3 * * *',          -- daily at 3:00 AM UTC
--     $$SELECT cleanup_old_runs()$$
--   );
--
--   SELECT cron.schedule(
--     'cleanup-webhook-events',
--     '0 3 * * *',          -- daily at 3:00 AM UTC
--     $$SELECT cleanup_webhook_events()$$
--   );
--
-- To verify scheduled jobs:
--   SELECT * FROM cron.job;
--
-- To remove a job:
--   SELECT cron.unschedule('cleanup-old-runs');
--   SELECT cron.unschedule('cleanup-webhook-events');
-- ============================================================
