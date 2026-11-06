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

export interface SupabaseHealth {
  isConfigured: boolean;
  tablesExist: boolean;
  message?: string;
}

let cachedHealth: { result: SupabaseHealth; timestamp: number } | null = null;

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  if (cachedHealth && Date.now() - cachedHealth.timestamp < 30000) {
    return cachedHealth.result;
  }

  const supabase = createAdminClient();
  if (!supabase) {
    const res: SupabaseHealth = {
      isConfigured: false,
      tablesExist: false,
      message: "Supabase credentials not configured in environment variables.",
    };
    cachedHealth = { result: res, timestamp: Date.now() };
    return res;
  }

  try {
    const { data, error } = await supabase.from("brands").select("id").limit(1);
    if (error) {
      const res: SupabaseHealth = {
        isConfigured: true,
        tablesExist: false,
        message: `Database connected, but schema tables are missing (${error.message}). Run the migration script in Supabase SQL Editor.`,
      };
      cachedHealth = { result: res, timestamp: Date.now() };
      return res;
    }

    const res: SupabaseHealth = {
      isConfigured: true,
      tablesExist: true,
      message: "Supabase PostgreSQL connected and schema verified.",
    };
    cachedHealth = { result: res, timestamp: Date.now() };
    return res;
  } catch (err: any) {
    const res: SupabaseHealth = {
      isConfigured: true,
      tablesExist: false,
      message: `Failed to connect to Supabase: ${err?.message || "Connection error"}`,
    };
    cachedHealth = { result: res, timestamp: Date.now() };
    return res;
  }
}

export async function getActiveBrand(requestedBrandId?: string): Promise<Brand> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      if (requestedBrandId) {
        const { data: brand, error } = await supabase
          .from("brands")
          .select("*, competitors(*)")
          .eq("id", requestedBrandId)
          .single();
        if (!error && brand) return brand;
      }
      const { data: defaultBrand, error: defErr } = await supabase
        .from("brands")
        .select("*, competitors(*)")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!defErr && defaultBrand) return defaultBrand;
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
      if (!error && data) {
        // If Supabase tables are ready and returned records, return them!
        if (data.length > 0) return data;
      }
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

export async function updateBrand(
  id: string,
  brandData: {
    name?: string;
    website?: string;
    industry?: string;
    country?: string;
    language?: string;
    description?: string;
    competitors?: string[];
  }
): Promise<Brand | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (brandData.name) updatePayload.name = brandData.name;
      if (brandData.website) updatePayload.website = brandData.website;
      if (brandData.industry) updatePayload.industry = brandData.industry;
      if (brandData.country) updatePayload.country = brandData.country;
      if (brandData.language) updatePayload.language = brandData.language;
      if (brandData.description !== undefined) updatePayload.description = brandData.description;

      const { data: updatedBrand, error } = await supabase
        .from("brands")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (!error && updatedBrand) {
        if (brandData.competitors) {
          // Replace competitors
          await supabase.from("competitors").delete().eq("brand_id", id);
          if (brandData.competitors.length > 0) {
            await supabase.from("competitors").insert(
              brandData.competitors.map((name) => ({
                brand_id: id,
                name,
              }))
            );
          }
        }
        return updatedBrand;
      }
    } catch (err) {
      console.warn("Supabase updateBrand error, falling back to memoryStore:", err);
    }
  }

  const existing = memoryStore.getBrand(id);
  if (!existing) return null;

  const updated = memoryStore.updateBrand(id, {
    ...brandData,
    competitors: brandData.competitors
      ? brandData.competitors.map((c, i) => ({
          id: `comp_${Date.now()}_${i}`,
          brand_id: id,
          name: c,
        }))
      : existing.competitors,
  });

  return updated;
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

export async function updatePrompt(
  promptId: string,
  updates: {
    query_text?: string;
    category?: Prompt["category"];
    is_active?: boolean;
  }
): Promise<Prompt | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.query_text !== undefined) payload.query_text = updates.query_text;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.is_active !== undefined) payload.is_active = updates.is_active;

      const { data } = await supabase
        .from("prompts")
        .update(payload)
        .eq("id", promptId)
        .select()
        .single();
      if (data) return data;
    } catch (err) {
      console.warn("Supabase updatePrompt error:", err);
    }
  }

  return memoryStore.updatePrompt(promptId, updates);
}

export async function togglePromptActive(promptId: string, isActive: boolean): Promise<Prompt | null> {
  return updatePrompt(promptId, { is_active: isActive });
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
