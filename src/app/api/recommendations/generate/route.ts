import { NextRequest, NextResponse } from "next/server";
import { recommendationGenerateSchema } from "@/lib/validations";
import {
  getActiveBrand,
  listMonitoringRuns,
  getMonitoringRun,
  listCitations,
} from "@/lib/data-service";
import { generateGeoRecommendationsWithGemini } from "@/lib/gemini";
import { memoryStore } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { GEORecommendation } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const json = await req.json();
    const validated = recommendationGenerateSchema.parse(json);

    const brand = await getActiveBrand(user.id, validated.brand_id);
    if (!brand) {
      return forbiddenResponse("Brand not found or unauthorized access");
    }

    const runs = await listMonitoringRuns(user.id, brand.id);
    if (runs.length === 0) {
      return NextResponse.json(
        { error: "Must run at least one AI monitoring check before generating recommendations." },
        { status: 400 }
      );
    }

    const latestRun = runs[0];
    const { results } = await getMonitoringRun(user.id, latestRun.id);
    const citations = await listCitations(user.id, brand.id);

    const missingPrompts = results
      .filter((r) => !r.brand_mentioned)
      .map((r) => r.prompt_query);

    const topSources = Array.from(new Set(citations.map((c) => c.domain)));

    const generatedRecs = await generateGeoRecommendationsWithGemini({
      brandName: brand.name,
      website: brand.website,
      industry: brand.industry,
      totalPrompts: results.length,
      brandMentionRate: latestRun.brand_mention_rate,
      competitorMentionRate: latestRun.competitor_mention_rate,
      missingPrompts,
      topSources,
    });

    const supabase = createAdminClient();
    const savedRecs: GEORecommendation[] = [];

    for (const rec of generatedRecs) {
      const recItem: GEORecommendation = {
        id: crypto.randomUUID(),
        brand_id: brand.id,
        run_id: latestRun.id,
        title: rec.title,
        category: rec.category,
        explanation: rec.explanation,
        evidence: rec.evidence,
        suggested_action: rec.suggested_action,
        priority: rec.priority,
        status: "open",
        related_prompt: (rec as any).related_prompt || undefined,
        related_source: (rec as any).related_source || undefined,
        created_at: new Date().toISOString(),
      };

      if (supabase) {
        await supabase.from("geo_recommendations").insert(recItem);
      } else {
        memoryStore.saveRecommendation(recItem);
      }
      savedRecs.push(recItem);
    }

    return NextResponse.json({
      recommendations: savedRecs,
      message: "Generated GEO recommendations successfully",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
