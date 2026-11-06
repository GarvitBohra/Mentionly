"use client";

import React, { useState, useEffect } from "react";
import { Users2, TrendingUp, Trophy, ArrowRight, Eye, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Brand } from "@/types";

interface CompetitorData {
  name: string;
  website?: string;
  mention_count: number;
  mention_rate: number;
  recommendation_rate: number;
  top_prompts: string[];
}

export default function CompetitorsPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [totalPrompts, setTotalPrompts] = useState(0);
  const [brandMentionRate, setBrandMentionRate] = useState<number>(0);
  const [brandRecommendationRate, setBrandRecommendationRate] = useState<number>(0);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/competitors")
      .then((res) => res.json())
      .then((data) => {
        setBrand(data.brand || null);
        setCompetitors(data.competitors || []);
        setTotalPrompts(data.total_prompts || 0);
        setBrandMentionRate(data.brand_mention_rate ?? 0);
        setBrandRecommendationRate(data.brand_recommendation_rate ?? 0);
        setHasData(data.has_monitoring_data || false);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load competitor stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-44 rounded-xl bg-[#12161f]" />
          <div className="h-44 rounded-xl bg-[#12161f]" />
          <div className="h-44 rounded-xl bg-[#12161f]" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Competitor Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical benchmarking of competitor presence across AI answer grounding.
          </p>
        </div>
        <EmptyState
          icon={Users2}
          title="No competitor monitoring data available"
          description="Execute your first AI visibility check to compare mention rates and recommendation dominance against your competitors."
          actionText="Run Visibility Check"
          actionHref="/dashboard/visibility"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Competitor Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Comparing {brand?.name} against direct market rivals across {totalPrompts} search intents.
          </p>
        </div>
      </div>

      {/* Competitor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {competitors.map((comp) => (
          <Card key={comp.name} className="border-[#1e242c] bg-[#0c1015]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white">{comp.name}</CardTitle>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {comp.mention_count} Citations
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[#12161f] p-2.5 border border-[#1b212b]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">
                    Mention Rate
                  </span>
                  <span className="text-base font-bold font-mono text-slate-200">
                    {comp.mention_rate}%
                  </span>
                </div>
                <div className="rounded-lg bg-[#12161f] p-2.5 border border-[#1b212b]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">
                    Top Pick Rate
                  </span>
                  <span className="text-base font-bold font-mono text-indigo-400">
                    {comp.recommendation_rate}%
                  </span>
                </div>
              </div>

              {comp.top_prompts.length > 0 && (
                <div className="pt-2 border-t border-[#1e242c]">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase font-mono block mb-1.5">
                    Frequently Cited In:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {comp.top_prompts.map((p, i) => (
                      <li key={i} className="truncate text-[11px] text-slate-300 flex items-start gap-1.5">
                        <span className="text-slate-500">•</span>
                        <span className="truncate">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Head to Head Table */}
      <Card className="border-[#1e242c] bg-[#0c1015]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-200">
            Head-to-Head Search Share
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Empirical visibility observations from Gemini API Search Grounding responses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#10141c] text-slate-400 uppercase font-mono text-[10px] border-b border-[#1e242c]">
                <tr>
                  <th className="px-4 py-3">Brand / Competitor</th>
                  <th className="px-4 py-3">Mention Rate</th>
                  <th className="px-4 py-3">Recommendation Rate</th>
                  <th className="px-4 py-3">Relative AI Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e242c] text-slate-300">
                <tr className="bg-indigo-950/20 font-medium text-indigo-200">
                  <td className="px-4 py-3.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span>{brand?.name} (Your Brand)</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono">{brandMentionRate}%</td>
                  <td className="px-4 py-3.5 font-mono">{brandRecommendationRate}%</td>
                  <td className="px-4 py-3.5">
                    <div className="h-1.5 w-32 rounded-full bg-[#1b212b] overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, brandMentionRate))}%` }}
                      />
                    </div>
                  </td>
                </tr>
                {competitors.map((comp) => (
                  <tr key={comp.name} className="hover:bg-[#121620]">
                    <td className="px-4 py-3.5">{comp.name}</td>
                    <td className="px-4 py-3.5 font-mono">{comp.mention_rate}%</td>
                    <td className="px-4 py-3.5 font-mono">{comp.recommendation_rate}%</td>
                    <td className="px-4 py-3.5">
                      <div className="h-1.5 w-32 rounded-full bg-[#1b212b] overflow-hidden">
                        <div
                          className="h-full bg-slate-500 rounded-full"
                          style={{ width: `${comp.mention_rate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

