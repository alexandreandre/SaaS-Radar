export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          claude_prompt: string | null;
          acquisition: Json;
          entrepreneurs_building: number;
          foreign_inspiration: string | null;
          weekly_pick: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["opportunities"]["Row"]> & {
          slug: string;
          name: string;
          pitch: string;
        };
        Update: Partial<Database["public"]["Tables"]["opportunities"]["Row"]>;
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
          opportunities_viewed_this_month: number;
          last_reset_at: string;
          created_at: string;
        };
        Insert: { id: string } & Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
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
    };
  };
};
