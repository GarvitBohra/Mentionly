import OpenAI from "openai";
import { PromptCategory } from "@/types";

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface VisibilityQueryResult {
  text: string;
  groundingSources: GroundingSource[];
  hasGrounding: boolean;
  model: string;
  isApiObservation: true;
}

export interface GeneratedPromptResult {
  query_text: string;
  category: PromptCategory;
}

const TEXT_MODEL = process.env.OPENAI_MONITOR_MODEL || "gpt-6-luna";
const VALID_CATEGORIES: PromptCategory[] = [
  "Discovery",
  "Recommendation",
  "Comparison",
  "Purchase Intent",
  "Problem Solving",
];

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.trim() && key !== "your_key_here");
}

function getClient(): OpenAI {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to enable live monitoring.");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function formatOpenAIError(error: unknown): string {
  const candidate = error as { status?: number; message?: string };
  const raw = candidate?.message || String(error);
  if (raw.startsWith("OpenAI ")) return raw;
  if (candidate?.status === 429 || /rate.limit|quota|insufficient_quota/i.test(raw)) {
    return "OpenAI rate limit or budget limit reached. Check your OpenAI project budget and try again later.";
  }
  if (candidate?.status === 401 || /incorrect api key|invalid api key|authentication/i.test(raw)) {
    return "Invalid OpenAI API key. Check OPENAI_API_KEY in your server environment.";
  }
  if (candidate?.status === 404 || /model.*not found|does not exist/i.test(raw)) {
    return `OpenAI model \"${TEXT_MODEL}\" is unavailable to this project. Set OPENAI_MONITOR_MODEL to a model your project can access.`;
  }
  return `OpenAI request failed: ${raw}`;
}

function parseJsonArray<T>(text: string, label: string): T[] {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");
    const parsed = JSON.parse(arrayStart >= 0 && arrayEnd > arrayStart ? cleaned.slice(arrayStart, arrayEnd + 1) : cleaned);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as T[];
  } catch {
    // The final error below is intentionally actionable for the UI.
  }
  throw new Error(`OpenAI returned an invalid ${label} response. Please retry.`);
}

export async function generateSearchPrompts(params: {
  brand_name: string;
  website: string;
  industry: string;
  description?: string;
  competitors?: string[];
  count?: number;
}): Promise<GeneratedPromptResult[]> {
  try {
    const count = Math.min(params.count || 6, 6);
    const response = await getClient().responses.create({
      model: TEXT_MODEL,
      max_output_tokens: 250,
      instructions: "Return only valid JSON. Do not use markdown.",
      input: `Generate exactly ${count} buyer-intent search questions for this brand. Use diverse categories: Discovery, Recommendation, Comparison, Purchase Intent, Problem Solving. Return [{"query_text":"...","category":"..."}].\nBrand: ${params.brand_name}\nWebsite: ${params.website}\nIndustry: ${params.industry}\nDescription: ${params.description || "Not provided"}\nCompetitors: ${params.competitors?.join(", ") || "Not provided"}`,
    });
    return parseJsonArray<GeneratedPromptResult>(response.output_text, "prompt-generation")
      .slice(0, count)
      .map((item) => ({
        query_text: String(item.query_text || "").trim(),
        category: VALID_CATEGORIES.includes(item.category) ? item.category : "Discovery",
      }))
      .filter((item) => item.query_text.length > 0);
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }
}

/** Suggests direct market alternatives only when a brand has no configured competitors. */
export async function suggestCompetitors(params: {
  brandName: string;
  industry: string;
  country?: string;
}): Promise<string[]> {
  try {
    const response = await getClient().responses.create({
      model: TEXT_MODEL,
      max_output_tokens: 120,
      instructions: "Return only a JSON array of 2 to 4 direct competitor brand names. Do not include the target brand, explanations, products, or markdown.",
      input: `Target brand: ${params.brandName}\nIndustry: ${params.industry}\nMarket: ${params.country || "Global"}`,
    });
    const parsed = parseJsonArray<unknown>(response.output_text, "competitor suggestion");
    return Array.from(new Set(parsed
      .map((item) => String(item).trim())
      .filter((name) => name.length > 0 && name.toLowerCase() !== params.brandName.toLowerCase())))
      .slice(0, 4);
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }
}

