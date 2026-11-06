"use client";

import React, { useState, useEffect } from "react";
import { Link2, ExternalLink, Globe, Search, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Citation, Brand } from "@/types";
import { formatDate } from "@/lib/utils";

export default function SourcesPage() {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [domains, setDomains] = useState<
    Array<{ domain: string; count: number; mentionsBrand: number; urls: string[] }>
  >([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sources")
      .then((res) => res.json())
      .then((data) => {
        setBrand(data.brand || null);
        setCitations(data.citations || []);
        setDomains(data.domains || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch sources:", err);
        setLoading(false);
      });
  }, []);

  const filteredCitations = citations.filter(
    (c) =>
      c.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.associated_prompt?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-slate-800" />
        <div className="h-64 rounded-xl bg-[#12161f]" />
      </div>
    );
  }

  if (citations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Sources & Grounding Citations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Verified web citations and domains that Google Search Grounding retrieves to inform answers.
          </p>
        </div>
        <EmptyState
          icon={Link2}
          title="No grounding citations discovered yet"
          description="Execute an AI visibility monitoring run to extract actual search citations and domain sources shaping Gemini's recommendations."
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
          <h1 className="text-xl font-bold tracking-tight text-white">Sources & Grounding Citations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical web sources retrieved by Google Search Grounding during AI model generation.
          </p>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search domains or citations..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Domain-Level Analysis Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {domains.slice(0, 4).map((d) => (
          <Card key={d.domain} className="border-[#1e242c] bg-[#0c1015]">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-200 text-xs truncate">{d.domain}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {d.count} hit{d.count > 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Mentions {brand?.name}:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {d.mentionsBrand} citation{d.mentionsBrand > 1 ? "s" : ""}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Citations Table */}
      <Card className="border-[#1e242c] bg-[#0c1015]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-200">
            Discovered Citations ({filteredCitations.length})
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Direct URLs cited by Gemini search grounding with associated customer search query
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[#1e242c]">
            {filteredCitations.map((c) => (
              <div key={c.id} className="p-4 hover:bg-[#121620] transition-colors space-y-2 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-indigo-400 hover:underline flex items-center gap-1 text-xs sm:text-sm"
                    >
                      <span>{c.title || c.domain}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-mono">{c.domain}</span>
                      <span>•</span>
                      <span>{formatDate(c.created_at)}</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {c.mentions_brand ? (
                      <Badge variant="success" className="text-[10px]">
                        Brand Cited
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        General Industry Source
                      </Badge>
                    )}
                  </div>
                </div>

                {c.associated_prompt && (
                  <div className="rounded-lg bg-[#11151e] p-2 text-[11px] text-slate-300 border border-[#1b212b]">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block">
                      Associated Query:
                    </span>
                    &ldquo;{c.associated_prompt}&rdquo;
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

