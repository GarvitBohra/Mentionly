import { NextRequest, NextResponse } from "next/server";
import { monitoringRunSchema } from "@/lib/validations";
import { getActiveBrand, listPrompts, listMonitoringRuns } from "@/lib/data-service";
import { memoryStore } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { executeMonitoringRun } from "@/lib/monitoring-engine";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { MonitoringRun } from "@/types";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id");
    if (!brandId) {
      return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    }

    const runs = await listMonitoringRuns(user.id, brandId);
    return NextResponse.json({ runs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const json = await req.json();
    const validated = monitoringRunSchema.parse(json);

    const brand = await getActiveBrand(user.id, validated.brand_id);
    if (!brand) {
      return forbiddenResponse("Brand not found or unauthorized access");
    }

    const allPrompts = await listPrompts(user.id, validated.brand_id);
    const selectedPrompts = allPrompts.filter((p) => validated.prompt_ids.includes(p.id));

    if (selectedPrompts.length === 0) {
      return NextResponse.json({ error: "No matching prompts found" }, { status: 400 });
    }

    const runId = crypto.randomUUID();
    const newRun: MonitoringRun = {
      id: runId,
      brand_id: brand.id,
      status: "pending",
      total_prompts: selectedPrompts.length,
      completed_prompts: 0,
      visibility_score: 0,
      brand_mention_rate: 0,
      competitor_mention_rate: 0,
      recommendation_rate: 0,
      created_at: new Date().toISOString(),
    };

    const supabase = createAdminClient();
    if (supabase) {
      await supabase.from("monitoring_runs").insert(newRun);
    } else {
      memoryStore.saveRun(newRun);
    }

    const competitorNames = (brand.competitors || []).map((c) => c.name);

    // Execute monitoring run
    const completedRun = await executeMonitoringRun({
      runId,
      brandId: brand.id,
      brandName: brand.name,
      website: brand.website,
      competitors: competitorNames,
      prompts: selectedPrompts,
    });

    const isAllFailed = completedRun.status === "failed";

    return NextResponse.json({
      run: completedRun,
      success: !isAllFailed,
      message: isAllFailed
        ? completedRun.error_message || "Monitoring run failed across all prompts"
        : "Monitoring run completed",
    }, { status: isAllFailed ? 502 : 200 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to start monitoring run" },
      { status: 500 }
    );
  }
}
