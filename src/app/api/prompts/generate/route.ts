import { NextRequest, NextResponse } from "next/server";
import { promptGenerationSchema } from "@/lib/validations";
import { generateSearchPrompts } from "@/lib/openai";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const json = await req.json();
    const validated = promptGenerationSchema.parse(json);

    const generated = await generateSearchPrompts({
      brand_name: validated.brand_name,
      website: validated.website,
      industry: validated.industry,
      description: validated.description,
      competitors: validated.competitors,
      count: validated.count,
    });

    return NextResponse.json({
      prompts: generated,
      count: generated.length,
      mode: "live",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    const status = error.message?.includes("GEMINI_API_KEY") || error.message?.includes("quota") ? 400 : 500;
    return NextResponse.json(
      { error: error.message || "Failed to generate prompts" },
      { status }
    );
  }
}
