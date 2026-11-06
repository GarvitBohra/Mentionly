import { NextResponse } from "next/server";
import { checkSupabaseHealth } from "@/lib/data-service";

export async function GET() {
  const supabaseHealth = await checkSupabaseHealth();
  const hasGeminiKey = !!(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your-gemini-api-key"));

  return NextResponse.json({
    supabase: supabaseHealth,
    gemini: {
      isConfigured: hasGeminiKey,
      activeModels: ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"],
    },
    version: "0.1.0",
    environment: process.env.NODE_ENV || "development",
  });
}

