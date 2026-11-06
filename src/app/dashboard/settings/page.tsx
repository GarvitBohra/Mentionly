"use client";

import React, { useState } from "react";
import { Settings, Shield, Key, Database, BookOpen, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
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
            <CardTitle className="text-sm font-semibold text-white">Integrations & API Keys</CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-400">
            Mentionly uses server-side environment variables to authenticate with external APIs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-[#1e242c] bg-[#10141c] text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">Google Gemini API</span>
              <p className="text-[11px] text-slate-400">
                Official Google Gen AI SDK integration for visibility queries and search grounding.
              </p>
            </div>
            <Badge variant="default" className="text-[10px] font-mono">
              GEMINI_API_KEY
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-[#1e242c] bg-[#10141c] text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">Supabase PostgreSQL & Auth</span>
              <p className="text-[11px] text-slate-400">
                Row-level secure database for organization and brand monitoring history.
              </p>
            </div>
            <Badge variant="default" className="text-[10px] font-mono">
              SUPABASE_CONFIGURED
            </Badge>
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
                answers were grounded with live Google Web search chunks rather than unverified parametric memory.
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

