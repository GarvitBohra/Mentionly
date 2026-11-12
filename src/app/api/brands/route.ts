import { NextRequest, NextResponse } from "next/server";
import { listBrands, createBrand } from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";
import { parseBrandInput } from "@/lib/brand-input";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();
    return NextResponse.json({ brands: await listBrands(user.id) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const input = parseBrandInput(await req.json());
    if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

    return NextResponse.json({ brand: await createBrand(user.id, input) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create brand" }, { status: 500 });
  }
}
