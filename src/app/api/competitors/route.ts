import { NextRequest, NextResponse } from "next/server";
import { getActiveBrand, listMonitoringRuns, getMonitoringRun, listCitations } from "@/lib/data-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id") || undefined;

    const brand = await getActiveBrand(brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const runs = await listMonitoringRuns(brand.id);
    if (runs.length === 0) {
      return NextResponse.json({
        brand,
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
    const { results } = await getMonitoringRun(latestRun.id);
    const citations = await listCitations(brand.id);

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
          competitorMap[cm.name].prompts.push(res.prompt_query);
        }
      });
    });

    const competitorsList = Object.values(competitorMap).map((item) => ({
      name: item.name,
      mention_count: item.mention_count,
      mention_rate: Number(((item.mention_count / totalResults) * 100).toFixed(1)),
      recommendation_rate: Number(((item.recommendations / totalResults) * 100).toFixed(1)),
      top_prompts: item.prompts.slice(0, 4),
    }));

    return NextResponse.json({
      brand,
      competitors: competitorsList,
      total_prompts: totalResults,
      has_monitoring_data: true,
      last_monitored_at: latestRun.created_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

