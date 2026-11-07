import { NextResponse } from "next/server";
import { checkSupabaseHealth } from "@/lib/data-service";
import { isOpenAIConfigured } from "@/lib/openai";

export async function GET() {
  const supabaseHealth = await checkSupabaseHealth();
  const hasOpenAIKey = isOpenAIConfigured();

  return NextResponse.json({
    supabase: supabaseHealth,
    openai: {
      isConfigured: hasOpenAIKey,
      activeModels: [process.env.OPENAI_MONITOR_MODEL || "gpt-6-luna"],
    },
    version: "0.1.0",
    environment: process.env.NODE_ENV || "development",
  });
}

