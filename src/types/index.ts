export type Competitor = { id: string; brand_id: string; name: string };

export type Prompt = { id: string; brand_id: string; query_text: string; created_at: string };

export type Brand = {
  id: string;
  name: string;
  keyword: string;
  created_at: string;
  competitors: Competitor[];
  prompts: Prompt[];
};

export type RunResult = {
  id: string;
  run_id: string;
  prompt_query: string;
  answer: string | null;
  brand_count: number;
  competitor_counts: Record<string, number>;
  error: string | null;
};

/** How visible one name was across the answers of a run. */
export type Visibility = {
  name: string;
  is_brand: boolean;
  answers_with_mention: number;
  total_mentions: number;
  percent: number;
};

export type RunSummary = {
  run: { id: string; created_at: string } | null;
  results: RunResult[];
  answered: number;
  visibility: Visibility[];
};
