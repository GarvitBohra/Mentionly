import { NextRequest, NextResponse } from "next/server";
import { getActiveBrand, listRecommendations } from "@/lib/data-service";
import { memoryStore } from "@/lib/store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id") || undefined;

    const brand = await getActiveBrand(brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const recommendations = await listRecommendations(brand.id);
    return NextResponse.json({ recommendations, brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const json = await req.json();
    const { id, status } = json;

    if (!id || !["open", "in_progress", "applied", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Valid id and status required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (supabase) {
      await supabase
        .from("geo_recommendations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
    } else {
      memoryStore.updateRecommendationStatus(id, status);
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

