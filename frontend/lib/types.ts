export type ConnectionService = 'fireflies' | 'hubspot' | 'pipedrive' | 'attio' | 'zoho'
export type RunStatus = 'pending' | 'success' | 'failed'
export type CRMTarget = 'hubspot' | 'pipedrive' | 'attio' | 'zoho'
export type RunSource = 'fireflies' | 'upload'

export interface Connection {
  id: string
  user_id: string
  service: ConnectionService
  metadata: {
    workspace_name?: string
    company_domain?: string
  }
  created_at: string
}

export interface Prompt {
  id: string
  user_id: string
  name: string
  description: string
  system_prompt: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PromptSummary {
  id: string
  user_id: string
  name: string
  description: string
  is_active: boolean
  is_default: boolean
  created_at: string
}

export interface ActionConfig {
  id: string
  user_id: string
  create_contact: boolean
  create_company: boolean
  link_contact_to_company: boolean
  attach_note: boolean
  create_deal: boolean
  update_deal_stage: boolean
  extract_followups: boolean
  log_meeting: boolean
  created_at: string
  updated_at: string
}

export interface ExtractedContact {
  name: string
  email: string
  phone: string | null
  title: string | null
}

export interface ExtractedCompany {
  name: string
  domain: string | null
  industry: string | null
}

export interface FollowUp {
  owner: string
  action: string
  due_date: string | null
}

export interface ExtractedData {
  contact: ExtractedContact
  company: ExtractedCompany
  meeting_summary: string
  deal_stage: string | null
  follow_ups: FollowUp[]
  custom_fields: Record<string, unknown>
}

export interface CRMResults {
  contact_id?: string
  company_id?: string
  note_id?: string
  deal_id?: string
  meeting_id?: string
  errors?: string[]
}

export interface Run {
  id: string
  user_id: string
  prompt_id: string | null
  fireflies_meeting_id: string
  meeting_title: string
  meeting_date: string | null
  crm_target: CRMTarget
  status: RunStatus
  source: RunSource
  original_filename: string | null
  extracted_data: ExtractedData | null
  crm_results: CRMResults | null
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

export interface RunSummary {
  id: string
  user_id: string
  meeting_title: string
  meeting_date: string | null
  crm_target: CRMTarget
  status: RunStatus
  source: RunSource
  original_filename: string | null
  error_message: string | null
  duration_ms: number | null
  created_at: string
}


export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
}

export interface APIError {
  detail: string
  code?: string
}
