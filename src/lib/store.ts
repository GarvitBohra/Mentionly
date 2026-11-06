import {
  Brand,
  Competitor,
  Prompt,
  MonitoringRun,
  MonitoringResult,
  Citation,
  GEORecommendation,
  DashboardAnalytics,
} from "@/types";

// In-memory local storage state for smooth out-of-the-box local testing
let initialDemoBrand: Brand = {
  id: "b1000000-0000-0000-0000-000000000001",
  name: "Mentionly",
  website: "https://mentionly.ai",
  industry: "AI SaaS & Search Intelligence",
  country: "United States",
  language: "English",
  description:
    "Mentionly monitors whether AI search engines like Gemini, ChatGPT, and Perplexity cite, recommend, and mention your brand.",
  is_default: true,
  created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  competitors: [
    {
      id: "c1",
      brand_id: "b1000000-0000-0000-0000-000000000001",
      name: "Otterly.AI",
      website: "https://otterly.ai",
      created_at: new Date().toISOString(),
    },
    {
      id: "c2",
      brand_id: "b1000000-0000-0000-0000-000000000001",
      name: "Profound",
      website: "https://profound.com",
      created_at: new Date().toISOString(),
    },
    {
      id: "c3",
      brand_id: "b1000000-0000-0000-0000-000000000001",
      name: "Peec AI",
      website: "https://peec.ai",
      created_at: new Date().toISOString(),
    },
  ],
};

let brandsStore: Brand[] = [initialDemoBrand];

