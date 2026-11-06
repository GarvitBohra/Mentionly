"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Filter,
  Check,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { GEORecommendation, GEOCategory, GEOPriority, GEOStatus, Brand } from "@/types";

const CATEGORIES: GEOCategory[] = [
  "Website Content",
  "Brand Authority",
  "Missing Information",
  "Competitor Insights",
  "Content Opportunities",
];

export default function RecommendationsPage() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [recommendations, setRecommendations] = useState<GEORecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRecommendations = () => {
    setLoading(true);
    fetch("/api/recommendations")
      .then((res) => res.json())
      .then((data) => {
        setBrand(data.brand || null);
        setRecommendations(data.recommendations || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch recommendations:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleGenerateRecommendations = async () => {
    if (!brand) return;
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_id: brand.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate recommendations");
      }
      loadRecommendations();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate recommendations");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: GEOStatus) => {
    try {
      await fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filtered = recommendations.filter((r) => {
    const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || r.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Generative Engine Optimization (GEO) Insights
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Data-backed action items synthesized by Gemini to maximize {brand?.name}&apos;s citation
            share in AI search responses.
          </p>
        </div>

        <Button
          onClick={handleGenerateRecommendations}
          isLoading={isGenerating}
          variant="primary"
          size="sm"
          className="gap-1.5 text-xs shadow-md shadow-indigo-950"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Generate Insights with Gemini</span>
        </Button>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedCategory === "All"
              ? "bg-indigo-600 text-white"
              : "bg-[#141922] text-slate-400 hover:text-slate-200 border border-[#222a36]"
          }`}
        >
          All Categories ({recommendations.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = recommendations.filter((r) => r.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-[#141922] text-slate-400 hover:text-slate-200 border border-[#222a36]"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Recommendations Cards List */}
      <div className="space-y-4">
        {filtered.map((rec) => (
          <Card key={rec.id} className="border-[#1e242c] bg-[#0c1015]">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {rec.category}
                  </Badge>
                  <CardTitle className="text-sm font-semibold text-white">{rec.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      rec.priority === "High"
                        ? "destructive"
                        : rec.priority === "Medium"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-[10px] uppercase font-mono"
                  >
                    {rec.priority} Priority
                  </Badge>

                  <select
                    value={rec.status}
                    onChange={(e) => handleUpdateStatus(rec.id, e.target.value as GEOStatus)}
                    className="rounded-lg border border-[#262c36] bg-[#12161f] px-2 py-0.5 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="applied">Applied</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              {/* Explanation & Action */}
              <div className="space-y-1.5">
                <p className="text-slate-300 leading-relaxed">{rec.explanation}</p>
                <div className="rounded-lg bg-indigo-950/20 border border-indigo-900/40 p-3 text-indigo-200">
                  <span className="font-semibold text-indigo-300 block mb-1">
                    Suggested Action:
                  </span>
                  {rec.suggested_action}
                </div>
              </div>

              {/* Evidence from Monitoring */}
              <div className="rounded-lg bg-[#11151e] p-2.5 border border-[#1b212b] text-slate-400 space-y-1">
                <span className="text-[10px] font-semibold uppercase font-mono text-slate-400 block">
                  Evidence Observed from AI Search Monitoring:
                </span>
                <p className="text-[11px] text-slate-300 italic">&ldquo;{rec.evidence}&rdquo;</p>
              </div>

              {/* Related metadata */}
              {(rec.related_prompt || rec.related_source) && (
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#1e242c] text-[11px] text-slate-400">
                  {rec.related_prompt && (
                    <span className="truncate max-w-md">
                      Prompt: <strong className="text-slate-300">&ldquo;{rec.related_prompt}&rdquo;</strong>
                    </span>
                  )}
                  {rec.related_source && (
                    <a
                      href={rec.related_source}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>Related Source</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon={Sparkles}
            title="No recommendations found"
            description="Run an AI visibility check or click 'Generate Insights with Gemini' to get tailored GEO suggestions."
            actionText="Generate Recommendations"
            onAction={handleGenerateRecommendations}
          />
        )}
      </div>
    </div>
  );
}

