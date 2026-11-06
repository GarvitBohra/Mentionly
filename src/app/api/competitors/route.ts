import { NextRequest, NextResponse } from "next/server";
import { getActiveBrand, listMonitoringRuns, getMonitoringRun } from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id") || undefined;

    const brand = await getActiveBrand(user.id, brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const runs = await listMonitoringRuns(user.id, brand.id);
    if (runs.length === 0) {
      return NextResponse.json({
        brand,
        brand_mention_rate: 0,
        brand_recommendation_rate: 0,
        brand_visibility_score: 0,
        competitors: (brand.competitors || []).map((c) => ({
          name: c.name,
          website: c.website,
          mention_count: 0,
          mention_rate: 0,
          recommendation_rate: 0,
          top_prompts: [],
        })),
        has_monitoring_data: false,
      });
    }

    const latestRun = runs[0];
    const { results } = await getMonitoringRun(user.id, latestRun.id);

    const totalResults = results.length || 1;
    const competitorMap: Record<
      string,
      {
        name: string;
        mention_count: number;
        recommendations: number;
        prompts: string[];
      }
    > = {};

    (brand.competitors || []).forEach((c) => {
      competitorMap[c.name] = {
        name: c.name,
        mention_count: 0,
        recommendations: 0,
        prompts: [],
      };
    });

    results.forEach((res) => {
      res.competitors_mentioned?.forEach((cm) => {
        if (cm.mentioned) {
          if (!competitorMap[cm.name]) {
            competitorMap[cm.name] = {
              name: cm.name,
              mention_count: 0,
              recommendations: 0,
              prompts: [],
            };
          }
          competitorMap[cm.name].mention_count++;
          if (cm.position === 1) {
            competitorMap[cm.name].recommendations++;
          }
          if (!competitorMap[cm.name].prompts.includes(res.prompt_query)) {
            competitorMap[cm.name].prompts.push(res.prompt_query);
          }
        }
      });
    });

    const competitors = Object.values(competitorMap).map((c) => ({
      name: c.name,
      mention_count: c.mention_count,
      mention_rate: Number(((c.mention_count / totalResults) * 100).toFixed(1)),
      recommendation_rate: Number(((c.recommendations / totalResults) * 100).toFixed(1)),
      top_prompts: c.prompts.slice(0, 3),
    }));

    return NextResponse.json({
      brand,
      brand_mention_rate: latestRun.brand_mention_rate,
      brand_recommendation_rate: latestRun.recommendation_rate,
      brand_visibility_score: latestRun.visibility_score,
      competitors,
      has_monitoring_data: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
