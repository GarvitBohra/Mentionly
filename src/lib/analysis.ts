import { CompetitorMention, Citation } from "@/types";
import { GroundingSource } from "./gemini";

export interface MentionAnalysisResult {
  brandMentioned: boolean;
  brandRecommended: boolean;
  brandPosition?: number;
  mentionContext?: string;
  competitorsMentioned: CompetitorMention[];
  citations: Citation[];
}

/**
 * Escapes regex special characters.
 */
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * Creates robust regex patterns for a brand/competitor name:
 * - Word boundary matching
 * - Optional punctuation/spacing tolerance (e.g. "Mentionly AI", "Mentionly.ai", "Mentionly")
 */
function createBrandRegex(name: string): RegExp {
  const clean = name.trim();
  // Strip common domain endings for alias matching if provided like 'otterly.ai'
  const domainLess = clean.replace(/\.(ai|com|io|co|org|net)$/i, "");

  const pattern = clean === domainLess
    ? `\\b${escapeRegex(clean)}\\b`
    : `(\\b${escapeRegex(clean)}\\b|\\b${escapeRegex(domainLess)}\\b)`;

  return new RegExp(pattern, "i");
}

/**
 * Extract context sentence or surrounding window around the first match.
 */
function extractContextWindow(text: string, regex: RegExp, windowSize = 140): string | undefined {
  const match = regex.exec(text);
  if (!match) return undefined;

  const matchIdx = match.index;
  const start = Math.max(0, matchIdx - 40);
  const end = Math.min(text.length, matchIdx + match[0].length + windowSize);

  let snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}

/**
 * Evaluates whether a brand is actively recommended vs merely mentioned in passing or critically.
 */
function evaluateRecommendation(text: string, brandName: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerBrand = brandName.toLowerCase();

  if (!lowerText.includes(lowerBrand)) return false;

  const positivePhrases = [
    "recommend",
    "top pick",
    "top choice",
    "best for",
    "leading platform",
    "stands out",
    "highly rated",
    "excellent",
    "popular choice",
    "ideal for",
    "strong alternative",
    "powerful tool",
    "notable mention",
    "well-regarded",
  ];

  // Check if brand appears in a numbered ranking list (e.g., "1. Brand" or "#1 Brand" or "1) Brand")
  const rankingRegex = new RegExp(
    `(?:(?:^|\\n)\\s*(?:1|2|3|4|5|#1|#2|#3|#4|#5)[\\.\\):\\-\\s]+[^\\n]*${escapeRegex(
      brandName
    )})`,
    "im"
  );
  if (rankingRegex.test(text)) {
    return true;
  }

  // Check context surrounding the brand for positive sentiment words
  const brandRegex = createBrandRegex(brandName);
  const context = extractContextWindow(text, brandRegex, 120);
  if (context) {
    const lowerContext = context.toLowerCase();
    for (const phrase of positivePhrases) {
      if (lowerContext.includes(phrase)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates rank position of a brand in bulleted or numbered recommendation lists.
 */
function calculatePosition(text: string, brandName: string): number | undefined {
  const brandRegex = createBrandRegex(brandName);
  const lines = text.split("\n");
  let itemCounter = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Detect numbered list or bullet point
    const isListItem = /^(?:\d+[\.\)]|[-*•])\s+/.test(trimmed);
    if (isListItem) {
      itemCounter++;
      if (brandRegex.test(trimmed)) {
        return itemCounter;
      }
    }
  }

  // If not in a bulleted list, determine position based on first character index relative to competitors
  return undefined;
}

/**
 * Core analysis engine to parse AI responses.
 */
export function analyzeMentionResponse(params: {
  rawResponse: string;
  brandName: string;
  brandId: string;
  promptQuery: string;
  competitors: string[];
  groundingSources: GroundingSource[];
}): MentionAnalysisResult {
  const { rawResponse, brandName, brandId, promptQuery, competitors, groundingSources } = params;

  // 1. Analyze target brand
  const brandRegex = createBrandRegex(brandName);
  const brandMentioned = brandRegex.test(rawResponse);
  const brandRecommended = brandMentioned && evaluateRecommendation(rawResponse, brandName);
  const brandPosition = brandMentioned ? calculatePosition(rawResponse, brandName) : undefined;
  const mentionContext = brandMentioned ? extractContextWindow(rawResponse, brandRegex) : undefined;

  // 2. Analyze competitors
  const competitorsMentioned: CompetitorMention[] = competitors.map((compName) => {
    const compRegex = createBrandRegex(compName);
    const mentioned = compRegex.test(rawResponse);
    const position = mentioned ? calculatePosition(rawResponse, compName) : undefined;
    return {
      name: compName,
      mentioned,
      position,
    };
  });

  // 3. Process citations & link with brand mentions
  const citations: Citation[] = groundingSources.map((source, idx) => {
    let domain = "";
    try {
      domain = new URL(source.url).hostname.replace(/^www\./, "");
    } catch {
      domain = source.url;
    }

    const brandInTitleOrSnippet =
      brandRegex.test(source.title || "") || brandRegex.test(source.snippet || "");

    return {
      id: `cit_${Date.now()}_${idx}`,
      brand_id: brandId,
      title: source.title,
      url: source.url,
      domain,
      snippet: source.snippet,
      associated_prompt: promptQuery,
      mentions_brand: brandInTitleOrSnippet || brandMentioned,
      created_at: new Date().toISOString(),
    };
  });

  return {
    brandMentioned,
    brandRecommended,
    brandPosition,
    mentionContext,
    competitorsMentioned,
    citations,
  };
}

