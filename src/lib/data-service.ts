import { createAdminClient } from "./supabase/admin";
import { createServerSupabaseClient } from "./supabase/server";
import { memoryStore } from "./store";
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

export async function getActiveBrand(requestedBrandId?: string): Promise<Brand> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      if (requestedBrandId) {
        const { data: brand } = await supabase
          .from("brands")
          .select("*, competitors(*)")
          .eq("id", requestedBrandId)
          .single();
        if (brand) return brand;
      }
      const { data: defaultBrand } = await supabase
        .from("brands")
        .select("*, competitors(*)")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (defaultBrand) return defaultBrand;
    } catch (err) {
      console.warn("Supabase fetch brands error, falling back to local memory store:", err);
    }
  }

  if (requestedBrandId) {
    return memoryStore.getBrand(requestedBrandId);
  }
  const all = memoryStore.getBrands();
  return all[0];
}

export async function listBrands(): Promise<Brand[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*, competitors(*)")
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn("Supabase listBrands error:", err);
    }
  }
  return memoryStore.getBrands();
}

export async function createBrand(brandData: {
  name: string;
  website: string;
  industry: string;
  country: string;
  language: string;
  description?: string;
  competitors: string[];
}): Promise<Brand> {
  const brandId = crypto.randomUUID();
  const newBrand: Brand = {
    id: brandId,
    name: brandData.name,
    website: brandData.website,
    industry: brandData.industry,
    country: brandData.country,
    language: brandData.language,
    description: brandData.description,
    is_default: false,
    created_at: new Date().toISOString(),
    competitors: brandData.competitors.map((c, i) => ({
      id: `comp_${Date.now()}_${i}`,
      brand_id: brandId,
      name: c,
    })),
  };

  const supabase = createAdminClient();
  if (supabase) {
    try {
      // Create a default org if none exists
      let orgId: string | null = null;
      const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
      if (orgs && orgs.length > 0) {
        orgId = orgs[0].id;
      } else {
        const { data: newOrg } = await supabase
          .from("organizations")
          .insert({ name: "Default Org", slug: `org-${Date.now()}` })
          .select("id")
          .single();
        orgId = newOrg?.id || null;
      }

      if (orgId) {
        const { data: brandRecord, error: brandErr } = await supabase
          .from("brands")
          .insert({
            id: newBrand.id,
            organization_id: orgId,
            name: newBrand.name,
            website: newBrand.website,
            industry: newBrand.industry,
            country: newBrand.country,
            language: newBrand.language,
            description: newBrand.description,
          })
          .select()
          .single();

        if (!brandErr && brandRecord) {
          if (newBrand.competitors && newBrand.competitors.length > 0) {
            await supabase.from("competitors").insert(
              newBrand.competitors.map((c) => ({
                brand_id: newBrand.id,
                name: c.name,
              }))
            );
          }
          return newBrand;
        }
      }
    } catch (err) {
      console.warn("Supabase createBrand failed, falling back to memoryStore:", err);
    }
  }

  return memoryStore.saveBrand(newBrand);
}

export async function deleteBrand(id: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from("brands").delete().eq("id", id);
    } catch (err) {
      console.warn("Supabase deleteBrand error:", err);
    }
  }
  memoryStore.deleteBrand(id);
  return true;
}

export async function listPrompts(brandId: string): Promise<Prompt[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn("Supabase listPrompts error:", err);
    }
  }
  return memoryStore.getPrompts(brandId);
}

export async function createPrompt(prompt: {
  brand_id: string;
  query_text: string;
  category: Prompt["category"];
}): Promise<Prompt> {
  const newPrompt: Prompt = {
    id: crypto.randomUUID(),
    brand_id: prompt.brand_id,
    query_text: prompt.query_text,
    category: prompt.category,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("prompts").insert(newPrompt).select().single();
      if (!error && data) return data;
    } catch (err) {
      console.warn("Supabase createPrompt error:", err);
    }
  }

  return memoryStore.savePrompt(newPrompt);
}

export async function togglePromptActive(promptId: string, isActive: boolean): Promise<Prompt | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("prompts")
        .update({ is_active: isActive })
        .eq("id", promptId)
        .select()
        .single();
      if (data) return data;
    } catch (err) {
      console.warn("Supabase togglePromptActive error:", err);
    }
  }

  const all = memoryStore.getPrompts(memoryStore.getBrands()[0]?.id || "");
  const p = all.find((item) => item.id === promptId);
  if (p) {
    p.is_active = isActive;
    return p;
  }
  return null;
}

export async function deletePrompt(promptId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from("prompts").delete().eq("id", promptId);
    } catch (err) {
      console.warn("Supabase deletePrompt error:", err);
    }
  }
  memoryStore.deletePrompt(promptId);
  return true;
}

export async function listMonitoringRuns(brandId: string): Promise<MonitoringRun[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("monitoring_runs")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn("Supabase listMonitoringRuns error:", err);
    }
  }
  return memoryStore.getRuns(brandId);
}

export async function getMonitoringRun(runId: string): Promise<{
  run: MonitoringRun | undefined;
  results: MonitoringResult[];
  citations: Citation[];
}> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data: run } = await supabase
        .from("monitoring_runs")
        .select("*")
        .eq("id", runId)
        .single();
      const { data: results } = await supabase
        .from("monitoring_results")
        .select("*")
        .eq("run_id", runId);
      const { data: citations } = await supabase
        .from("citations")
        .select("*")
        .eq("brand_id", run?.brand_id || "");

      if (run) {
        return {
          run,
          results: results || [],
          citations: citations || [],
        };
      }
    } catch (err) {
      console.warn("Supabase getMonitoringRun error:", err);
    }
  }

  const run = memoryStore.getRun(runId);
  const results = memoryStore.getResults(runId);
  const citations = memoryStore.getCitations(run?.brand_id || "");
  return { run, results, citations };
}

export async function listCitations(brandId: string): Promise<Citation[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("citations")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn("Supabase listCitations error:", err);
    }
  }
  return memoryStore.getCitations(brandId);
}

export async function listRecommendations(brandId: string): Promise<GEORecommendation[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("geo_recommendations")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });
      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn("Supabase listRecommendations error:", err);
    }
  }
  return memoryStore.getRecommendations(brandId);
}

