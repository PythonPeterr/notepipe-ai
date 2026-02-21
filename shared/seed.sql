-- ============================================================
-- NOTEPIPE — Seed Data
-- 4 default prompt templates, seeded per user on first login.
-- Called by POST /templates/seed — replace :user_id with actual UUID.
-- ============================================================

INSERT INTO templates (user_id, name, description, system_prompt, is_default, crm_actions) VALUES
(
  :user_id,
  'B2B Sales Call',
  'Extract contact, company, deal stage, and follow-ups from B2B sales calls.',
  'You are extracting CRM data from a B2B sales call. Focus on: who the decision maker is, what their budget range is, what pain they described, what their timeline is, and what stage of evaluation they are in.',
  TRUE,
  '{"create_contact": true, "create_company": true, "attach_note": true, "update_deal_stage": true, "extract_followups": true}'
),
(
  :user_id,
  'Discovery Call',
  'Extract pain points, decision makers, and next steps from discovery calls.',
  'You are extracting CRM data from a discovery call. Focus on: the prospect company size and industry, who you spoke with and their role, what problems they described, and what the agreed next steps are.',
  FALSE,
  '{"create_contact": true, "create_company": true, "attach_note": true, "update_deal_stage": false, "extract_followups": true}'
),
(
  :user_id,
  'Recruitment Interview',
  'Extract candidate details and assessment from recruitment interviews.',
  'You are extracting data from a recruitment interview. Focus on: candidate name and contact details, the role they applied for, key strengths mentioned, concerns raised, and recommended next step.',
  FALSE,
  '{"create_contact": true, "create_company": true, "attach_note": true, "update_deal_stage": false, "extract_followups": true}'
),
(
  :user_id,
  'Customer Success',
  'Extract health signals, risks, and action items from customer success calls.',
  'You are extracting data from a customer success call. Focus on: what the customer said about their experience, any risks or churn signals mentioned, what they asked for, and what action items were agreed.',
  FALSE,
  '{"create_contact": true, "create_company": false, "attach_note": true, "update_deal_stage": false, "extract_followups": true}'
);
