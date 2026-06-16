export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminRole = "none" | "viewer" | "editor" | "owner";
export type OpportunityStatus = "draft" | "published" | "archived";
export type DraftStatus = "pending" | "approved" | "rejected" | "published";

export type Database = {
  public: {
    Tables: {
      opportunities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          pitch: string;
          origin_country: string;
          origin_country_code: string;
          origin_flag: string;
          sector: string;
          target_client: string;
          client_type: string;
          tech_complexity: string;
          france_competition: string;
          revenue_min: number;
          revenue_max: number;
          buildable_under_30_days: boolean;
          boring_business: boolean;
          ai_powered: boolean;
          low_competition: boolean;
          scores: Json;
          france_fit_criteria: Json;
          traction_signals: Json;
          why_it_works: Json;
          france_analysis: Json;
          financial_scenarios: Json;
          cac_channels: Json;
          mvp_plan: Json;
          claude_prompt: string;
          acquisition: Json;
          entrepreneurs_building: number;
          foreign_inspiration: string;
          url: string | null;
          weekly_pick: boolean;
          status: OpportunityStatus;
          published_at: string | null;
          created_at: string;
          foreign_market_profile: Json | null;
          infra_costs: Json | null;
          french_competitors: Json | null;
          launch_timeline: Json | null;
          email_templates: Json | null;
          partners_fr: Json | null;
          roi_inputs: Json | null;
          tam_breakdown: Json | null;
          competition_alerts: Json | null;
        };
        Insert: Partial<Database["public"]["Tables"]["opportunities"]["Row"]> & {
          slug: string;
          name: string;
          pitch: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Row"]>;
      };
      sourcing_runs: {
        Row: {
          id: string;
          started_at: string;
          finished_at: string | null;
          status: string;
          count_requested: number;
          count_discovered: number;
          count_structured: number;
          count_written: number;
          sector: string | null;
          premium: boolean;
          origin_country_code: string | null;
          cost_line: string | null;
          cost_usd: number | null;
          tokens_input: number;
          tokens_output: number;
          events: Json;
          triggered_by: string | null;
          config: Json;
          skipped: Json;
          error: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["sourcing_runs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sourcing_runs"]["Row"]>;
      };
      opportunity_drafts: {
        Row: {
          id: string;
          source_run_id: string | null;
          slug: string;
          name: string;
          payload: Json;
          score: number | null;
          status: DraftStatus;
          dedup_matches: Json;
          review_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          source_lead: Json | null;
          auto_publish_rule_id: string | null;
          source_verified: boolean | null;
          invalid_urls: Json;
          verification_level: string;
          needs_review: boolean;
          fact_confidence: string | null;
          premium_verified: boolean | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["opportunity_drafts"]["Row"]> & {
          slug: string;
          name: string;
          payload: Json;
        };
        Update: Partial<Database["public"]["Tables"]["opportunity_drafts"]["Row"]>;
      };
      sourcing_schedules: {
        Row: {
          id: string;
          enabled: boolean;
          cron_expr: string;
          count: number;
          sector: string | null;
          premium: boolean;
          min_score: number | null;
          country_codes: string[];
          config: Json;
          last_run_at: string | null;
          next_run_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sourcing_schedules"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sourcing_schedules"]["Row"]>;
      };
      sourcing_settings: {
        Row: {
          id: string;
          default_mode: string;
          auto_publish_enabled: boolean;
          auto_publish_rules: Json;
          notify_on_pending: boolean;
          monthly_cost_cap_usd: number | null;
          discovery_model: string | null;
          structure_model: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sourcing_settings"]["Row"]> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["sourcing_settings"]["Row"]>;
      };
      sourcing_job_queue: {
        Row: {
          id: string;
          batch_id: string;
          run_id: string;
          country_code: string;
          status: string;
          attempts: number;
          max_attempts: number;
          payload: Json;
          error: string | null;
          scheduled_at: string;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sourcing_job_queue"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sourcing_job_queue"]["Row"]>;
      };
      sourcing_discover_cache: {
        Row: {
          id: string;
          cache_key: string;
          country_code: string;
          sector: string | null;
          leads: Json;
          expires_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sourcing_discover_cache"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sourcing_discover_cache"]["Row"]>;
      };
      sourcing_metrics_daily: {
        Row: {
          day: string;
          runs_total: number;
          runs_empty: number;
          drafts_written: number;
          drafts_verified: number;
          cost_usd: number;
          skip_reasons: Json;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sourcing_metrics_daily"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["sourcing_metrics_daily"]["Row"]>;
      };
      world_markets: {
        Row: {
          id: string;
          code: string;
          name: string;
          flag: string;
          scope: string;
          heat_score: number;
          tracked_micro_saas: number;
          new_this_month: number;
          avg_top_mrr_usd: number;
          trend: string;
          trends: Json;
          top_earners: Json;
          opportunity_slugs: Json;
          insight: string | null;
          is_manual_override: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["world_markets"]["Row"]> & {
          code: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["world_markets"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          plan: string;
          is_admin: boolean;
          admin_role: AdminRole;
          opportunities_viewed_this_month: number;
          last_reset_at: string;
          created_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          current_period_end: string | null;
          stripe_price_id: string | null;
          billing_interval: string | null;
        };
        Insert: { id: string } & Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      admin_audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_email: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          before_state: Json | null;
          after_state: Json | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_audit_log"]["Row"]> & {
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_audit_log"]["Row"]>;
      };
      admin_rate_limits: {
        Row: {
          key: string;
          window_start: string;
          count: number;
        };
        Insert: Database["public"]["Tables"]["admin_rate_limits"]["Row"];
        Update: Partial<Database["public"]["Tables"]["admin_rate_limits"]["Row"]>;
      };
      admin_sessions: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string | null;
          user_agent: string | null;
          auth_method: string;
          is_trusted: boolean;
          last_seen_at: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["admin_sessions"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_sessions"]["Row"]>;
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          status: string;
          source: string | null;
          unsubscribe_token: string;
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { email: string } & Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Row"]>;
      };
      newsletter_campaigns: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subject: string;
          body_html: string | null;
          body_text: string | null;
          status: string;
          scheduled_at: string | null;
          sent_at: string | null;
          recipient_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["newsletter_campaigns"]["Row"]> & {
          slug: string;
          title: string;
          subject: string;
        };
        Update: Partial<Database["public"]["Tables"]["newsletter_campaigns"]["Row"]>;
      };
      newsletter_events: {
        Row: {
          id: string;
          subscriber_id: string | null;
          campaign_id: string | null;
          event_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["newsletter_events"]["Row"]> & {
          event_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["newsletter_events"]["Row"]>;
      };
      billing_snapshots: {
        Row: {
          id: string;
          snapshot_date: string;
          mrr_cents: number;
          arr_cents: number;
          active_subscribers: number;
          free_count: number;
          builder_count: number;
          pro_count: number;
          past_due_count: number;
          churn_count: number;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["billing_snapshots"]["Row"]> & {
          snapshot_date: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_snapshots"]["Row"]>;
      };
      user_projects: {
        Row: {
          id: string;
          user_id: string;
          opportunity_slug: string | null;
          name: string;
          phase: string;
          mrr_cents: number;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_projects"]["Row"]> & {
          user_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_projects"]["Row"]>;
      };
      connector_snapshots: {
        Row: {
          id: string;
          project_id: string;
          connector_id: string;
          status: string;
          payload: Json;
          synced_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["connector_snapshots"]["Row"]> & {
          project_id: string;
          connector_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["connector_snapshots"]["Row"]>;
      };
      opportunity_favorites: {
        Row: {
          user_id: string;
          opportunity_slug: string;
          created_at: string;
        };
        Insert: { user_id: string; opportunity_slug: string; created_at?: string };
        Update: never;
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          opportunity_id: string;
          created_at: string;
        };
        Insert: { user_id: string; opportunity_id: string };
        Update: never;
      };
      waitlist: {
        Row: {
          id: string;
          email: string;
          source: string | null;
          created_at: string;
        };
        Insert: { email: string; source?: string };
        Update: never;
      };
      stripe_events: {
        Row: {
          id: string;
          type: string | null;
          received_at: string;
        };
        Insert: { id: string; type?: string | null };
        Update: never;
      };
    };
  };
};
