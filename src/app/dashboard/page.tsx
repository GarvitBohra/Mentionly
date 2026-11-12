"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Sparkles, Play, Trash2, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brand, RunSummary } from "@/types";

async function api<T = any>(url: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.error) throw new Error(data.error);
    if (res.status === 504 || res.status === 408) {
      throw new Error("The server timed out before ChatGPT finished. Try again; if it keeps happening, your host's function time limit is too short.");
    }
    throw new Error(`Request failed (${res.status})`);
  }
  return data;
}

export default function DashboardPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"" | "save" | "prompts" | "run">("");
  const [error, setError] = useState("");

  // Brand form (add or edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [competitors, setCompetitors] = useState("");

  const brand = brands.find((b) => b.id === brandId) || null;

  const loadBrands = useCallback(async (selectId?: string) => {
    try {
      const { brands } = await api<{ brands: Brand[] }>("/api/brands");
      setBrands(brands);
      setBrandId((current) => selectId || (brands.some((b) => b.id === current) ? current : brands[0]?.id || ""));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    setSummary(null);
    if (!brandId) return;
    api<RunSummary>(`/api/results?brand_id=${brandId}`).then(setSummary).catch((e) => setError(e.message));
  }, [brandId]);

  const run = async (kind: "save" | "prompts" | "run", fn: () => Promise<void>) => {
    setBusy(kind);
    setError("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const openForm = (edit: boolean) => {
    setEditing(edit);
    setName(edit && brand ? brand.name : "");
    setKeyword(edit && brand ? brand.keyword : "");
    setCompetitors(edit && brand ? brand.competitors.map((c) => c.name).join(", ") : "");
    setFormOpen(true);
  };

  const saveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    run("save", async () => {
      const body = { name, keyword, competitors: competitors.split(",") };
      const { brand: saved } = editing && brand
        ? await api<{ brand: Brand }>(`/api/brands/${brand.id}`, "PATCH", body)
        : await api<{ brand: Brand }>("/api/brands", "POST", body);
      setFormOpen(false);
      await loadBrands(saved.id);
    });
  };

  const deleteBrand = () =>
    brand &&
    confirm(`Delete "${brand.name}" and all its results?`) &&
    run("save", async () => {
      await api(`/api/brands/${brand.id}`, "DELETE");
      await loadBrands();
    });

  const generatePrompts = () =>
    brand &&
    run("prompts", async () => {
      await api("/api/prompts/generate", "POST", { brand_id: brand.id });
      await loadBrands(brand.id);
    });

  const removePrompt = (id: string) =>
    run("prompts", async () => {
      await api(`/api/prompts?id=${id}`, "DELETE");
      await loadBrands(brandId);
    });

  const runCheck = () =>
    brand &&
    run("run", async () => {
      setSummary(await api<RunSummary>("/api/run", "POST", { brand_id: brand.id }));
    });

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <>
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-900/60 bg-rose-950/40 p-3 text-sm text-rose-200">
          <span>{error}</span>
          <button onClick={() => setError("")} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Brand */}
      <Card className="border-[#1e242c] bg-[#0c1015]">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base text-white">1. Your brand</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              The brand name, the keyword people search, and the competitors to compare against.
            </CardDescription>
          </div>
          {!formOpen && (
            <Button size="sm" variant="secondary" onClick={() => openForm(false)}>
              <Plus className="h-3.5 w-3.5" /> Add brand
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {formOpen && (
            <form onSubmit={saveBrand} className="space-y-3 rounded-lg border border-[#1e242c] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-slate-300">
                  Brand name
                  <Input required placeholder="Burger King" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="space-y-1 text-xs text-slate-300">
                  Keyword people search
                  <Input required placeholder="burger" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </label>
              </div>
              <label className="block space-y-1 text-xs text-slate-300">
                Competitors (comma separated)
                <Input placeholder="McDonald's, Wendy's" value={competitors} onChange={(e) => setCompetitors(e.target.value)} />
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={busy === "save"}>
                  {editing ? "Save changes" : "Add brand"}
                </Button>
              </div>
            </form>
          )}

          {brands.length === 0 && !formOpen && (
            <p className="text-sm text-slate-400">No brand yet. Add one to get started.</p>
          )}

          {brand && (
            <div className="flex flex-wrap items-center gap-3">
              {brands.length > 1 && (
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="h-8 rounded-md border border-[#2d3748] bg-[#0c1015] px-2 text-xs text-slate-200"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="text-sm text-slate-300">
                <span className="font-semibold text-white">{brand.name}</span> · keyword{" "}
                <span className="text-indigo-300">“{brand.keyword}”</span> · vs{" "}
                {brand.competitors.length ? brand.competitors.map((c) => c.name).join(", ") : "no competitors"}
              </div>
              <div className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openForm(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={deleteBrand}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {brand && (
        <>
          {/* 2. Prompts */}
          <Card className="border-[#1e242c] bg-[#0c1015]">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base text-white">2. Search prompts</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Questions people ask about “{brand.keyword}”, written by OpenAI.
                </CardDescription>
              </div>
              <Button size="sm" onClick={generatePrompts} isLoading={busy === "prompts"}>
                <Sparkles className="h-3.5 w-3.5" /> {brand.prompts.length ? "Regenerate" : "Generate"} prompts
              </Button>
            </CardHeader>
            <CardContent>
              {brand.prompts.length === 0 ? (
                <p className="text-sm text-slate-400">No prompts yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {brand.prompts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 rounded-md bg-[#11161d] px-3 py-2 text-sm text-slate-200">
                      <span>{p.query_text}</span>
                      <button onClick={() => removePrompt(p.id)} className="text-slate-500 hover:text-rose-400" aria-label="Delete prompt">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* 3. Results */}
          <Card className="border-[#1e242c] bg-[#0c1015]">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base text-white">3. Visibility in ChatGPT</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  How often each name appears in ChatGPT’s answers (with web search).
                </CardDescription>
              </div>
              <Button size="sm" onClick={runCheck} isLoading={busy === "run"} disabled={brand.prompts.length === 0}>
                <Play className="h-3.5 w-3.5" /> Run check
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {busy === "run" && <p className="text-sm text-slate-400">Asking ChatGPT… this can take up to a minute.</p>}

              {!summary?.run && busy !== "run" && (
                <p className="text-sm text-slate-400">
                  {brand.prompts.length === 0 ? "Generate prompts first, then run the check." : "No check run yet."}
                </p>
              )}

              {summary?.run && (
                <>
                  <div className="space-y-3">
                    {summary.visibility.map((v) => (
                      <div key={v.name}>
                        <div className="mb-1 flex items-baseline justify-between text-sm">
                          <span className={v.is_brand ? "font-semibold text-white" : "text-slate-300"}>
                            {v.name} {v.is_brand && <span className="text-xs text-indigo-300">(your brand)</span>}
                          </span>
                          <span className="text-slate-300">
                            <span className="font-semibold text-white">{v.percent}%</span> · in {v.answers_with_mention} of{" "}
                            {summary.answered} answers · {v.total_mentions} mentions
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#1e242c]">
                          <div
                            className={`h-full rounded-full ${v.is_brand ? "bg-indigo-500" : "bg-slate-500"}`}
                            style={{ width: `${v.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Answers · {new Date(summary.run.created_at).toLocaleString()}
                    </p>
                    {summary.results.map((r) => (
                      <details key={r.id} className="rounded-md bg-[#11161d] px-3 py-2 text-sm">
                        <summary className="cursor-pointer text-slate-200">
                          {r.prompt_query}
                          {r.error && <span className="ml-2 text-xs text-rose-400">failed</span>}
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-slate-400">{r.error || r.answer}</p>
                      </details>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
