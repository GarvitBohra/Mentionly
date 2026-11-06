export type Brand = {
  id: string;
  organization_id?: string;
  name: string;
  website: string;
  industry: string;
  country: string;
  language: string;
  description?: string;
  is_default?: boolean;
  created_at: string;
  updated_at?: string;
  competitors?: Competitor[];
};

export type Competitor = {
  id: string;
  brand_id: string;
  name: string;
  website?: string;
  created_at?: string;
};

export type PromptCategory =
  | "Discovery"
  | "Recommendation"
  | "Comparison"
  | "Purchase Intent"
  | "Problem Solving";

export type Prompt = {
  id: string;
  brand_id: string;
  query_text: string;
  category: PromptCategory;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type MonitoringRunStatus = "pending" | "running" | "completed" | "failed";

export type MonitoringRun = {
  id: string;
  brand_id: string;
  status: MonitoringRunStatus;
  total_prompts: number;
  completed_prompts: number;
  visibility_score: number;
  brand_mention_rate: number;
  competitor_mention_rate: number;
  recommendation_rate: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
};

export type CompetitorMention = {
  name: string;
  mentioned: boolean;
  position?: number;
};

export type MonitoringResult = {
  id: string;
  run_id: string;
  prompt_id?: string;
  prompt_query: string;
  prompt_category: PromptCategory;
  raw_response: string;
  brand_mentioned: boolean;
  brand_recommended: boolean;
  brand_position?: number;
  mention_context?: string;
  competitors_mentioned: CompetitorMention[];
  has_grounding: boolean;
  error?: string;
  created_at: string;
  citations?: Citation[];
};

export type Citation = {
  id: string;
  monitoring_result_id?: string;
  brand_id: string;
  title?: string;
  url: string;
  domain: string;
  snippet?: string;
  associated_prompt?: string;
  mentions_brand?: boolean;
  created_at: string;
};

export type GEOCategory =
  | "Website Content"
  | "Brand Authority"
  | "Missing Information"
  | "Competitor Insights"
  | "Content Opportunities";

export type GEOPriority = "High" | "Medium" | "Low";
export type GEOStatus = "open" | "in_progress" | "applied" | "dismissed";

export type GEORecommendation = {
  id: string;
  brand_id: string;
  run_id?: string;
  title: string;
  category: GEOCategory;
  explanation: string;
  evidence: string;
  suggested_action: string;
  priority: GEOPriority;
  status: GEOStatus;
  related_prompt?: string;
  related_source?: string;
  created_at: string;
  updated_at?: string;
};

export type DashboardAnalytics = {
  is_demo: boolean;
  selected_brand: Brand;
  kpis: {
    visibility_score: number;
    brand_mention_rate: number;
    competitor_mention_rate: number;
    prompts_monitored: number;
    sources_discovered: number;
  };
  trend: {
    date: string;
    visibility_score: number;
    brand_mentions: number;
    competitor_mentions: number;
  }[];
  brand_vs_competitor: {
    name: string;
    mention_rate: number;
    recommendation_rate: number;
    is_target_brand: boolean;
  }[];
  category_breakdown: {
    category: PromptCategory;
    prompts_count: number;
    brand_mention_rate: number;
    visibility_score: number;
  }[];
  recent_runs: MonitoringRun[];
  top_sources: {
    domain: string;
    count: number;
    mentions_brand_count: number;
    sample_url: string;
  }[];
  best_prompts: {
    query: string;
    category: string;
    brand_recommended: boolean;
    brand_position?: number;
  }[];
  missing_prompts: {
    query: string;
    category: string;
    competitors_present: string[];
  }[];
  latest_recommendations: GEORecommendation[];
};

