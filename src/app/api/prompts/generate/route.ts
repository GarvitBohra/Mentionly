import { NextRequest, NextResponse } from "next/server";
import { promptGenerationSchema } from "@/lib/validations";
import { generateSearchPrompts } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
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
      model: "gemini-2.5-flash",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to generate prompts" },
      { status: 500 }
    );
  }
}

