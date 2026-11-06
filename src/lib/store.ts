import fs from "fs";
import path from "path";
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

interface GlobalStoreState {
  brands: Brand[];
  prompts: Prompt[];
  runs: MonitoringRun[];
  results: MonitoringResult[];
  citations: Citation[];
  recommendations: GEORecommendation[];
}

const STATE_FILE = path.join(process.cwd(), ".mentionly_state.json");

function loadStateFromDisk(): GlobalStoreState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        brands: Array.isArray(parsed.brands) ? parsed.brands : [],
        prompts: Array.isArray(parsed.prompts) ? parsed.prompts : [],
        runs: Array.isArray(parsed.runs) ? parsed.runs : [],
        results: Array.isArray(parsed.results) ? parsed.results : [],
        citations: Array.isArray(parsed.citations) ? parsed.citations : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      };
    }
  } catch (e) {
    // Silently continue if reading fails
  }
  return {
    brands: [],
    prompts: [],
    runs: [],
    results: [],
    citations: [],
    recommendations: [],
  };
}

function persistStateToDisk(state: GlobalStoreState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    // Silently continue if disk write fails
  }
}

// Attach store to globalThis so Next.js HMR or route splits never lose state
const g = globalThis as unknown as { __mentionly_store?: GlobalStoreState };
if (!g.__mentionly_store) {
  g.__mentionly_store = loadStateFromDisk();
}

function getStore(): GlobalStoreState {
  if (!g.__mentionly_store) {
    g.__mentionly_store = loadStateFromDisk();
  }
  return g.__mentionly_store;
}

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
    const list = getStore().brands;
    if (organizationId) {
      return list.filter((b) => b.organization_id === organizationId);
    }
    return list;
  },

  getBrand: (id: string, organizationId?: string) => {
    const list = getStore().brands;
    const brand = list.find((b) => b.id === id);
    if (!brand) return undefined;
    if (organizationId && brand.organization_id !== organizationId) {
      return undefined;
    }
    return brand;
  },

  saveBrand: (brand: Brand) => {
    const store = getStore();
    const existingIdx = store.brands.findIndex((b) => b.id === brand.id);
    if (existingIdx >= 0) {
      store.brands[existingIdx] = brand;
    } else {
      store.brands.push(brand);
    }
    persistStateToDisk(store);
    return brand;
  },

  deleteBrand: (id: string) => {
    const store = getStore();
    store.brands = store.brands.filter((b) => b.id !== id);
    store.prompts = store.prompts.filter((p) => p.brand_id !== id);
    store.runs = store.runs.filter((r) => r.brand_id !== id);
    store.citations = store.citations.filter((c) => c.brand_id !== id);
    store.recommendations = store.recommendations.filter((rec) => rec.brand_id !== id);
    persistStateToDisk(store);
  },

  updateBrand: (id: string, updates: Partial<Brand>) => {
    const store = getStore();
    const brand = store.brands.find((b) => b.id === id);
    if (brand) {
      Object.assign(brand, updates);
      brand.updated_at = new Date().toISOString();
      persistStateToDisk(store);
      return brand;
    }
    return null;
  },

  getPrompts: (brandId: string) => {
    return getStore().prompts.filter((p) => p.brand_id === brandId);
  },

  savePrompt: (prompt: Prompt) => {
    const store = getStore();
    const existingIdx = store.prompts.findIndex((p) => p.id === prompt.id);
    if (existingIdx >= 0) {
      store.prompts[existingIdx] = prompt;
    } else {
      store.prompts.push(prompt);
    }
    persistStateToDisk(store);
    return prompt;
  },

  deletePrompt: (id: string) => {
    const store = getStore();
    store.prompts = store.prompts.filter((p) => p.id !== id);
    persistStateToDisk(store);
  },

  updatePrompt: (id: string, updates: Partial<Prompt>) => {
    const store = getStore();
    const prompt = store.prompts.find((p) => p.id === id);
    if (prompt) {
      Object.assign(prompt, updates);
      prompt.updated_at = new Date().toISOString();
      persistStateToDisk(store);
      return prompt;
    }
    return null;
  },

  getRuns: (brandId: string) => {
    return getStore()
      .runs.filter((r) => r.brand_id === brandId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getRun: (id: string) => {
    return getStore().runs.find((r) => r.id === id);
  },

  saveRun: (run: MonitoringRun) => {
    const store = getStore();
    const existingIdx = store.runs.findIndex((r) => r.id === run.id);
    if (existingIdx >= 0) {
      store.runs[existingIdx] = run;
    } else {
      store.runs.push(run);
    }
    persistStateToDisk(store);
    return run;
  },

  getResults: (runId: string) => {
    return getStore().results.filter((res) => res.run_id === runId);
  },

  saveResult: (result: MonitoringResult) => {
    const store = getStore();
    const existingIdx = store.results.findIndex((r) => r.id === result.id);
    if (existingIdx >= 0) {
      store.results[existingIdx] = result;
    } else {
      store.results.push(result);
    }
    persistStateToDisk(store);
    return result;
  },

  getCitations: (brandId: string) => {
    return getStore().citations.filter((c) => c.brand_id === brandId);
  },

  saveCitation: (citation: Citation) => {
    const store = getStore();
    const existingIdx = store.citations.findIndex((c) => c.id === citation.id);
    if (existingIdx >= 0) {
      store.citations[existingIdx] = citation;
    } else {
      store.citations.push(citation);
    }
    persistStateToDisk(store);
    return citation;
  },

  getRecommendations: (brandId: string) => {
    return getStore().recommendations.filter((rec) => rec.brand_id === brandId);
  },

  saveRecommendation: (rec: GEORecommendation) => {
    const store = getStore();
    const existingIdx = store.recommendations.findIndex((r) => r.id === rec.id);
    if (existingIdx >= 0) {
      store.recommendations[existingIdx] = rec;
    } else {
      store.recommendations.push(rec);
    }
    persistStateToDisk(store);
    return rec;
  },

  updateRecommendationStatus: (id: string, status: GEORecommendation["status"]) => {
    const store = getStore();
    const rec = store.recommendations.find((r) => r.id === id);
    if (rec) {
      rec.status = status;
      rec.updated_at = new Date().toISOString();
      persistStateToDisk(store);
    }
    return rec;
  },

  /**
   * Seed demo data ONLY into a specific user/organization context when requested.
   */
  seedDemoDataForOrg: (organizationId: string) => {
    const store = getStore();
    const demoBrand: Brand = {
      ...DEMO_SAMPLE_BRAND,
      id: crypto.randomUUID(),
      organization_id: organizationId,
    };
    store.brands.push(demoBrand);
    persistStateToDisk(store);
    return demoBrand;
  },

  clearAll: () => {
    if (g.__mentionly_store) {
      g.__mentionly_store.brands = [];
      g.__mentionly_store.prompts = [];
      g.__mentionly_store.runs = [];
      g.__mentionly_store.results = [];
      g.__mentionly_store.citations = [];
      g.__mentionly_store.recommendations = [];
      persistStateToDisk(g.__mentionly_store);
    }
  },
};
