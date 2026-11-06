"use client";

import React from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  TrendingUp,
  ShieldCheck,
  Compass,
  Link2,
  Users2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070a0e] text-slate-100 selection:bg-indigo-500/30">
      {/* 1. Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[#1c222b] bg-[#070a0e]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40">
              <Search className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">Mentionly</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-200 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">
              How It Works
            </a>
            <a href="#preview" className="hover:text-slate-200 transition-colors">
              Dashboard
            </a>
            <a href="#methodology" className="hover:text-slate-200 transition-colors">
              Methodology
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">
                Log In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm" variant="primary" className="text-xs">
                Explore Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-indigo-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3.5 py-1 text-xs text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Search Visibility Platform</span>
            <span className="h-1 w-1 rounded-full bg-indigo-400" />
            <span className="text-[11px] text-indigo-400">Powered by Gemini Search Grounding</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
            Know when AI talks about your brand.
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Monitor your brand visibility across AI-generated answers, understand your competitors,
            and discover the sources shaping AI recommendations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/dashboard/visibility">
              <Button size="lg" variant="primary" className="w-full sm:w-auto text-sm gap-2">
                Start Monitoring
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-sm">
                Explore Dashboard
              </Button>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Empirical Gemini Grounding Analysis
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Competitor Mention Tracking
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Actionable GEO Insights
            </span>
          </div>
        </div>
      </section>

      {/* 3. Product Explanation */}
      <section className="py-16 border-t border-[#1c222b] bg-[#090d12]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Why AI Search Visibility Matters
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              When customers ask conversational search engines for product recommendations, AI decides
              which brands to cite, which to recommend, and which to omit. Mentionly turns black-box AI
              answers into transparent, actionable intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-[#1e242c] bg-[#0c1015] p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Measure Citations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Determine whether your company is named in answer texts, recommended as a top pick,
                or omitted entirely in favor of competitors.
              </p>
            </Card>

            <Card className="border-[#1e242c] bg-[#0c1015] p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
                <Link2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Audit Grounding Sources</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect the exact URLs and publisher domains retrieved by Google Search Grounding to
                synthesize answers.
              </p>
            </Card>

            <Card className="border-[#1e242c] bg-[#0c1015] p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">Actionable GEO Guidance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive Gemini-synthesized Generative Engine Optimization (GEO) recommendations to
                optimize your domain schema and authority.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Feature Overview */}
      <section id="features" className="py-16 border-t border-[#1c222b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Built for Modern Marketers & Brand Strategists
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#1e242c] bg-[#0c1015] p-5 space-y-2.5">
              <Compass className="h-5 w-5 text-indigo-400" />
              <h4 className="font-semibold text-white text-xs">Prompt Intent Explorer</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automatically generate high-intent queries across Discovery, Recommendation, and
                Comparison categories using Gemini.
              </p>
            </div>

            <div className="rounded-xl border border-[#1e242c] bg-[#0c1015] p-5 space-y-2.5">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <h4 className="font-semibold text-white text-xs">AI Visibility Scoring</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Weighted 0–100 index combining brand mention rate, recommendation strength, ranking
                position, and source grounding.
              </p>
            </div>

            <div className="rounded-xl border border-[#1e242c] bg-[#0c1015] p-5 space-y-2.5">
              <Users2 className="h-5 w-5 text-indigo-400" />
              <h4 className="font-semibold text-white text-xs">Competitor Benchmarking</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Track rival brands head-to-head to see who captures top-pick recommendations in your
                industry.
              </p>
            </div>

            <div className="rounded-xl border border-[#1e242c] bg-[#0c1015] p-5 space-y-2.5">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              <h4 className="font-semibold text-white text-xs">Search Grounding Verification</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Filter parametric hallucination by strictly analyzing citations from verified Google
                Search web chunks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works */}
      <section id="how-it-works" className="py-16 border-t border-[#1c222b] bg-[#090d12]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-3 mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 font-mono">
              Simple Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              How Mentionly Operates
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-mono text-xs font-bold">
                01
              </div>
              <h4 className="font-semibold text-white text-xs">Onboard Brand & Competitors</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Enter your company website, industry, and main competitors.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-mono text-xs font-bold">
                02
              </div>
              <h4 className="font-semibold text-white text-xs">Generate Search Prompts</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Use Gemini to generate the exact questions potential buyers ask.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-mono text-xs font-bold">
                03
              </div>
              <h4 className="font-semibold text-white text-xs">Execute Grounded Checks</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Run batch prompts through the Gemini API with Google Search Grounding.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-mono text-xs font-bold">
                04
              </div>
              <h4 className="font-semibold text-white text-xs">Analyze & Optimize</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Inspect mention rates, competitor share, and execute GEO suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Dashboard Preview Callout */}
      <section id="preview" className="py-16 border-t border-[#1c222b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-[#0f1420] to-[#090d14] p-8 sm:p-12 text-center space-y-6 glow-subtle">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white max-w-2xl mx-auto">
              Ready to explore your brand’s AI visibility?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              Experience the full interactive dashboard, run visibility checks, and see how Gemini
              grounding evaluates top brands.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/dashboard">
                <Button size="lg" variant="primary" className="text-sm gap-2">
                  Launch Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-[#1c222b] bg-[#070a0e] py-12 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white font-bold text-xs">
              M
            </div>
            <span className="font-semibold text-slate-200">Mentionly</span>
            <span className="text-[11px] text-slate-400">
              — Know when AI talks about your brand.
            </span>
          </div>

          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Mentionly measures AI visibility. It does not guarantee that brands will appear in
            AI-generated answers.
          </div>
        </div>
      </footer>
    </div>
  );
}

