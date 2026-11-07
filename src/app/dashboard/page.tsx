"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  TrendingUp,
  Users2,
  Compass,
  Link2,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { DashboardAnalytics } from "@/types";
import { formatDate, formatTimeAgo } from "@/lib/utils";

function DashboardContent() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const brandId = searchParams.get("brand_id");

  useEffect(() => {
    setLoading(true);
    const endpoint = brandId ? `/api/analytics?brand_id=${encodeURIComponent(brandId)}` : "/api/analytics";
    fetch(endpoint)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unable to load dashboard");
        return json;
      })
      .then((json) => {
        setData(json.analytics || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
        setLoading(false);
      });
  }, [brandId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#12161f]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 rounded-xl bg-[#12161f]" />
          <div className="h-72 rounded-xl bg-[#12161f]" />
        </div>
      </div>
    );
  }

  if (!data || !data.selected_brand?.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">AI Search Visibility</h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical monitoring of brand citations, recommendations, and search grounding.
          </p>
        </div>
        <DisclaimerBanner />
        <EmptyState
          icon={Eye}
          title="Get Started: Add Your Brand"
          description="Register your brand, target website, and key competitors to start generating intent-based AI search queries."
          actionText="Create Brand"
          actionHref="/dashboard/brands"
        />
      </div>
    );
  }

  if (data.recent_runs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">AI Search Visibility</h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical monitoring of brand citations, recommendations, and search grounding.
          </p>
        </div>
        <DisclaimerBanner />
        <EmptyState
          icon={Eye}
          title="No visibility monitoring checks yet"
          description={`Run your first AI search monitoring check for ${data.selected_brand.name} to discover if Gemini cites and recommends your products.`}
          actionText="Run Visibility Check"
          actionHref="/dashboard/visibility"
        />
      </div>
    );
  }

  const {
    is_demo,
    selected_brand,
    kpis,
    trend,
    brand_vs_competitor,
    category_breakdown,
    recent_runs,
    top_sources,
    best_prompts,
    missing_prompts,
    latest_recommendations,
  } = data;

  const scoreTrendData =
    trend && trend.length >= 2
      ? (() => {
          const last = trend[trend.length - 1].visibility_score;
          const prev = trend[trend.length - 2].visibility_score;
          const diff = Number((last - prev).toFixed(1));
          return {
            value: `${diff >= 0 ? "+" : ""}${diff}% vs last check`,
            isPositive: diff >= 0,
          };
        })()
      : { value: "Initial benchmark", isPositive: true };

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {selected_brand.name} Visibility Overview
            </h1>
            {is_demo && (
              <Badge variant="warning" className="text-[10px] uppercase font-mono tracking-wider">
                DEMO DATA
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitoring across Gemini generative search grounding queries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/visibility">
            <Button size="sm" variant="primary" className="gap-1.5 text-xs shadow-md shadow-indigo-950">
              <Play className="h-3 w-3 fill-current" />
              <span>Run Monitoring Check</span>
            </Button>
          </Link>
        </div>
      </div>

      <DisclaimerBanner />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="AI Visibility Score"
          value={`${kpis.visibility_score}/100`}
          subtitle="Composite brand presence index"
          icon={TrendingUp}
          highlight
          trend={scoreTrendData}
        />
        <KpiCard
          title="Brand Mention Rate"
          value={`${kpis.brand_mention_rate}%`}
          subtitle="Answers citing your brand"
          icon={Eye}
          trend={{ value: "Observed", isPositive: true }}
        />
        <KpiCard
          title="Competitor Mention Rate"
          value={`${kpis.competitor_mention_rate}%`}
          subtitle="Prompts citing competitors"
          icon={Users2}
        />
        <KpiCard
          title="Prompts Monitored"
          value={kpis.prompts_monitored}
          subtitle="Active search intents"
          icon={Compass}
        />
        <KpiCard
          title="Sources Discovered"
          value={kpis.sources_discovered}
          subtitle="Distinct grounding links"
          icon={Link2}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <Card className="border-[#1e242c] bg-[#0c1015]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-200">
                  AI Visibility Score Trend
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Historical visibility score across previous monitoring runs
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-[11px]">
                Last Runs
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="visGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f242d" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d1117",
                      borderColor: "#2d333b",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visibility_score"
                    name="Visibility Score"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#visGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brand vs Competitor Comparison Bar Chart */}
        <Card className="border-[#1e242c] bg-[#0c1015]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-200">
                  Brand vs. Competitor Mentions
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Percentage of monitored queries where brand or competitor was cited
                </CardDescription>
              </div>
              <Link href="/dashboard/competitors">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-400 gap-1">
                  Details <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={brand_vs_competitor}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f242d" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0d1117",
                      borderColor: "#2d333b",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Bar dataKey="mention_rate" name="Mention Rate %" radius={[0, 4, 4, 0]}>
                    {brand_vs_competitor.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.is_target_brand ? "#6366f1" : "#334155"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown & Recent Runs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visibility by Prompt Category */}
        <Card className="border-[#1e242c] bg-[#0c1015] lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-200">
              Visibility by Category
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Customer search intent distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {category_breakdown.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.category}</span>
                  <span className="text-indigo-400 font-mono">{cat.brand_mention_rate}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#1b212b] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${cat.brand_mention_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Best Performing vs Missing Prompts */}
        <Card className="border-[#1e242c] bg-[#0c1015] lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-200">
                  Prompt Observations
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Where your brand shines vs. where competitors were favored
                </CardDescription>
              </div>
              <Link href="/dashboard/prompts">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-400 gap-1">
                  All Prompts <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Brand Cited & Recommended
              </p>
              <div className="space-y-2">
                {best_prompts.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-[#1e2530] bg-[#10141c] p-2.5 text-xs"
                  >
                    <span className="text-slate-200 truncate max-w-[80%]">{p.query}</span>
                    <Badge variant="success" className="text-[10px]">
                      {p.brand_position ? `Rank #${p.brand_position}` : "Cited"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {missing_prompts.length > 0 && (
              <div className="pt-2 border-t border-[#1e242c]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Brand Missing (Competitors Present)
                </p>
                <div className="space-y-2">
                  {missing_prompts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-rose-950/40 bg-rose-950/10 p-2.5 text-xs"
                    >
                      <span className="text-slate-300 truncate max-w-[70%]">{p.query}</span>
                      <span className="text-[11px] text-slate-400 truncate">
                        Competitors: {p.competitors_present.join(", ") || "Industry leads"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Top Cited Grounding Sources & GEO Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sources */}
        <Card className="border-[#1e242c] bg-[#0c1015]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-200">
                  Top Cited Sources
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Domains Google Search Grounding cites most frequently
                </CardDescription>
              </div>
              <Link href="/dashboard/sources">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-400 gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {top_sources.map((src, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-[#1e2530] bg-[#10141c] p-2.5 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <Link2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-200 font-medium truncate">{src.domain}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400 text-[11px]">
                    {src.count} citation{src.count > 1 ? "s" : ""}
                  </span>
                  <a
                    href={src.sample_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actionable GEO Recommendations Preview */}
        <Card className="border-[#1e242c] bg-[#0c1015]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-200">
                  GEO Recommendations
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  AI-suggested actions to boost grounding citation share
                </CardDescription>
              </div>
              <Link href="/dashboard/recommendations">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-400 gap-1">
                  Manage <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {latest_recommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-lg border border-[#1e2530] bg-[#10141c] p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{rec.title}</span>
                  <Badge
                    variant={rec.priority === "High" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {rec.suggested_action}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={<div className="h-72 animate-pulse rounded-xl bg-[#12161f]" aria-label="Loading dashboard" />}
    >
      <DashboardContent />
    </Suspense>
  );
}

