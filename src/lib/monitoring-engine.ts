import { executeVisibilityQuery } from "./gemini";
import { analyzeMentionResponse } from "./analysis";
import { calculateVisibilityMetrics } from "./scoring";
import { memoryStore } from "./store";
import { createAdminClient } from "./supabase/admin";
import { MonitoringRun, MonitoringResult, Citation } from "@/types";

export interface StartMonitoringParams {
  brandId: string;
  brandName: string;
  website: string;
  competitors: string[];
  prompts: Array<{ id: string; query_text: string; category: any }>;
}

export async function executeMonitoringRun(params: {
  runId: string;
  brandId: string;
  brandName: string;
  website: string;
  competitors: string[];
  prompts: Array<{ id: string; query_text: string; category: any }>;
}): Promise<MonitoringRun> {
  const { runId, brandId, brandName, website, competitors, prompts } = params;
  const supabase = createAdminClient();

  const collectedResults: MonitoringResult[] = [];
  const collectedCitations: Citation[] = [];

  // Update run to 'running'
  if (supabase) {
    await supabase
      .from("monitoring_runs")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", runId);
  } else {
    const r = memoryStore.getRun(runId);
    if (r) {
      r.status = "running";
      r.started_at = new Date().toISOString();
    }
  }

  // Cap at max 10 prompts per run for MVP safety to prevent quota burn
  const cappedPrompts = prompts.slice(0, 10);

  for (let i = 0; i < cappedPrompts.length; i++) {
    const promptItem = cappedPrompts[i];
    try {
      // 1. Execute against Gemini with Search Grounding
      const queryResult = await executeVisibilityQuery(promptItem.query_text, {
        brandName,
        website,
      });

      // 2. Perform Mention & Grounding Analysis
      const analysis = analyzeMentionResponse({
        rawResponse: queryResult.text,
        brandName,
        brandId,
        promptQuery: promptItem.query_text,
        competitors,
        groundingSources: queryResult.groundingSources,
      });

      const resultRecord: MonitoringResult = {
        id: crypto.randomUUID(),
        run_id: runId,
        prompt_id: promptItem.id,
        prompt_query: promptItem.query_text,
        prompt_category: promptItem.category,
        raw_response: queryResult.text,
        brand_mentioned: analysis.brandMentioned,
        brand_recommended: analysis.brandRecommended,
        brand_position: analysis.brandPosition,
        mention_context: analysis.mentionContext,
        competitors_mentioned: analysis.competitorsMentioned,
        has_grounding: queryResult.hasGrounding,
        created_at: new Date().toISOString(),
      };

      collectedResults.push(resultRecord);
      collectedCitations.push(...analysis.citations);

      if (supabase) {
        await supabase.from("monitoring_results").insert(resultRecord);
        if (analysis.citations.length > 0) {
          await supabase.from("citations").insert(
            analysis.citations.map((c) => ({
              id: c.id,
              monitoring_result_id: resultRecord.id,
              brand_id: brandId,
              title: c.title,
              url: c.url,
              domain: c.domain,
              snippet: c.snippet,
              associated_prompt: c.associated_prompt,
              mentions_brand: c.mentions_brand,
            }))
          );
        }
        await supabase
          .from("monitoring_runs")
          .update({ completed_prompts: i + 1 })
          .eq("id", runId);
      } else {
        memoryStore.saveResult(resultRecord);
        analysis.citations.forEach((c) => memoryStore.saveCitation(c));
        const r = memoryStore.getRun(runId);
        if (r) r.completed_prompts = i + 1;
      }
    } catch (err: any) {
      console.error(`Error processing prompt "${promptItem.query_text}":`, err);
      const failedResult: MonitoringResult = {
        id: crypto.randomUUID(),
        run_id: runId,
        prompt_id: promptItem.id,
        prompt_query: promptItem.query_text,
        prompt_category: promptItem.category,
        raw_response: "",
        brand_mentioned: false,
        brand_recommended: false,
        competitors_mentioned: [],
        has_grounding: false,
        error: err?.message || "Execution failed",
        created_at: new Date().toISOString(),
      };
      collectedResults.push(failedResult);
      if (!supabase) {
        memoryStore.saveResult(failedResult);
      }
    }
  }

  // 3. Compute visibility metrics
  const metrics = calculateVisibilityMetrics(collectedResults, collectedCitations.length);

  const finalRunData: MonitoringRun = {
    id: runId,
    brand_id: brandId,
    status: "completed",
    total_prompts: cappedPrompts.length,
    completed_prompts: cappedPrompts.length,
    visibility_score: metrics.visibilityScore,
    brand_mention_rate: metrics.brandMentionRate,
    competitor_mention_rate: metrics.competitorMentionRate,
    recommendation_rate: metrics.recommendationRate,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  if (supabase) {
    await supabase
      .from("monitoring_runs")
      .update({
        status: "completed",
        visibility_score: metrics.visibilityScore,
        brand_mention_rate: metrics.brandMentionRate,
        competitor_mention_rate: metrics.competitorMentionRate,
        recommendation_rate: metrics.recommendationRate,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
  } else {
    memoryStore.saveRun(finalRunData);
  }

  return finalRunData;
}

