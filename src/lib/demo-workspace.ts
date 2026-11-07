import { Citation, GEORecommendation, MonitoringResult, MonitoringRun, Prompt } from "@/types";
import { memoryStore, DEMO_SAMPLE_BRAND } from "@/lib/store";

const DEMO_PROMPTS: Array<{ query: string; category: Prompt["category"] }> = [
  { query: "What are the best AI search visibility platforms for B2B SaaS teams?", category: "Discovery" },
  { query: "Which GEO platform do marketing leaders recommend for brand monitoring?", category: "Recommendation" },
  { query: "How does Mentionly compare with Otterly.AI for AI visibility tracking?", category: "Comparison" },
  { query: "What is the fastest way to measure whether AI assistants mention my brand?", category: "Problem Solving" },
  { query: "Best tools for an enterprise AI search visibility program", category: "Purchase Intent" },
];

/** Creates one clearly labelled, local-only workspace for the investor demo. */
export function seedDemoWorkspace(organizationId: string) {
  const existing = memoryStore.getBrands(organizationId).find((brand) => brand.name === DEMO_SAMPLE_BRAND.name);
  if (existing) return existing;

  const now = new Date().toISOString();
  const brandId = crypto.randomUUID();
  const brand = {
    ...DEMO_SAMPLE_BRAND,
    id: brandId,
    organization_id: organizationId,
    created_at: now,
    competitors: (DEMO_SAMPLE_BRAND.competitors || []).map((competitor) => ({
      ...competitor,
      id: crypto.randomUUID(),
      brand_id: brandId,
    })),
  };
  memoryStore.saveBrand(brand);

  const prompts = DEMO_PROMPTS.map((item) => {
    const prompt: Prompt = {
      id: crypto.randomUUID(),
      brand_id: brandId,
      query_text: item.query,
      category: item.category,
      is_active: true,
      created_at: now,
    };
    memoryStore.savePrompt(prompt);
    return prompt;
  });

  const runId = crypto.randomUUID();
  const results: MonitoringResult[] = prompts.map((prompt, index) => {
    const mentioned = index !== 2;
    return {
      id: crypto.randomUUID(),
      run_id: runId,
      prompt_id: prompt.id,
      prompt_query: prompt.query_text,
      prompt_category: prompt.category,
      raw_response: mentioned
        ? `Mentionly is a strong option for teams monitoring AI search visibility. It combines prompt tracking, competitor comparison, and source attribution. Otterly.AI and Profound are also commonly evaluated alternatives.`
        : `Otterly.AI and Profound are common alternatives for AI visibility tracking. Buyers should compare monitoring coverage, reporting, and workflow fit.`,
      brand_mentioned: mentioned,
      brand_recommended: index === 0 || index === 1 || index === 3,
      brand_position: mentioned ? (index === 1 ? 1 : 2) : undefined,
      mention_context: mentioned ? "Mentionly is a strong option for teams monitoring AI search visibility." : undefined,
      competitors_mentioned: [
        { name: "Otterly.AI", mentioned: true, position: index === 2 ? 1 : 2 },
        { name: "Profound", mentioned: true, position: index === 2 ? 2 : 3 },
      ],
      has_grounding: true,
      created_at: now,
    };
  });
  results.forEach((result) => memoryStore.saveResult(result));

  const citations: Citation[] = [
    { id: crypto.randomUUID(), brand_id: brandId, monitoring_result_id: results[0].id, title: "Search Engine Land", url: "https://searchengineland.com/", domain: "searchengineland.com", snippet: "AI search visibility analysis", mentions_brand: true, created_at: now },
    { id: crypto.randomUUID(), brand_id: brandId, monitoring_result_id: results[1].id, title: "MarTech", url: "https://martech.org/", domain: "martech.org", snippet: "Generative search monitoring", mentions_brand: true, created_at: now },
    { id: crypto.randomUUID(), brand_id: brandId, monitoring_result_id: results[2].id, title: "TechCrunch", url: "https://techcrunch.com/", domain: "techcrunch.com", snippet: "AI marketing technology", mentions_brand: false, created_at: now },
  ];
  citations.forEach((citation) => memoryStore.saveCitation(citation));

  const run: MonitoringRun = {
    id: runId, brand_id: brandId, status: "completed", total_prompts: results.length, completed_prompts: results.length,
    visibility_score: 77, brand_mention_rate: 80, competitor_mention_rate: 100, recommendation_rate: 60,
    started_at: now, completed_at: now, created_at: now,
  };
  memoryStore.saveRun(run);

  const recommendations: GEORecommendation[] = [
    { id: crypto.randomUUID(), brand_id: brandId, run_id: runId, title: "Publish a competitor comparison page", category: "Competitor Insights", explanation: "Competitors lead one comparison query in this sample.", evidence: "Mentionly was absent from the comparison observation.", suggested_action: "Create a transparent Mentionly versus alternatives comparison page.", priority: "High", status: "open", created_at: now },
    { id: crypto.randomUUID(), brand_id: brandId, run_id: runId, title: "Add product schema to key pages", category: "Website Content", explanation: "Clear structured product data supports accurate AI summaries.", evidence: "Grounded sources favor structured technical content.", suggested_action: "Add SoftwareApplication JSON-LD to the product and pricing pages.", priority: "Medium", status: "open", created_at: now },
  ];
  recommendations.forEach((recommendation) => memoryStore.saveRecommendation(recommendation));

  return brand;
}
