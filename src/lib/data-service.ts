import { createAdminClient } from "./supabase/admin";
import { memoryStore } from "./store";
import { getOrCreateUserOrganization } from "./auth";
import {
  Brand,
  Competitor,
  Prompt,
  MonitoringRun,
  MonitoringResult,
  Citation,
  GEORecommendation,
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
    const { error } = await supabase.from("brands").select("id").limit(1);
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

/**
 * Retrieve all organization IDs that the given user belongs to.
 */
export async function getUserOrgIds(userId: string): Promise<string[]> {
  const supabase = createAdminClient();
  if (!supabase) {
    return [`org-${userId}`];
  }

  try {
    const { data: memberships, error } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId);

    if (error || !memberships) {
      console.warn("Could not query organization_members for user:", error);
      return [];
    }

    return memberships.map((m) => m.organization_id);
  } catch (err) {
    console.error("getUserOrgIds exception:", err);
    return [];
  }
}

/**
 * Check if a brand belongs to an organization the user is a member of.
 */
export async function verifyBrandOwnership(userId: string, brandId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) {
    const b = memoryStore.getBrand(brandId);
    return !b || b.organization_id === `org-${userId}`;
  }

  const orgIds = await getUserOrgIds(userId);
  if (orgIds.length === 0) return false;

  const { data: brand, error } = await supabase
    .from("brands")
    .select("id, organization_id")
    .eq("id", brandId)
    .single();

  if (error || !brand) return false;
  return orgIds.includes(brand.organization_id);
}

/**
 * Get active brand strictly scoped to the authenticated user.
 */
export async function getActiveBrand(
  userId: string,
  requestedBrandId?: string
): Promise<Brand | null> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const orgIds = await getUserOrgIds(userId);
      if (orgIds.length === 0) {
        return null;
      }

      if (requestedBrandId) {
        const { data: brand, error } = await supabase
          .from("brands")
          .select("*, competitors(*)")
          .eq("id", requestedBrandId)
          .in("organization_id", orgIds)
          .single();

        if (!error && brand) return brand;
        return null;
      }

      // Default to first brand of the user
      const { data: defaultBrand, error: defErr } = await supabase
        .from("brands")
        .select("*, competitors(*)")
        .in("organization_id", orgIds)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!defErr && defaultBrand) return defaultBrand;
      return null;
    } catch (err) {
      console.warn("Supabase fetch active brand error:", err);
      return null;
    }
  }

  // In-memory fallback strictly scoped to userId
  const orgId = `org-${userId}`;
  if (requestedBrandId) {
    const b = memoryStore.getBrand(requestedBrandId, orgId);
    return b || null;
  }
  const all = memoryStore.getBrands(orgId);
  return all.length > 0 ? all[0] : null;
}

/**
 * List brands strictly scoped to organizations the user is a member of.
 */
export async function listBrands(userId: string): Promise<Brand[]> {
  const supabase = createAdminClient();
  if (supabase) {
    try {
      const orgIds = await getUserOrgIds(userId);
      if (orgIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from("brands")
        .select("*, competitors(*)")
        .in("organization_id", orgIds)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data;
      }
      return [];
    } catch (err) {
      console.warn("Supabase listBrands error:", err);
      return [];
    }
  }

  const orgId = `org-${userId}`;
  return memoryStore.getBrands(orgId);
}

/**
 * Create a new brand for the authenticated user within their dedicated organization.
 */