export async function executeVisibilityQuery(
  promptQuery: string,
  context?: { brandName?: string; website?: string; competitors?: string[] }
): Promise<VisibilityQueryResult> {
  try {
    const competitors = context?.competitors?.join(", ") || "none provided";
    const response = await getClient().responses.create({
      model: TEXT_MODEL,
      // Low reasoning prevents a small-budget model from spending the entire response on hidden work.
      reasoning: { effort: "low" },
      max_output_tokens: 500,
      max_tool_calls: 1,
      tools: [{ type: "web_search", search_context_size: "low" }],
      include: ["web_search_call.action.sources"],
      instructions: "Answer concisely and neutrally. Use web search for factual claims. Do not repeat the question. Cite sources used for factual claims.",
      input: `Customer question: ${promptQuery}\nTarget brand: ${context?.brandName || "Unknown"}\nTarget website: ${context?.website || "Unknown"}\nCompetitors to compare: ${competitors}`,
    });

    const outputContent = response.output
      .filter((item) => item.type === "message")
      .flatMap((item) => item.content);
    const text = (response.output_text || outputContent
      .filter((content) => content.type === "output_text")
      .map((content) => content.text)
      .join("\n")).trim();
    if (!text) {
      const reason = response.incomplete_details?.reason;
      throw new Error(reason
        ? `OpenAI did not finish the monitoring response (${reason}). Please run the check again.`
        : "OpenAI returned no visible monitoring response. Please run the check again.");
    }

    const sources = outputContent
      .filter((content) => content.type === "output_text")
      .flatMap((content) =>
        content.annotations
          .filter((annotation) => annotation.type === "url_citation")
          .map((annotation) => ({
            title: annotation.title || new URL(annotation.url).hostname,
            url: annotation.url,
            snippet: content.text.slice(annotation.start_index, annotation.end_index),
          }))
      );
    const groundingSources = Array.from(new Map(sources.map((source) => [source.url, source])).values());

    return {
      text,
      groundingSources,
      hasGrounding: groundingSources.length > 0,
      model: TEXT_MODEL,
      isApiObservation: true,
    };
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }
}

export async function generateGeoRecommendationsWithOpenAI(params: {
  brandName: string;
  website: string;
  industry: string;
  totalPrompts: number;
  brandMentionRate: number;
  competitorMentionRate: number;
  missingPrompts: string[];
  topSources: string[];
}): Promise<Array<{
  title: string;
  category: "Website Content" | "Brand Authority" | "Missing Information" | "Competitor Insights" | "Content Opportunities";
  explanation: string;
  evidence: string;
  suggested_action: string;
  priority: "High" | "Medium" | "Low";
}>> {
  try {
    const response = await getClient().responses.create({
      model: TEXT_MODEL,
      max_output_tokens: 600,
      instructions: "Return only a valid JSON array. Base every recommendation strictly on the supplied monitoring data; do not invent sources or performance claims.",
      input: `Create exactly two concise GEO recommendations. Return objects with title, category, explanation, evidence, suggested_action, priority. Keep every string to one sentence. Categories must be Website Content, Brand Authority, Missing Information, Competitor Insights, or Content Opportunities.\nBrand: ${params.brandName}\nWebsite: ${params.website}\nIndustry: ${params.industry}\nSuccessful prompts: ${params.totalPrompts}\nBrand mention rate: ${params.brandMentionRate}%\nCompetitor mention rate: ${params.competitorMentionRate}%\nMissing prompts: ${params.missingPrompts.slice(0, 5).join("; ") || "none"}\nObserved source domains: ${params.topSources.slice(0, 5).join(", ") || "none"}`,
    });
    return parseJsonArray(response.output_text, "GEO recommendation");
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }
}
