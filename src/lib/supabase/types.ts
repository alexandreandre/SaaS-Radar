export interface OpportunityRow {
  id: string
  slug: string
  name: string
  pitch: string
  origin_country: string
  origin_country_code: string
  origin_flag: string
  sector: string
  target_client: string
  client_type: string
  tech_complexity: string
  france_competition: string
  revenue_min: number
  revenue_max: number
  buildable_under_30_days: boolean
  boring_business: boolean
  ai_powered: boolean
  low_competition: boolean
  weekly_pick: boolean
  entrepreneurs_building: number
  foreign_inspiration: string
  claude_prompt: string
  url: string | null
  created_at: string
  scores: Record<string, number>
  france_fit_criteria: Record<string, unknown>
  traction_signals: unknown[]
  why_it_works: unknown[]
  france_analysis: string[]
  financial_scenarios: unknown[]
  cac_channels: unknown[]
  acquisition: unknown[]
  mvp_plan: Record<string, unknown>
  foreign_market_profile: Record<string, unknown> | null
  infra_costs: unknown[] | null
  french_competitors: unknown[] | null
  launch_timeline: unknown[] | null
  email_templates: unknown[] | null
  partners_fr: unknown[] | null
  roi_inputs: unknown[] | null
  tam_breakdown: Record<string, unknown> | null
  competition_alerts: unknown[] | null
}
