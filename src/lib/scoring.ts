import { MonitoringResult } from "@/types";

export interface CalculatedScores {
  visibilityScore: number;
  brandMentionRate: number;
  recommendationRate: number;
  competitorMentionRate: number;
  averagePosition?: number;
  totalSuccessfulPrompts: number;
  sourceCount: number;
  distinctDomainsCount: number;
}

/**
 * Mentionly AI Visibility Score (0 - 100)
 *
 * Scoring Methodology:
 * - Brand Mention Rate (40% weight): Measures basic presence across AI-generated answers.
 * - Recommendation Rate (35% weight): Measures whether the brand is actively recommended or presented as a top choice.
 * - Position Quality (15% weight): Brands appearing early in lists (#1 to #3) receive bonus scoring.
 * - Source Grounding Presence (10% weight): Proportion of answers backed by verified grounding search sources.
 *
 * NOTE: This is Mentionly's proprietary visibility index for benchmarking comparative progress across runs.
 * It is not an industry-standard metric or Google official rating.
 * Failed queries are strictly excluded from calculations to avoid artificially skewing negative rates.
 */
export function calculateVisibilityMetrics(
  results: MonitoringResult[],
  totalCitationsCount = 0
): CalculatedScores {
  // Exclude failed or errored prompts
  const successfulResults = results.filter((r) => !r.error && r.raw_response?.trim().length > 0);

  if (successfulResults.length === 0) {
    return {
      visibilityScore: 0,
      brandMentionRate: 0,
      recommendationRate: 0,
      competitorMentionRate: 0,
      totalSuccessfulPrompts: 0,
      sourceCount: 0,
      distinctDomainsCount: 0,
    };
  }

  const totalSuccessful = successfulResults.length;

  // 1. Brand Mention Rate
  const brandMentions = successfulResults.filter((r) => r.brand_mentioned).length;
  const brandMentionRate = Number(((brandMentions / totalSuccessful) * 100).toFixed(1));

  // 2. Recommendation Rate
  const recommendations = successfulResults.filter((r) => r.brand_recommended).length;
  const recommendationRate = Number(((recommendations / totalSuccessful) * 100).toFixed(1));

  // 3. Competitor Mention Rate (prompts where at least one competitor was mentioned)
  const competitorMentions = successfulResults.filter((r) =>
    r.competitors_mentioned?.some((c) => c.mentioned)
  ).length;
  const competitorMentionRate = Number(((competitorMentions / totalSuccessful) * 100).toFixed(1));

  // 4. Average Brand Position where measured
  const measuredPositions = successfulResults
    .map((r) => r.brand_position)
    .filter((pos): pos is number => typeof pos === "number" && pos > 0);

  const averagePosition =
    measuredPositions.length > 0
      ? Number(
          (measuredPositions.reduce((sum, p) => sum + p, 0) / measuredPositions.length).toFixed(1)
        )
      : undefined;

  // 5. Position Quality Factor (0 to 100)
  // If rank is 1 -> 100, rank 2 -> 80, rank 3 -> 60, rank 4 -> 40, 5+ -> 20. If not ranked, neutral 50 if mentioned, 0 if not
  let positionScore = 0;
  if (averagePosition !== undefined) {
    positionScore = Math.max(10, 100 - (averagePosition - 1) * 20);
  } else if (brandMentionRate > 0) {
    positionScore = 50;
  }

  // 6. Grounding Presence Rate (0 to 100)
  const groundedCount = successfulResults.filter((r) => r.has_grounding).length;
  const groundingRate = (groundedCount / totalSuccessful) * 100;

  // Weighted composite score (0 - 100)
  const rawComposite =
    brandMentionRate * 0.4 +
    recommendationRate * 0.35 +
    positionScore * 0.15 +
    groundingRate * 0.1;

  const visibilityScore = Math.min(100, Math.max(0, Number(rawComposite.toFixed(1))));

  return {
    visibilityScore,
    brandMentionRate,
    recommendationRate,
    competitorMentionRate,
    averagePosition,
    totalSuccessfulPrompts: totalSuccessful,
    sourceCount: totalCitationsCount,
    distinctDomainsCount: 0,
  };
}

