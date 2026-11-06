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

// In-memory local storage state
// Default stores start completely empty to ensure strict multi-tenant data isolation.
// No user automatically sees fake mock data or fabricated citations.
let brandsStore: Brand[] = [];
let promptsStore: Prompt[] = [];
let runsStore: MonitoringRun[] = [];
let resultsStore: MonitoringResult[] = [];
let citationsStore: Citation[] = [];
let recommendationsStore: GEORecommendation[] = [];

// Explicit isolated demo template that is ONLY loaded if intentionally requested
export const DEMO_SAMPLE_BRAND: Brand = {
  id: "b1000000-0000-0000-0000-000000000001",
  name: "Mentionly (Demo)",
  website: "https://mentionly.ai",
  industry: "AI SaaS & Search Intelligence",
  country: "United States",
  language: "English",
  description:
    "Mentionly monitors whether AI search engines like Gemini, ChatGPT, and Perplexity cite, recommend, and mention your brand.",
  is_default: true,
  created_at: new Date().toISOString(),
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
  ],
};

export const memoryStore = {
  getBrands: (organizationId?: string) => {
    if (organizationId) {
      return brandsStore.filter((b) => b.organization_id === organizationId);
    }
    return brandsStore;
  },

  getBrand: (id: string, organizationId?: string) => {
    return brandsStore.find(
      (b) => b.id === id && (!organizationId || b.organization_id === organizationId)
    );
  },

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
    promptsStore = promptsStore.filter((p) => p.brand_id !== id);
    runsStore = runsStore.filter((r) => r.brand_id !== id);
    citationsStore = citationsStore.filter((c) => c.brand_id !== id);
    recommendationsStore = recommendationsStore.filter((rec) => rec.brand_id !== id);
  },

  updateBrand: (id: string, updates: Partial<Brand>) => {
    const brand = brandsStore.find((b) => b.id === id);
    if (brand) {
      Object.assign(brand, updates);
      brand.updated_at = new Date().toISOString();
      return brand;
    }
    return null;
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

  updatePrompt: (id: string, updates: Partial<Prompt>) => {
    const prompt = promptsStore.find((p) => p.id === id);
    if (prompt) {
      Object.assign(prompt, updates);
      prompt.updated_at = new Date().toISOString();
      return prompt;
    }
    return null;
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

  /**
   * Seed demo data ONLY into a specific user/organization context when requested.
   */
  seedDemoDataForOrg: (organizationId: string) => {
    const demoBrand: Brand = {
      ...DEMO_SAMPLE_BRAND,
      id: crypto.randomUUID(),
      organization_id: organizationId,
    };
    brandsStore.push(demoBrand);
    return demoBrand;
  },

  clearAll: () => {
    brandsStore = [];
    promptsStore = [];
    runsStore = [];
    resultsStore = [];
    citationsStore = [];
    recommendationsStore = [];
  },
};
