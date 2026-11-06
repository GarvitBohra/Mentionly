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
import { GEORecommendation } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const validated = recommendationGenerateSchema.parse(json);

    const brand = await getActiveBrand(validated.brand_id);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const runs = await listMonitoringRuns(brand.id);
    if (runs.length === 0) {
      return NextResponse.json(
        { error: "Must run at least one AI monitoring check before generating recommendations." },
        { status: 400 }
      );
    }

    const latestRun = runs[0];
    const { results } = await getMonitoringRun(latestRun.id);
    const citations = await listCitations(brand.id);

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
        related_prompt: rec.related_prompt || undefined,
        related_source: rec.related_source || undefined,
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

