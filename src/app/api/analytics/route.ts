import { NextRequest, NextResponse } from "next/server";
import {
  getActiveBrand,
  listPrompts,
  listMonitoringRuns,
  getMonitoringRun,
  listCitations,
  listRecommendations,
} from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { DashboardAnalytics, PromptCategory } from "@/types";

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
      // User has no brands yet - return empty dashboard state
      const emptyAnalytics: DashboardAnalytics = {
        is_demo: user.email === "demo@mentionly.ai",
        selected_brand: {
          id: "",
          name: "No Brand Configured",
          website: "",
          industry: "",
          country: "",
          language: "",
          created_at: new Date().toISOString(),
          competitors: [],
        },
        kpis: {
          visibility_score: 0,
          brand_mention_rate: 0,
          competitor_mention_rate: 0,
          prompts_monitored: 0,
          sources_discovered: 0,
        },
        trend: [],
        brand_vs_competitor: [],
        category_breakdown: [],
        recent_runs: [],
        top_sources: [],
        best_prompts: [],
        missing_prompts: [],
        latest_recommendations: [],
      };
      return NextResponse.json({ analytics: emptyAnalytics });
    }

    const runs = await listMonitoringRuns(user.id, brand.id);
    const prompts = await listPrompts(user.id, brand.id);
    const citations = await listCitations(user.id, brand.id);
    const recommendations = await listRecommendations(user.id, brand.id);

    // If no runs exist yet for this brand
    if (runs.length === 0) {
      const emptyAnalytics: DashboardAnalytics = {
        is_demo: user.email === "demo@mentionly.ai",
        selected_brand: brand,
        kpis: {
          visibility_score: 0,
          brand_mention_rate: 0,
          competitor_mention_rate: 0,
          prompts_monitored: prompts.length,
          sources_discovered: 0,
        },
        trend: [],
        brand_vs_competitor: (brand.competitors || []).map((c) => ({
          name: c.name,
          mention_rate: 0,
          recommendation_rate: 0,
          is_target_brand: false,
        })),
        category_breakdown: [],
        recent_runs: [],
        top_sources: [],
        best_prompts: [],
        missing_prompts: [],
        latest_recommendations: [],
      };
      return NextResponse.json({ analytics: emptyAnalytics });
    }

    const latestRun = runs[0];
    const latestRunData = await getMonitoringRun(user.id, latestRun.id);
    const results = latestRunData.results || [];

    // Distinct sources
    const domainCounts: Record<string, { count: number; brandMentions: number; sampleUrl: string }> = {};
    for (const c of citations) {
      if (!domainCounts[c.domain]) {
        domainCounts[c.domain] = { count: 0, brandMentions: 0, sampleUrl: c.url };
      }
      domainCounts[c.domain].count++;
      if (c.mentions_brand) {
        domainCounts[c.domain].brandMentions++;
      }
    }

    const top_sources = Object.entries(domainCounts)
      .map(([domain, data]) => ({
        domain,
        count: data.count,
        mentions_brand_count: data.brandMentions,
        sample_url: data.sampleUrl,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Brand vs Competitor comparison
    const competitorStats: Record<string, { mentions: number; recommendations: number }> = {};
    const competitorNames = (brand.competitors || []).map((c) => c.name);

    competitorNames.forEach((name) => {
      competitorStats[name] = { mentions: 0, recommendations: 0 };
    });

    results.forEach((res) => {
      res.competitors_mentioned?.forEach((cm) => {
        if (cm.mentioned && competitorStats[cm.name]) {
          competitorStats[cm.name].mentions++;
          if (cm.position === 1) {
            competitorStats[cm.name].recommendations++;
          }
        }
      });
    });

    const totalPromptsInRun = results.length || 1;
    const brand_vs_competitor = [
      {
        name: brand.name,
        mention_rate: latestRun.brand_mention_rate,
        recommendation_rate: latestRun.recommendation_rate,
        is_target_brand: true,
      },
      ...competitorNames.map((name) => ({
        name,
        mention_rate: Number(
          (((competitorStats[name]?.mentions || 0) / totalPromptsInRun) * 100).toFixed(1)
        ),
        recommendation_rate: Number(
          (((competitorStats[name]?.recommendations || 0) / totalPromptsInRun) * 100).toFixed(1)
        ),
        is_target_brand: false,
      })),
    ];

    // Category breakdown
    const categories: PromptCategory[] = [
      "Discovery",
      "Recommendation",
      "Comparison",
      "Purchase Intent",
      "Problem Solving",
    ];

    const category_breakdown = categories
      .map((cat) => {
        const catResults = results.filter((r) => r.prompt_category === cat);
        if (catResults.length === 0) return null;
        const brandMentions = catResults.filter((r) => r.brand_mentioned).length;
        const rate = (brandMentions / catResults.length) * 100;
        return {
          category: cat,
          prompts_count: catResults.length,
          brand_mention_rate: Number(rate.toFixed(1)),
          visibility_score: Number((rate * 0.9).toFixed(1)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // Trend: chronological runs
    const trend = runs
      .slice(0, 7)
      .reverse()
      .map((r) => {
        const d = new Date(r.created_at);
        return {
          date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          visibility_score: r.visibility_score,
          brand_mentions: r.brand_mention_rate,
          competitor_mentions: r.competitor_mention_rate,
        };
      });

    // Best prompts
    const best_prompts = results
      .filter((r) => r.brand_mentioned)
      .map((r) => ({
        query: r.prompt_query,
        category: r.prompt_category,
        brand_recommended: r.brand_recommended,
        brand_position: r.brand_position,
      }))
      .slice(0, 5);

    // Missing prompts (where brand was not mentioned, but competitors were)
    const missing_prompts = results
      .filter((r) => !r.brand_mentioned)
      .map((r) => ({
        query: r.prompt_query,
        category: r.prompt_category,
        competitors_present: (r.competitors_mentioned || [])
          .filter((c) => c.mentioned)
          .map((c) => c.name),
      }))
      .slice(0, 5);

    const analytics: DashboardAnalytics = {
      is_demo: user.email === "demo@mentionly.ai",
      selected_brand: brand,
      kpis: {
        visibility_score: latestRun.visibility_score,
        brand_mention_rate: latestRun.brand_mention_rate,
        competitor_mention_rate: latestRun.competitor_mention_rate,
        prompts_monitored: prompts.length,
        sources_discovered: citations.length,
      },
      trend,
      brand_vs_competitor,
      category_breakdown,
      recent_runs: runs.slice(0, 5),
      top_sources,
      best_prompts,
      missing_prompts,
      latest_recommendations: recommendations.slice(0, 3),
    };

    return NextResponse.json({ analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