export async function createBrand(
  userId: string,
  userEmail: string,
  brandData: {
    name: string;
    website: string;
    industry: string;
    country: string;
    language: string;
    description?: string;
    competitors: string[];
  }
): Promise<Brand> {
  const brandId = crypto.randomUUID();
  const supabase = createAdminClient();

  // Get or initialize user's private organization
  const orgId = await getOrCreateUserOrganization(userId, userEmail);

  const newBrand: Brand = {
    id: brandId,
    organization_id: orgId,
    name: brandData.name,
    website: brandData.website,
    industry: brandData.industry,
    country: brandData.country,
    language: brandData.language,
    description: brandData.description,
    is_default: false,
    created_at: new Date().toISOString(),
    competitors: brandData.competitors.map((c, i) => ({
      id: crypto.randomUUID(),
      brand_id: brandId,
      name: c,
    })),
  };

  if (supabase) {
    try {
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

      if (brandErr || !brandRecord) {
        throw new Error(`Failed to create brand: ${brandErr?.message}`);
      }

      if (newBrand.competitors && newBrand.competitors.length > 0) {
        await supabase.from("competitors").insert(
          newBrand.competitors.map((c) => ({
            id: c.id,
            brand_id: newBrand.id,
            name: c.name,
          }))
        );
      }
      return newBrand;
    } catch (err) {
      console.error("Supabase createBrand failed:", err);
      throw err;
    }
  }

  return memoryStore.saveBrand(newBrand);
}

/**
 * Update a brand, ensuring caller has ownership rights.
 */
export async function updateBrand(
  userId: string,
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
  const isOwner = await verifyBrandOwnership(userId, id);
  if (!isOwner) {
    throw new Error("Unauthorized: Brand does not belong to your organization.");
  }

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
        .select("*, competitors(*)")
        .single();

      if (!error && updatedBrand) {
        if (brandData.competitors) {
          await supabase.from("competitors").delete().eq("brand_id", id);
          if (brandData.competitors.length > 0) {
            await supabase.from("competitors").insert(
              brandData.competitors.map((name) => ({
                id: crypto.randomUUID(),
                brand_id: id,
                name,
              }))
            );
          }
        }
        return updatedBrand;
      }
    } catch (err) {
      console.error("Supabase updateBrand error:", err);
      throw err;
    }
  }

  const existing = memoryStore.getBrand(id, `org-${userId}`);
  if (!existing) return null;

  return memoryStore.updateBrand(id, {
    ...brandData,
    competitors: brandData.competitors
      ? brandData.competitors.map((c) => ({
          id: crypto.randomUUID(),
          brand_id: id,
          name: c,
        }))
      : existing.competitors,
  });
}

/**
 * Delete a brand, ensuring caller has ownership rights.
 */
export async function deleteBrand(userId: string, id: string): Promise<boolean> {
  const isOwner = await verifyBrandOwnership(userId, id);
  if (!isOwner) {
    throw new Error("Unauthorized: Brand does not belong to your organization.");
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      await supabase.from("brands").delete().eq("id", id);
    } catch (err) {
      console.error("Supabase deleteBrand error:", err);
      throw err;
    }
  }
  memoryStore.deleteBrand(id);
  return true;
}

/**
 * List prompts for a brand owned by the user.
 */
export async function listPrompts(userId: string, brandId: string): Promise<Prompt[]> {
  const isOwner = await verifyBrandOwnership(userId, brandId);
  if (!isOwner) {
    return [];
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (!error && data) return data;
      return [];
    } catch (err) {
      console.warn("Supabase listPrompts error:", err);
      return [];
    }
  }
  return memoryStore.getPrompts(brandId);
}

/**
 * Create prompt for a user-owned brand.
 */
export async function createPrompt(
  userId: string,
  prompt: {
    brand_id: string;
    query_text: string;
    category: Prompt["category"];
  }
): Promise<Prompt> {
  const isOwner = await verifyBrandOwnership(userId, prompt.brand_id);
  if (!isOwner) {
    throw new Error("Unauthorized: Brand does not belong to your organization.");
  }

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
      throw new Error(error?.message || "Failed to create prompt");
    } catch (err) {
      console.error("Supabase createPrompt error:", err);
      throw err;
    }
  }

  return memoryStore.savePrompt(newPrompt);
}

/**
 * Update prompt with ownership validation.
 */
