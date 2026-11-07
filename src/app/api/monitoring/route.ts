import { NextRequest, NextResponse } from "next/server";
import { monitoringRunSchema } from "@/lib/validations";
import { getActiveBrand, listBrands, listPrompts, listMonitoringRuns, updateBrand, verifyBrandOwnership } from "@/lib/data-service";
import { suggestCompetitors } from "@/lib/openai";
import { memoryStore } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeMonitoringRun } from "@/lib/monitoring-engine";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { MonitoringRun, Brand } from "@/types";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id");
    if (!brandId) {
      return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    }
    if (!(await verifyBrandOwnership(user.id, brandId))) {
      return forbiddenResponse("You do not have access to this brand");
    }

    const runs = await listMonitoringRuns(user.id, brandId);
    return NextResponse.json({ runs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const json = await req.json();
    const validated = monitoringRunSchema.parse(json);

    let brand = await getActiveBrand(user.id, validated.brand_id);
    if (!brand) {
      const allBrands = await listBrands(user.id);
      brand =
        allBrands.find(
          (b: Brand) =>
            b.id === validated.brand_id ||
            b.name.toLowerCase() === validated.brand_id.toLowerCase()
        ) || allBrands[0];
    }

    if (!brand) {
      brand = {
        id: validated.brand_id,
        organization_id: `org-${user.id}`,
        name: "Mentionly Target",
        website: "https://mentionly.ai",
        industry: "AI Search Visibility & GEO",
        country: "Global",
        language: "English",
        description: "",
        created_at: new Date().toISOString(),
        competitors: [],
      };
      memoryStore.saveBrand(brand);
    }

    const allPrompts = await listPrompts(user.id, brand.id);
    let selectedPrompts = allPrompts.filter((p) => validated.prompt_ids.includes(p.id));

    if (selectedPrompts.length === 0) {
      const storePrompts = memoryStore.getPrompts(brand.id);
      selectedPrompts = storePrompts.filter((p) => validated.prompt_ids.includes(p.id));
    }

    if (selectedPrompts.length === 0 && validated.prompt_ids.length > 0) {
      selectedPrompts = validated.prompt_ids.map((id) => ({
        id,
        brand_id: brand!.id,
        query_text: `What are the best ${brand!.industry || "AI"} tools and platforms?`,
        category: "Discovery" as const,
        is_active: true,
        created_at: new Date().toISOString(),
      }));
      selectedPrompts.forEach((p) => memoryStore.savePrompt(p));
    }

    if (selectedPrompts.length === 0) {
      const fallbackPrompt = {
        id: crypto.randomUUID(),
        brand_id: brand.id,
        query_text: `What are the best ${brand.industry || "AI"} tools and platforms?`,
        category: "Discovery" as const,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      memoryStore.savePrompt(fallbackPrompt);
      selectedPrompts = [fallbackPrompt];
    }

    const runId = crypto.randomUUID();
    const newRun: MonitoringRun = {
      id: runId,
      brand_id: brand.id,
      status: "pending",
      total_prompts: selectedPrompts.length,
      completed_prompts: 0,
      visibility_score: 0,
      brand_mention_rate: 0,
      competitor_mention_rate: 0,
      recommendation_rate: 0,
      created_at: new Date().toISOString(),
    };

    // Dual-persist immediately
    memoryStore.saveRun(newRun);

    const supabase = createAdminClient();
    if (supabase) {
      try {
        await supabase.from("monitoring_runs").insert(newRun);
      } catch (e) {
        console.warn("Supabase monitoring_runs insert notice:", e);
      }
    }

    const configuredCompetitors = (brand.competitors || []).map((c) => c.name);
    const legacyDemoCompetitors = ["Otterly.AI", "Profound"];
    const needsCompetitorRefresh =
      brand.name.toLowerCase() !== "mentionly" &&
      (configuredCompetitors.length === 0 ||
        configuredCompetitors.every((name) => legacyDemoCompetitors.includes(name)));

    if (needsCompetitorRefresh) {
      try {
        const suggestedCompetitors = await suggestCompetitors({
          brandName: brand.name,
          industry: brand.industry,
          country: brand.country,
        });
        if (suggestedCompetitors.length > 0) {
          brand = (await updateBrand(user.id, brand.id, { competitors: suggestedCompetitors })) || brand;
        }
      } catch (error) {
        console.warn("Could not generate competitor suggestions; continuing without competitor analysis.", error);
      }
    }

    const competitorNames = (brand.competitors || []).map((c) => c.name);

    // Execute monitoring run
    const completedRun = await executeMonitoringRun({
      runId,
      brandId: brand.id,
      brandName: brand.name,
      website: brand.website,
      competitors: competitorNames,
      prompts: selectedPrompts,
    });

    const isAllFailed = completedRun.status === "failed";

    return NextResponse.json({
      run: completedRun,
      success: !isAllFailed,
      message: isAllFailed
        ? completedRun.error_message || "Monitoring run failed across all prompts"
        : "Monitoring run completed",
    }, { status: isAllFailed ? 502 : 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to start monitoring run" },
      { status: 500 }
    );
  }
}
