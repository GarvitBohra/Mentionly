import { NextRequest, NextResponse } from "next/server";
import { getBrand, getLatestRun } from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const brandId = new URL(req.url).searchParams.get("brand_id");
    const brand = brandId ? await getBrand(user.id, brandId) : null;
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

    return NextResponse.json(await getLatestRun(brand));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