export async function updatePrompt(
  userId: string,
  promptId: string,
  updates: {
    query_text?: string;
    category?: Prompt["category"];
    is_active?: boolean;
  }
): Promise<Prompt | null> {
  const supabase = createAdminClient();
  if (supabase) {
    // Check brand ownership
    const { data: prompt } = await supabase
      .from("prompts")
      .select("brand_id")
      .eq("id", promptId)
      .single();

    if (!prompt || !(await verifyBrandOwnership(userId, prompt.brand_id))) {
      throw new Error("Unauthorized prompt access");
    }

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
      return data || null;
    } catch (err) {
      console.error("Supabase updatePrompt error:", err);
      throw err;
    }
  }

  return memoryStore.updatePrompt(promptId, updates);
}

/**
 * Delete prompt with ownership validation.
 */
export async function deletePrompt(userId: string, promptId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (supabase) {
    const { data: prompt } = await supabase
      .from("prompts")
      .select("brand_id")
      .eq("id", promptId)
      .single();

    if (!prompt || !(await verifyBrandOwnership(userId, prompt.brand_id))) {
      throw new Error("Unauthorized prompt access");
    }

    try {
      await supabase.from("prompts").delete().eq("id", promptId);
      return true;
    } catch (err) {
      console.error("Supabase deletePrompt error:", err);
      throw err;
    }
  }

  memoryStore.deletePrompt(promptId);
  return true;
}

/**
 * List monitoring runs with brand ownership verification.
 */
export async function listMonitoringRuns(userId: string, brandId: string): Promise<MonitoringRun[]> {
  const isOwner = await verifyBrandOwnership(userId, brandId);
  if (!isOwner) {
    return [];
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("monitoring_runs")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (!error && data) return data;
      return [];
    } catch (err) {
      console.warn("Supabase listMonitoringRuns error:", err);
      return [];
    }
  }
  return memoryStore.getRuns(brandId);
}

/**
 * Get monitoring run details with ownership verification.
 */
export async function getMonitoringRun(
  userId: string,
  runId: string
): Promise<{
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

      if (!run) {
        return { run: undefined, results: [], citations: [] };
      }

      const isOwner = await verifyBrandOwnership(userId, run.brand_id);
      if (!isOwner) {
        throw new Error("Unauthorized: Run does not belong to your organization.");
      }

      const { data: results } = await supabase
        .from("monitoring_results")
        .select("*")
        .eq("run_id", runId)
        .order("created_at", { ascending: true });

      const { data: citations } = await supabase
        .from("citations")
        .select("*")
        .eq("brand_id", run.brand_id);

      return {
        run,
        results: results || [],
        citations: citations || [],
      };
    } catch (err) {
      console.error("Supabase getMonitoringRun error:", err);
      throw err;
    }
  }

  const run = memoryStore.getRun(runId);
  if (!run) return { run: undefined, results: [], citations: [] };
  const results = memoryStore.getResults(runId);
  const citations = memoryStore.getCitations(run.brand_id);
  return { run, results, citations };
}

/**
 * List citations with brand ownership verification.
 */
export async function listCitations(userId: string, brandId: string): Promise<Citation[]> {
  const isOwner = await verifyBrandOwnership(userId, brandId);
  if (!isOwner) {
    return [];
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("citations")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (!error && data) return data;
      return [];
    } catch (err) {
      console.warn("Supabase listCitations error:", err);
      return [];
    }
  }
  return memoryStore.getCitations(brandId);
}

/**
 * List GEO recommendations with brand ownership verification.
 */
export async function listRecommendations(
  userId: string,
  brandId: string
): Promise<GEORecommendation[]> {
  const isOwner = await verifyBrandOwnership(userId, brandId);
  if (!isOwner) {
    return [];
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("geo_recommendations")
        .select("*")
        .eq("brand_id", brandId)
        .order("created_at", { ascending: false });

      if (!error && data) return data;
      return [];
    } catch (err) {
      console.warn("Supabase listRecommendations error:", err);
      return [];
    }
  }
  return memoryStore.getRecommendations(brandId);
}
