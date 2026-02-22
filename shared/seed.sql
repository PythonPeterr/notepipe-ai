-- ============================================================
-- NOTEPIPE — Seed Data
-- 1 default prompt + 1 action_config row, seeded per user on first login.
-- Called by POST /prompts/seed — replace :user_id with actual UUID.
--
-- Idempotent: uses a check to avoid duplicate seeding.
-- The backend should call this only if the user has 0 prompts.
-- ============================================================

-- Guard: only seed if user has no prompts yet
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM prompts WHERE user_id = :user_id LIMIT 1) THEN
    INSERT INTO prompts (user_id, name, description, system_prompt, is_default) VALUES
    (
      :user_id,
      'B2B Sales Call',
      'Extract contact, company, deal stage, and follow-ups from B2B sales calls.',
      'You are extracting CRM data from a B2B sales call. Focus on: who the decision maker is, what their budget range is, what pain they described, what their timeline is, and what stage of evaluation they are in.',
      true
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM action_configs WHERE user_id = :user_id LIMIT 1) THEN
    INSERT INTO action_configs (user_id) VALUES (:user_id);
  END IF;
END $$;
