"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Filter,
  Check,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Prompt, PromptCategory, Brand } from "@/types";

const CATEGORIES: PromptCategory[] = [
  "Discovery",
  "Recommendation",
  "Comparison",
  "Purchase Intent",
  "Problem Solving",
];

export default function PromptsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Manual Add Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState<PromptCategory>("Discovery");
  const [submitting, setSubmitting] = useState(false);

  // Edit Prompt State
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [editQueryText, setEditQueryText] = useState("");
  const [editCategory, setEditCategory] = useState<PromptCategory>("Discovery");

  // Gemini AI Prompt Generator
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedList, setGeneratedList] = useState<
    Array<{ query_text: string; category: PromptCategory }>
  >([]);

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

  const loadPrompts = (brandId: string) => {
    setLoading(true);
    fetch(`/api/prompts?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => {
        setPrompts(data.prompts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load prompts:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedBrandId) {
      loadPrompts(selectedBrandId);
    }
  }, [selectedBrandId]);

  const handleCreatePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim() || !selectedBrandId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: selectedBrandId,
          query_text: queryText,
          category,
        }),
      });

      if (res.ok) {
        setQueryText("");
        setShowAddForm(false);
        loadPrompts(selectedBrandId);
      }
    } catch (err) {
      console.error("Error creating prompt:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditQueryText(prompt.query_text);
    setEditCategory(prompt.category);
  };

  const handleSaveEditPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPrompt.id,
          query_text: editQueryText,
          category: editCategory,
        }),
      });

      if (res.ok) {
        setEditingPrompt(null);
        loadPrompts(selectedBrandId);
      }
    } catch (err) {
      console.error("Error updating prompt:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePromptsWithGemini = async () => {
    const brand = brands.find((b) => b.id === selectedBrandId);
    if (!brand) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/prompts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: brand.name,
          website: brand.website,
          industry: brand.industry,
          description: brand.description || "",
          competitors: (brand.competitors || []).map((c) => c.name),
          count: 6,
        }),
      });

      const data = await res.json();
      if (data.prompts) {
        setGeneratedList(data.prompts);
      }
    } catch (err) {
      console.error("Prompt generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddGeneratedPrompt = async (item: {
    query_text: string;
    category: PromptCategory;
  }) => {
    try {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: selectedBrandId,
          query_text: item.query_text,
          category: item.category,
        }),
      });
      // Remove from generated list and refresh
      setGeneratedList((prev) => prev.filter((p) => p.query_text !== item.query_text));
      loadPrompts(selectedBrandId);
    } catch (err) {
      console.error("Failed to add generated prompt:", err);
    }
  };

  const handleToggleActive = async (prompt: Prompt) => {
    try {
      await fetch("/api/prompts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: prompt.id,
          is_active: !prompt.is_active,
        }),
      });
      setPrompts((prev) =>
        prev.map((p) => (p.id === prompt.id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err) {
      console.error("Failed to toggle prompt:", err);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await fetch(`/api/prompts?id=${id}`, { method: "DELETE" });
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete prompt:", err);
    }
  };

  const filteredPrompts =
    selectedCategory === "All"
      ? prompts
      : prompts.filter((p) => p.category === selectedCategory);

  const currentBrand = brands.find((b) => b.id === selectedBrandId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Prompt Explorer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage customer-intent search queries used to benchmark AI visibility for{" "}
            {currentBrand?.name || "your brand"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleGeneratePromptsWithGemini}
            isLoading={isGenerating}
            variant="secondary"
            size="sm"
            className="gap-1.5 text-xs border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/40"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Generate with Gemini</span>
          </Button>

          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant="primary"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showAddForm ? "Cancel" : "Add Prompt"}</span>
          </Button>
        </div>
      </div>

      {/* Gemini AI Generated Prompts Suggestions Drawer */}
      {generatedList.length > 0 && (
        <Card className="border-indigo-500/40 bg-[#0e131d] shadow-lg shadow-indigo-950/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <CardTitle className="text-sm text-indigo-200">
                  Gemini-Generated Customer Search Intents ({generatedList.length})
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-400 h-7"
                onClick={() => setGeneratedList([])}
              >
                Dismiss All
              </Button>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Click &quot;Add to Monitor&quot; to save and benchmark any of these intents in your next visibility run.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {generatedList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-[#232c3a] bg-[#131822] p-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate max-w-[75%]">
                  <Badge variant="secondary" className="text-[10px]">
                    {item.category}
                  </Badge>
                  <span className="text-slate-200 truncate">{item.query_text}</span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="h-7 text-xs gap-1"
                  onClick={() => handleAddGeneratedPrompt(item)}
                >
                  <Plus className="h-3 w-3" />
                  <span>Add to Monitor</span>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit Prompt Form */}
      {editingPrompt && (
        <Card className="border-indigo-500/40 bg-[#0e131d] shadow-lg shadow-indigo-950/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">Edit Search Prompt</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-white"
                onClick={() => setEditingPrompt(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Modify the customer search query text or category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveEditPrompt} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Customer Search Query *</label>
                <Input
                  required
                  value={editQueryText}
                  onChange={(e) => setEditQueryText(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as PromptCategory)}
                  className="w-full rounded-lg border border-[#2d333b] bg-[#0d1117] px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingPrompt(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Manual Add Form */}
      {showAddForm && (
        <Card className="border-[#1e242c] bg-[#0c1015]">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-white">Add Custom Prompt</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Input a specific customer question or comparison query to monitor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePrompt} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Customer Search Query *</label>
                <Input
                  required
                  placeholder="e.g. Which companies provide the best AI search monitoring software?"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PromptCategory)}
                  className="w-full rounded-lg border border-[#2d333b] bg-[#0d1117] px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                  Save Prompt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selectedCategory === "All"
              ? "bg-indigo-600 text-white"
              : "bg-[#141922] text-slate-400 hover:text-slate-200 border border-[#222a36]"
          }`}
        >
          All ({prompts.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = prompts.filter((p) => p.category === cat).length;
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

      {/* Prompts Table / List */}
      <Card className="border-[#1e242c] bg-[#0c1015]">
        <CardContent className="p-0">
          <div className="divide-y divide-[#1e242c]">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="flex items-center justify-between p-3.5 text-xs hover:bg-[#121620] transition-colors"
              >
                <div className="flex items-center gap-3 truncate max-w-[70%]">
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {prompt.category}
                  </Badge>
                  <span
                    className={`font-medium truncate ${
                      prompt.is_active ? "text-slate-200" : "text-slate-500 line-through"
                    }`}
                  >
                    {prompt.query_text}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleActive(prompt)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                    title={prompt.is_active ? "Deactivate prompt" : "Activate prompt"}
                  >
                    {prompt.is_active ? (
                      <span className="text-emerald-400 font-mono text-[11px]">Active</span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">Inactive</span>
                    )}
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-indigo-300"
                    onClick={() => handleStartEditPrompt(prompt)}
                    title="Edit prompt"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-rose-400"
                    onClick={() => handleDeletePrompt(prompt.id)}
                    title="Delete prompt"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredPrompts.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No prompts found in this category. Generate prompts with Gemini or add one manually!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

