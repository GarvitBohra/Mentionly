"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Link2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/ui/disclaimer-banner";
import { Brand, Prompt, MonitoringRun, MonitoringResult } from "@/types";
import { formatDate, formatTimeAgo } from "@/lib/utils";

export default function VisibilityMonitoringPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);
  const [runs, setRuns] = useState<MonitoringRun[]>([]);
  const [activeRunDetails, setActiveRunDetails] = useState<{
    run: MonitoringRun;
    results: MonitoringResult[];
  } | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load brands
  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => {
        if (data.brands && data.brands.length > 0) {
          setBrands(data.brands);
          setSelectedBrandId(data.brands[0].id);
        }
      });
  }, []);

  // Load prompts & runs when selected brand changes
  useEffect(() => {
    if (!selectedBrandId) return;

    fetch(`/api/prompts?brand_id=${selectedBrandId}`)
      .then((res) => res.json())
      .then((data) => {
        const activePrompts = (data.prompts || []).filter((p: Prompt) => p.is_active);
        setPrompts(data.prompts || []);
        setSelectedPromptIds(activePrompts.map((p: Prompt) => p.id));
      });

    fetch(`/api/monitoring?brand_id=${selectedBrandId}`)
      .then((res) => res.json())
      .then((data) => {
        const fetchedRuns = data.runs || [];
        setRuns(fetchedRuns);
        if (fetchedRuns.length > 0) {
          loadRunDetails(fetchedRuns[0].id);
        } else {
          setActiveRunDetails(null);
        }
      });
  }, [selectedBrandId]);

  const loadRunDetails = (runId: string) => {
    fetch(`/api/monitoring/${runId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.run) {
          setActiveRunDetails({
            run: data.run,
            results: data.results || [],
          });
        }
      });
  };

  const handleTogglePrompt = (id: string) => {
    setSelectedPromptIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleStartMonitoring = async () => {
    if (selectedPromptIds.length === 0) {
      setErrorMsg("Please select at least one prompt to test.");
      return;
    }

    setIsRunning(true);
    setErrorMsg(null);
    setProgress(15);

    try {
      // Fake progressive progress while API computes
      const progressTimer = setInterval(() => {
        setProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 700);

      const res = await fetch("/api/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: selectedBrandId,
          prompt_ids: selectedPromptIds,
        }),
      });

      clearInterval(progressTimer);
      setProgress(100);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Monitoring run failed");
      }

      // Reload runs and select latest
      const runsRes = await fetch(`/api/monitoring?brand_id=${selectedBrandId}`);
      const runsData = await runsRes.json();
      setRuns(runsData.runs || []);
      if (data.run?.id) {
        loadRunDetails(data.run.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute monitoring run");
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const currentBrand = brands.find((b) => b.id === selectedBrandId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">AI Visibility Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Execute batch search intent checks against Gemini API with Search Grounding enabled.
          </p>
        </div>
      </div>

      <DisclaimerBanner />

      {/* Execution Control Card */}
      <Card className="border-[#1e242c] bg-[#0c1015]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-200">
                Start New Visibility Run
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Target: {currentBrand?.name || "Selected Brand"} ({selectedPromptIds.length} active
                prompts selected)
              </CardDescription>
            </div>
            <Button
              onClick={handleStartMonitoring}
              isLoading={isRunning}
              variant="primary"
              size="sm"
              className="gap-2 text-xs"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isRunning ? "Testing Against Gemini..." : "Run AI Check"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Progress bar when running */}
          {isRunning && (
            <div className="space-y-1.5 p-3 rounded-lg border border-indigo-900/40 bg-indigo-950/20">
              <div className="flex items-center justify-between text-xs text-indigo-300">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  Querying Gemini with Google Search Grounding...
                </span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Prompt Selection Checkboxes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Select Prompts for this Batch Check:</span>
              <button
                type="button"
                onClick={() =>
                  setSelectedPromptIds(
                    selectedPromptIds.length === prompts.length ? [] : prompts.map((p) => p.id)
                  )
                }
                className="text-indigo-400 hover:underline"
              >
                {selectedPromptIds.length === prompts.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {prompts.map((prompt) => (
                <label
                  key={prompt.id}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition-colors ${selectedPromptIds.includes(prompt.id)
                      ? "border-indigo-600/40 bg-indigo-950/20 text-slate-200"
                      : "border-[#1e242c] bg-[#10141c] text-slate-400 hover:border-slate-700"
                    }`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedPromptIds.includes(prompt.id)}
                    onChange={() => handleTogglePrompt(prompt.id)}
                  />
                  <div className="flex-1 truncate">
                    <span className="truncate block font-medium">{prompt.query_text}</span>
                    <span className="text-[10px] text-slate-400">{prompt.category}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latest Run Results & Inspection */}
      {activeRunDetails && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-white">Monitoring Run Observations</h2>
              <Badge
                variant={activeRunDetails.run.status === "completed" ? "success" : activeRunDetails.run.status === "failed" ? "destructive" : "secondary"}
                className="capitalize text-[11px]"
              >
                {activeRunDetails.run.status}
              </Badge>
            </div>
            <span className="text-xs text-slate-400">
              Run Date: {formatDate(activeRunDetails.run.created_at)} (
              {formatTimeAgo(activeRunDetails.run.created_at)})
            </span>
          </div>

          {/* Error Notice Banner if run had failures or partial errors */}
          {activeRunDetails.run.error_message && (
            <div className={`rounded-xl border p-3.5 text-xs flex items-start gap-2.5 ${activeRunDetails.run.status === "failed"
                ? "border-rose-900/60 bg-rose-950/30 text-rose-300"
                : "border-amber-900/50 bg-amber-950/20 text-amber-300"
              }`}>
              <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${activeRunDetails.run.status === "failed" ? "text-rose-400" : "text-amber-400"
                }`} />
              <div>
                <span className="font-semibold block text-slate-200">
                  {activeRunDetails.run.status === "failed" ? "Execution Failure" : "Partial Prompt Notice"}
                </span>
                <span>{activeRunDetails.run.error_message}</span>
              </div>
            </div>
          )}

          {/* Quick Metrics from this run */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#1f252e] bg-[#0c1016] p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Visibility Score</span>
              <span className="text-xl font-bold font-mono text-indigo-400">
                {activeRunDetails.run.visibility_score}/100
              </span>
            </div>
            <div className="rounded-xl border border-[#1f252e] bg-[#0c1016] p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Brand Mention Rate</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {activeRunDetails.run.brand_mention_rate}%
              </span>
            </div>
            <div className="rounded-xl border border-[#1f252e] bg-[#0c1016] p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Recommendation Rate</span>
              <span className="text-xl font-bold font-mono text-indigo-300">
                {activeRunDetails.run.recommendation_rate}%
              </span>
            </div>
            <div className="rounded-xl border border-[#1f252e] bg-[#0c1016] p-3 text-center">
              <span className="text-[11px] text-slate-400 block">Competitor Mentions</span>
              <span className="text-xl font-bold font-mono text-slate-300">
                {activeRunDetails.run.competitor_mention_rate}%
              </span>
            </div>
          </div>

          {/* Individual Prompt Execution Cards */}
          <div className="space-y-3">
            {activeRunDetails.results.map((res) => {
              const isExpanded = expandedResultId === res.id;
              return (
                <Card
                  key={res.id}
                  className={`border-[#1e242c] bg-[#0c1015] transition-all ${res.brand_mentioned ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-slate-700"
                    }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {res.prompt_category}
                          </Badge>
                          <span className="font-semibold text-slate-200 text-xs sm:text-sm">
                            &ldquo;{res.prompt_query}&rdquo;
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {res.error ? (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Execution Error
                          </Badge>
                        ) : res.brand_mentioned ? (
                          <Badge variant="success" className="text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {res.brand_recommended ? "Brand Recommended" : "Brand Mentioned"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-1 text-slate-400">
                            <AlertCircle className="h-3 w-3" />
                            Brand Not Cited
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-slate-400"
                          onClick={() => setExpandedResultId(isExpanded ? null : res.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Error message block if query failed */}
                    {res.error && (
                      <div className="rounded-lg bg-rose-950/20 p-2.5 text-xs text-rose-300 border border-rose-900/40">
                        <span className="text-[10px] uppercase font-mono text-rose-400 block mb-0.5">
                          API Error
                        </span>
                        {res.error}
                      </div>
                    )}

                    {/* Context snippet if mentioned */}
                    {res.mention_context && (
                      <div className="rounded-lg bg-[#12161f] p-2.5 text-xs text-slate-300 border border-[#1b212b]">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                          Mention Context
                        </span>
                        &ldquo;{res.mention_context}&rdquo;
                      </div>
                    )}

                    {/* Competitor presence */}
                    {res.competitors_mentioned && res.competitors_mentioned.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        <span>Competitors in this answer:</span>
                        {res.competitors_mentioned.map((comp, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${comp.mentioned
                                ? "bg-amber-950/40 border-amber-800/40 text-amber-300"
                                : "bg-[#141922] border-[#222a36] text-slate-500 line-through"
                              }`}
                          >
                            {comp.name} {comp.position ? `(#${comp.position})` : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Expanded Original Raw Gemini Response & Sources */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-[#1e242c] space-y-3">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono block mb-1.5">
                            Original AI Observation Text (Gemini API)
                          </span>
                          <div className="rounded-lg bg-[#070a0e] p-3 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap border border-[#1b212b]">
                            {res.raw_response || "No raw text response returned."}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Runs List */}
      <Card className="border-[#1e242c] bg-[#0c1015]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-200">
            Monitoring Run History
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Previous visibility check executions and score progression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {runs.map((r) => (
              <div
                key={r.id}
                onClick={() => loadRunDetails(r.id)}
                className={`flex items-center justify-between rounded-lg border p-3 text-xs cursor-pointer transition-colors ${activeRunDetails?.run.id === r.id
                    ? "border-indigo-600/40 bg-indigo-950/20"
                    : "border-[#1e242c] bg-[#10141c] hover:bg-[#151b24]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="capitalize text-[10px]">
                    {r.status}
                  </Badge>
                  <span className="text-slate-200 font-medium">{formatDate(r.created_at)}</span>
                  <span className="text-slate-400 text-[11px]">
                    {r.total_prompts} prompt{r.total_prompts > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-indigo-400 font-bold">
                    Score: {r.visibility_score}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Brand: {r.brand_mention_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

