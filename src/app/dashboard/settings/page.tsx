"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Key,
  Database,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HealthData {
  supabase: {
    isConfigured: boolean;
    tablesExist: boolean;
    message?: string;
  };
  openai: {
    isConfigured: boolean;
    activeModels: string[];
  };
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error("Health check error:", err));
  }, []);

  const handleCopyPath = () => {
    navigator.clipboard.writeText("supabase/migrations/20261106_mentionly_init.sql");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white">Platform Settings & Environment</h1>
        <p className="text-xs text-slate-400 mt-1">
          Review integrations, API credentials status, and scoring documentation.
        </p>
      </div>

      {/* Integration Status Card */}
      <Card className="border-[#1e242c] bg-[#0c1015]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-sm font-semibold text-white">Integrations & API Status</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Real-time status check of external AI models and database backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* OpenAI */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-[#1e242c] bg-[#10141c] text-xs gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">OpenAI API</span>
                {health?.openai.isConfigured ? (
                  <Badge variant="success" className="text-[10px]">
                    API Key Configured
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">
                    API Key Missing
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Active model: {health?.openai.activeModels.join(", ") || "gpt-6-luna"}
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-500">OPENAI_API_KEY</span>
          </div>

          {/* Supabase */}
          <div className="p-3 rounded-lg border border-[#1e242c] bg-[#10141c] text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">Supabase PostgreSQL & Auth</span>
                  {health?.supabase.isConfigured ? (
                    health.supabase.tablesExist ? (
                      <Badge variant="success" className="text-[10px]">
                        Database Ready
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px]">
                        Schema Pending
                      </Badge>
                    )
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      In-Memory Mode
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {health?.supabase.message || "Row Level Security enabled schema"}
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500">SUPABASE_CONFIGURED</span>
            </div>

            {health?.supabase.isConfigured && !health?.supabase.tablesExist && (
              <div className="mt-2 rounded-lg bg-amber-950/30 border border-amber-900/50 p-2.5 text-[11px] text-amber-300 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Action Needed: Run Database Migration</span>
                </div>
                <p className="text-slate-300">
                  Your Supabase credentials are connected, but the 10 platform tables haven&apos;t been
                  created yet. Run the SQL migration script in your Supabase SQL Editor:
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-[#090d14] px-2 py-1 rounded text-indigo-300 font-mono text-[10px]">
                    supabase/migrations/20261106_mentionly_init.sql
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] text-indigo-400 gap-1 px-2"
                    onClick={handleCopyPath}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? "Copied" : "Copy Path"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Methodology Documentation */}
      <Card className="border-[#1e242c] bg-[#0c1015]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <CardTitle className="text-sm font-semibold text-white">
              AI Visibility Scoring Methodology
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Documentation of Mentionly&apos;s visibility index formula (0 - 100)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            The <strong>Mentionly AI Visibility Score</strong> benchmarks how reliably your brand appears,
            is recommended, and earns citations across conversational generative models.
          </p>

          <div className="space-y-2 rounded-lg bg-[#11151e] p-3 border border-[#1b212b]">
            <div className="flex items-start gap-2">
              <span className="font-mono text-indigo-400 font-bold shrink-0">40%</span>
              <div>
                <strong className="text-slate-200">Brand Mention Rate:</strong> Proportion of successful
                prompts where your brand name is explicitly cited in the answer text.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-mono text-indigo-400 font-bold shrink-0">35%</span>
              <div>
                <strong className="text-slate-200">Recommendation Rate:</strong> Proportion of answers
                where your brand is positioned as a top choice, recommended solution, or leading alternative.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-mono text-indigo-400 font-bold shrink-0">15%</span>
              <div>
                <strong className="text-slate-200">Ranking & Position Quality:</strong> Favorable position weighting
                when your brand appears in early positions (#1 to #3) of comparison lists.
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="font-mono text-indigo-400 font-bold shrink-0">10%</span>
              <div>
                <strong className="text-slate-200">Search Grounding Verification:</strong> Verification that
                answers were grounded with live Google Search chunks rather than unverified parametric memory.
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Disclaimer: The AI Visibility Score is an empirical benchmarking score computed by Mentionly.
            It does not constitute an official Google rating or an industry-wide standard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
