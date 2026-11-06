import { NextRequest, NextResponse } from "next/server";
import { listPrompts, createPrompt, updatePrompt, deletePrompt } from "@/lib/data-service";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id") || "default";

    const prompts = await listPrompts(user.id, brandId);
    return NextResponse.json({ prompts });
  } catch (error: any) {
    return NextResponse.json({ prompts: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const json = await req.json();

    const query_text = json.query_text || "";
    const brand_id = json.brand_id || "default_brand";
    const category = json.category || "Discovery";

    if (!query_text.trim()) {
      return NextResponse.json({ error: "Prompt query is required" }, { status: 400 });
    }

    const prompt = await createPrompt(user.id, {
      brand_id,
      query_text,
      category,
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create prompt:", error);
    return NextResponse.json({ error: error.message || "Failed to create prompt" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const json = await req.json();
    const { id, is_active, query_text, category } = json;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updated = await updatePrompt(user.id, id, {
      is_active,
      query_text,
      category,
    });

    return NextResponse.json({ prompt: updated || { id, is_active, query_text, category } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      await deletePrompt(user.id, id);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
