"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Globe,
  Trash2,
  CheckCircle2,
  Users2,
  Search,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brand } from "@/types";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("United States");
  const [language, setLanguage] = useState("English");
  const [description, setDescription] = useState("");
  const [competitorsInput, setCompetitorsInput] = useState("");

  const loadBrands = () => {
    setLoading(true);
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => {
        setBrands(data.brands || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch brands:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const competitors = competitorsInput
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (competitors.length === 0) {
      setErrorMsg("Please enter at least one competitor name.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          website,
          industry,
          country,
          language,
          description,
          competitors,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create brand");
      }

      // Reset form
      setName("");
      setWebsite("");
      setIndustry("");
      setDescription("");
      setCompetitorsInput("");
      setShowAddForm(false);
      loadBrands();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this brand and its associated prompts?")) return;
    try {
      await fetch(`/api/brands/${id}`, { method: "DELETE" });
      loadBrands();
    } catch (err) {
      console.error("Failed to delete brand:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Brand Management</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your monitored business entities, target markets, and primary competitors.
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant="primary"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? "Cancel" : "Add Brand"}</span>
        </Button>
      </div>

      {/* Onboarding / Add Brand Form */}
      {showAddForm && (
        <Card className="border-indigo-500/30 bg-[#0e1218] shadow-lg shadow-indigo-950/20">
          <CardHeader>
            <CardTitle className="text-base text-white">Add New Brand</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Mentionly will execute search grounding checks to discover how AI assistants present
              this brand.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBrand} className="space-y-4">
              {errorMsg && (
                <div className="rounded-lg border border-rose-900/50 bg-rose-950/30 p-3 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Brand Name *</label>
                  <Input
                    required
                    placeholder="e.g. Acme Corp"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Website URL *</label>
                  <Input
                    required
                    type="url"
                    placeholder="https://acme.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Industry / Sector *</label>
                  <Input
                    required
                    placeholder="e.g. B2B SaaS, CRM, FinTech, CyberSecurity"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Target Country</label>
                  <Input
                    placeholder="United States, India, Global"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Key Competitors (comma separated) *
                </label>
                <Input
                  required
                  placeholder="Competitor A, Competitor B, Competitor C"
                  value={competitorsInput}
                  onChange={(e) => setCompetitorsInput(e.target.value)}
                />
                <p className="text-[11px] text-slate-400">
                  Mentionly will automatically measure whether these competitors are cited over your
                  brand.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Description (Optional)</label>
                <Textarea
                  placeholder="Briefly describe what your brand offers, key differentiators, and target customer profile..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                  Save Brand
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Brand list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {brands.map((brand) => (
          <Card key={brand.id} className="border-[#1e242c] bg-[#0c1015]">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white text-base">{brand.name}</h3>
                    {brand.is_default && (
                      <Badge variant="default" className="text-[10px]">
                        Primary
                      </Badge>
                    )}
                  </div>
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:underline mt-0.5"
                  >
                    <Globe className="h-3 w-3" />
                    <span>{brand.website}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-rose-400"
                  onClick={() => handleDeleteBrand(brand.id)}
                  title="Delete brand"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="rounded-lg bg-[#12161f] p-2 border border-[#1b212b]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">
                    Industry
                  </span>
                  <span className="font-medium truncate block">{brand.industry}</span>
                </div>
                <div className="rounded-lg bg-[#12161f] p-2 border border-[#1b212b]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">
                    Region
                  </span>
                  <span className="font-medium truncate block">
                    {brand.country} ({brand.language})
                  </span>
                </div>
              </div>

              {brand.description && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {brand.description}
                </p>
              )}

              {/* Competitors List */}
              <div className="pt-2 border-t border-[#1e242c]">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                  <Users2 className="h-3.5 w-3.5 text-slate-400" />
                  <span>Monitored Competitors ({brand.competitors?.length || 0})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(brand.competitors || []).map((comp) => (
                    <span
                      key={comp.id}
                      className="rounded-md bg-[#161c26] border border-[#232c3a] px-2 py-0.5 text-[11px] text-slate-300 font-mono"
                    >
                      {comp.name}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

