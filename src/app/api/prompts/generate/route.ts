import { NextRequest, NextResponse } from "next/server";
import { getBrand, replacePrompts } from "@/lib/data-service";
import { generatePrompts } from "@/lib/ai";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export const maxDuration = 60;

/** Generates search prompts from the brand's keyword and saves them. */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { brand_id } = await req.json();
    const brand = brand_id ? await getBrand(user.id, brand_id) : null;
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    await replacePrompts(brand.id, await generatePrompts(brand.keyword));
    return NextResponse.json({ brand: await getBrand(user.id, brand.id) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate prompts" }, { status: 500 });
  }
}
