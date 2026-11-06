import { executeVisibilityQuery, formatGeminiError } from "./gemini";
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
  const runInStore = memoryStore.getRun(runId);
  if (runInStore) {
    runInStore.status = "running";
    runInStore.started_at = new Date().toISOString();
  }
  if (supabase) {
    try {
      await supabase
        .from("monitoring_runs")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", runId);
    } catch (e) {
      console.warn("Supabase run start update notice:", e);
    }
  }

  // Cap at max 10 prompts per run for safety to prevent quota burn
  const cappedPrompts = prompts.slice(0, 10);
  let successfulPromptsCount = 0;
  let failedPromptsCount = 0;
  let lastFailureReason = "";

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
      successfulPromptsCount++;

      // Always persist to memoryStore
      memoryStore.saveResult(resultRecord);
      analysis.citations.forEach((c) => memoryStore.saveCitation(c));
      const r = memoryStore.getRun(runId);
      if (r) r.completed_prompts = successfulPromptsCount;

      if (supabase) {
        try {
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
            .update({ completed_prompts: successfulPromptsCount })
            .eq("id", runId);
        } catch (dbErr) {
          console.warn("Supabase result persist warning:", dbErr);
        }
      }
    } catch (err: any) {
      failedPromptsCount++;
      const formattedErr = formatGeminiError(err);
      lastFailureReason = formattedErr;
      console.error(`Error processing prompt "${promptItem.query_text}":`, formattedErr);

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
        error: formattedErr,
        created_at: new Date().toISOString(),
      };

      collectedResults.push(failedResult);

      memoryStore.saveResult(failedResult);
      if (supabase) {
        try {
          await supabase.from("monitoring_results").insert(failedResult);
        } catch (dbErr) {
          console.warn("Could not insert failed result into Supabase:", dbErr);
        }
      }
    }
  }

  // 3. Compute visibility metrics strictly from successful results
  const metrics = calculateVisibilityMetrics(collectedResults, collectedCitations.length);

  // 4. Determine final run status and honest error reporting
  let finalStatus: MonitoringRun["status"] = "completed";
  let finalErrorMessage: string | undefined = undefined;

  if (successfulPromptsCount === 0) {
    // Every prompt failed
    finalStatus = "failed";
    finalErrorMessage = `All ${cappedPrompts.length} prompts failed to execute. Reason: ${lastFailureReason}`;
  } else if (failedPromptsCount > 0) {
    // Partial success
    finalStatus = "completed";
    finalErrorMessage = `${failedPromptsCount} of ${cappedPrompts.length} prompts failed (${lastFailureReason}). Visibility calculated from ${successfulPromptsCount} successful response(s).`;
  }

  const finalRunData: MonitoringRun = {
    id: runId,
    brand_id: brandId,
    status: finalStatus,
    total_prompts: cappedPrompts.length,
    completed_prompts: successfulPromptsCount,
    visibility_score: successfulPromptsCount > 0 ? metrics.visibilityScore : 0,
    brand_mention_rate: successfulPromptsCount > 0 ? metrics.brandMentionRate : 0,
    competitor_mention_rate: successfulPromptsCount > 0 ? metrics.competitorMentionRate : 0,
    recommendation_rate: successfulPromptsCount > 0 ? metrics.recommendationRate : 0,
    error_message: finalErrorMessage,
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  // Always save final run data to memoryStore
  memoryStore.saveRun(finalRunData);

  if (supabase) {
    try {
      await supabase
        .from("monitoring_runs")
        .update({
          status: finalStatus,
          completed_prompts: successfulPromptsCount,
          visibility_score: finalRunData.visibility_score,
          brand_mention_rate: finalRunData.brand_mention_rate,
          competitor_mention_rate: finalRunData.competitor_mention_rate,
          recommendation_rate: finalRunData.recommendation_rate,
          error_message: finalErrorMessage || null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);
    } catch (err) {
      console.warn("Supabase update monitoring_runs notice:", err);
    }
  }

  return finalRunData;
}
