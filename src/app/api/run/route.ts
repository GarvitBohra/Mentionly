import { NextRequest, NextResponse } from "next/server";
import { getBrand, createRun, saveResult, getLatestRun } from "@/lib/data-service";
import { askAI } from "@/lib/ai";
import { countMentions } from "@/lib/analysis";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const maxDuration = 60;

const MAX_PROMPTS = 10; // keeps OpenAI cost and request time bounded

/** Asks the AI every prompt of the brand and counts brand and competitor mentions. */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { brand_id } = await req.json();
    const brand = brand_id ? await getBrand(user.id, brand_id) : null;
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    const prompts = brand.prompts.slice(0, MAX_PROMPTS);
    if (prompts.length === 0) {
      return NextResponse.json({ error: "Generate prompts first." }, { status: 400 });
    }

    const runId = await createRun(brand.id);

    // Ask in parallel so the whole run fits in one request.
    await Promise.all(
      prompts.map(async (prompt) => {
        try {
          const answer = await askAI(prompt.query_text);
          await saveResult({
            run_id: runId,
            prompt_query: prompt.query_text,
            answer,
            brand_count: countMentions(answer, brand.name),
            competitor_counts: Object.fromEntries(brand.competitors.map((c) => [c.name, countMentions(answer, c.name)])),
            error: null,
          });
        } catch (err) {
          await saveResult({
            run_id: runId,
            prompt_query: prompt.query_text,
            answer: null,
            brand_count: 0,
            competitor_counts: {},
            error: err instanceof Error ? err.message : String(err), // askAI errors are already readable
          });
        }
      })
    );

    const summary = await getLatestRun(brand, runId);
    if (summary.answered === 0) {
      const reason = summary.results[0]?.error || "No answers were returned.";
      return NextResponse.json({ error: `All prompts failed. ${reason}` }, { status: 502 });
    }
    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Run failed" }, { status: 500 });
  }
}