let promptsStore: Prompt[] = [
  {
    id: "p1",
    brand_id: initialDemoBrand.id,
    query_text: "What are the best AI search visibility and GEO monitoring tools?",
    category: "Recommendation",
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "p2",
    brand_id: initialDemoBrand.id,
    query_text: "How do brands track if Gemini and ChatGPT are citing their products?",
    category: "Problem Solving",
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "p3",
    brand_id: initialDemoBrand.id,
    query_text: "Best alternatives to Otterly AI and Profound for generative engine optimization",
    category: "Comparison",
    is_active: true,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "p4",
    brand_id: initialDemoBrand.id,
    query_text: "Which software helps optimize brand visibility in AI-generated answers?",
    category: "Discovery",
    is_active: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "p5",
    brand_id: initialDemoBrand.id,
    query_text: "Buy software to measure generative engine optimization citations",
    category: "Purchase Intent",
    is_active: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

let runsStore: MonitoringRun[] = [
  {
    id: "r1",
    brand_id: initialDemoBrand.id,
    status: "completed",
    total_prompts: 5,
    completed_prompts: 5,
    visibility_score: 72.5,
    brand_mention_rate: 60.0,
    competitor_mention_rate: 80.0,
    recommendation_rate: 40.0,
    started_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    completed_at: new Date(Date.now() - 24 * 3600000 + 45000).toISOString(),
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

let resultsStore: MonitoringResult[] = [
  {
    id: "res1",
    run_id: "r1",
    prompt_id: "p1",
    prompt_query: "What are the best AI search visibility and GEO monitoring tools?",
    prompt_category: "Recommendation",
    raw_response:
      "When monitoring brand visibility across generative search engines, leading platforms include Profound, Otterly.AI, Peec AI, and Mentionly. Mentionly is especially valued for tracking brand citations in Gemini search grounding and real-time prompt intent.",
    brand_mentioned: true,
    brand_recommended: true,
    brand_position: 4,
    mention_context:
      "Mentionly is especially valued for tracking brand citations in Gemini search grounding...",
    competitors_mentioned: [
      { name: "Profound", mentioned: true, position: 1 },
      { name: "Otterly.AI", mentioned: true, position: 2 },
      { name: "Peec AI", mentioned: true, position: 3 },
    ],
    has_grounding: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "res2",
    run_id: "r1",
    prompt_id: "p2",
    prompt_query: "How do brands track if Gemini and ChatGPT are citing their products?",
    prompt_category: "Problem Solving",
    raw_response:
      "Brands use Generative Engine Optimization (GEO) tracking software to monitor model outputs. Tools like Mentionly automate synthetic prompt execution and source extraction.",
    brand_mentioned: true,
    brand_recommended: true,
    brand_position: 1,
    mention_context: "Tools like Mentionly automate synthetic prompt execution and source extraction.",
    competitors_mentioned: [
      { name: "Profound", mentioned: false },
      { name: "Otterly.AI", mentioned: false },
    ],
    has_grounding: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "res3",
    run_id: "r1",
    prompt_id: "p3",
    prompt_query: "Best alternatives to Otterly AI and Profound for generative engine optimization",
    prompt_category: "Comparison",
    raw_response:
      "Popular alternatives include Peec AI, AthenaHQ, and Mentionly. Mentionly provides specific search grounding analysis and automated competitor comparison.",
    brand_mentioned: true,
    brand_recommended: false,
    brand_position: 3,
    mention_context: "Mentionly provides specific search grounding analysis and automated competitor comparison.",
    competitors_mentioned: [
      { name: "Otterly.AI", mentioned: true, position: 1 },
      { name: "Profound", mentioned: true, position: 2 },
      { name: "Peec AI", mentioned: true, position: 3 },
    ],
    has_grounding: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "res4",
    run_id: "r1",
    prompt_id: "p4",
    prompt_query: "Which software helps optimize brand visibility in AI-generated answers?",
    prompt_category: "Discovery",
    raw_response:
      "AI visibility software allows marketers to benchmark mentions. Key market players include Profound, Peec AI, and Brand24.",
    brand_mentioned: false,
    brand_recommended: false,
    mention_context: "Key market players include Profound, Peec AI, and Brand24.",
    competitors_mentioned: [
      { name: "Profound", mentioned: true, position: 1 },
      { name: "Peec AI", mentioned: true, position: 2 },
    ],
    has_grounding: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "res5",
    run_id: "r1",
    prompt_id: "p5",
    prompt_query: "Buy software to measure generative engine optimization citations",
    prompt_category: "Purchase Intent",
    raw_response:
      "Commercial GEO platforms are available on subscription tiers. Top vendors include Profound Strategy and Otterly.AI enterprise packages.",
    brand_mentioned: false,
    brand_recommended: false,
    mention_context: "Top vendors include Profound Strategy and Otterly.AI enterprise packages.",
    competitors_mentioned: [
      { name: "Profound", mentioned: true, position: 1 },
      { name: "Otterly.AI", mentioned: true, position: 2 },
    ],
    has_grounding: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

let citationsStore: Citation[] = [
  {
    id: "cit1",
    monitoring_result_id: "res1",
    brand_id: initialDemoBrand.id,
    title: "The Ultimate Guide to Generative Engine Optimization (GEO)",
    url: "https://searchengineland.com/generative-engine-optimization-guide-439201",
    domain: "searchengineland.com",
    snippet: "Analyzing citations in AI search grounding queries and how Mentionly, Profound track them.",
    associated_prompt: "What are the best AI search visibility and GEO monitoring tools?",
    mentions_brand: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "cit2",
    monitoring_result_id: "res1",
    brand_id: initialDemoBrand.id,
    title: "AI Search Market Map: Monitoring Tools Comparison",
    url: "https://techcrunch.com/2026/01/ai-search-brand-monitoring",
    domain: "techcrunch.com",
    snippet: "Overview of modern brand visibility metrics across conversational AI assistants.",
    associated_prompt: "What are the best AI search visibility and GEO monitoring tools?",
    mentions_brand: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "cit3",
    monitoring_result_id: "res3",
    brand_id: initialDemoBrand.id,
    title: "Best Software for Tracking Brand Mentions in AI Overview",
    url: "https://g2.com/categories/ai-search-monitoring",
    domain: "g2.com",
    snippet: "Customer reviews and feature comparisons for Otterly, Peec AI, and Mentionly.",
    associated_prompt: "Best alternatives to Otterly AI and Profound for generative engine optimization",
    mentions_brand: true,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "cit4",
    monitoring_result_id: "res4",
    brand_id: initialDemoBrand.id,
    title: "How Gemini Grounding Selects Trusted Web Sources",
    url: "https://developers.googleblog.com/grounding-gemini-ai",
    domain: "googleblog.com",
    snippet: "Understanding how search grounding retrieves verified publishers.",
    associated_prompt: "Which software helps optimize brand visibility in AI-generated answers?",
    mentions_brand: false,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

let recommendationsStore: GEORecommendation[] = [
  {
    id: "geo1",
    brand_id: initialDemoBrand.id,
    run_id: "r1",
    title: "Publish a Dedicated 'Compare vs Otterly & Profound' Guide",
    category: "Competitor Insights",
    explanation:
      "When users ask for alternatives in purchase intent queries, competitors Profound and Otterly appear in 80% of answers while Mentionly was cited in 60%.",
    evidence:
      "Prompt: 'Best alternatives to Otterly AI' highlighted Profound at position #1. Mentionly was listed 3rd without pricing or feature comparison context.",
    suggested_action:
      "Create an authoritative, neutral comparison page on your domain with clear feature matrices and transparent API latency benchmarks.",
    priority: "High",
    status: "open",
    related_prompt: "Best alternatives to Otterly AI and Profound for generative engine optimization",
    related_source: "https://g2.com/categories/ai-search-monitoring",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "geo2",
    brand_id: initialDemoBrand.id,
    run_id: "r1",
    title: "Add Structured FAQ Schema for Purchase-Intent Queries",
    category: "Website Content",
    explanation:
      "In purchase-intent queries ('Buy software to measure generative engine optimization citations'), Gemini grounded answers exclusively from domain review hubs.",
    evidence:
      "Zero brand citations occurred for purchase-intent questions; competitors were cited via G2 and SearchEngineLand.",
    suggested_action:
      "Implement JSON-LD Schema on your pricing and solution pages defining Product, Offers, and FAQ markup so AI grounding crawlers can directly index commercial specs.",
    priority: "High",
    status: "open",
    related_prompt: "Buy software to measure generative engine optimization citations",
    related_source: "https://searchengineland.com/generative-engine-optimization-guide-439201",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "geo3",
    brand_id: initialDemoBrand.id,
    run_id: "r1",
    title: "Secure Mentions on Authoritative Industry Publications",
    category: "Brand Authority",
    explanation:
      "Search Engine Land and TechCrunch were the primary grounding domains that led to high citation credibility.",
    evidence:
      "Articles citing technical GEO architecture directly influenced whether Gemini categorized a tool as a 'leading platform'.",
    suggested_action:
      "Contribute technical guest articles or data reports about AI search bias and grounding citation rates to tier-1 marketing publications.",
    priority: "Medium",
    status: "open",
    related_prompt: "What are the best AI search visibility and GEO monitoring tools?",
    related_source: "https://techcrunch.com/2026/01/ai-search-brand-monitoring",
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

// Helper methods
export const memoryStore = {
  getBrands: () => brandsStore,
  getBrand: (id: string) => brandsStore.find((b) => b.id === id) || brandsStore[0],
  saveBrand: (brand: Brand) => {
    const existingIdx = brandsStore.findIndex((b) => b.id === brand.id);
    if (existingIdx >= 0) {
      brandsStore[existingIdx] = brand;
    } else {
      brandsStore.push(brand);
    }
    return brand;
  },
  deleteBrand: (id: string) => {
    brandsStore = brandsStore.filter((b) => b.id !== id);
  },

  getPrompts: (brandId: string) => promptsStore.filter((p) => p.brand_id === brandId),
  savePrompt: (prompt: Prompt) => {
    const existingIdx = promptsStore.findIndex((p) => p.id === prompt.id);
    if (existingIdx >= 0) {
      promptsStore[existingIdx] = prompt;
    } else {
      promptsStore.push(prompt);
    }
    return prompt;
  },
  deletePrompt: (id: string) => {
    promptsStore = promptsStore.filter((p) => p.id !== id);
  },

  getRuns: (brandId: string) =>
    runsStore
      .filter((r) => r.brand_id === brandId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  getRun: (id: string) => runsStore.find((r) => r.id === id),
  saveRun: (run: MonitoringRun) => {
    const existingIdx = runsStore.findIndex((r) => r.id === run.id);
    if (existingIdx >= 0) {
      runsStore[existingIdx] = run;
    } else {
      runsStore.push(run);
    }
    return run;
  },

  getResults: (runId: string) => resultsStore.filter((res) => res.run_id === runId),
  saveResult: (result: MonitoringResult) => {
    resultsStore.push(result);
    return result;
  },

  getCitations: (brandId: string) => citationsStore.filter((c) => c.brand_id === brandId),
  saveCitation: (citation: Citation) => {
    citationsStore.push(citation);
    return citation;
  },

  getRecommendations: (brandId: string) =>
    recommendationsStore.filter((rec) => rec.brand_id === brandId),
  saveRecommendation: (rec: GEORecommendation) => {
    const existingIdx = recommendationsStore.findIndex((r) => r.id === rec.id);
    if (existingIdx >= 0) {
      recommendationsStore[existingIdx] = rec;
    } else {
      recommendationsStore.push(rec);
    }
    return rec;
  },
  updateRecommendationStatus: (id: string, status: GEORecommendation["status"]) => {
    const rec = recommendationsStore.find((r) => r.id === id);
    if (rec) {
      rec.status = status;
      rec.updated_at = new Date().toISOString();
    }
    return rec;
  },

  resetToDemo: () => {
    brandsStore = [initialDemoBrand];
    // Keep initial items
  },
};

