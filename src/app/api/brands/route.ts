import { NextRequest, NextResponse } from "next/server";
import { brandSchema } from "@/lib/validations";
import { listBrands, createBrand } from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const brands = await listBrands(user.id);
    return NextResponse.json({ brands });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch brands" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const json = await req.json();
    const validated = brandSchema.parse(json);

    const brand = await createBrand(user.id, user.email, {
      name: validated.name,
      website: validated.website,
      industry: validated.industry,
      country: validated.country,
      language: validated.language,
      description: validated.description,
      competitors: validated.competitors,
    });

    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create brand" }, { status: 500 });
  }
}
