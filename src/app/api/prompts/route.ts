import { NextRequest, NextResponse } from "next/server";
import { promptCreateSchema } from "@/lib/validations";
import { listPrompts, createPrompt, updatePrompt, deletePrompt } from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id");
    if (!brandId) {
      return NextResponse.json({ error: "brand_id is required" }, { status: 400 });
    }

    const prompts = await listPrompts(user.id, brandId);
    return NextResponse.json({ prompts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const json = await req.json();
    const validated = promptCreateSchema.parse(json);

    const prompt = await createPrompt(user.id, {
      brand_id: validated.brand_id,
      query_text: validated.query_text,
      category: validated.category,
    });

    return NextResponse.json({ prompt }, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    if (error.message?.includes("Unauthorized")) {
      return forbiddenResponse(error.message);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

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

    if (!updated) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json({ prompt: updated });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return forbiddenResponse(error.message);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }

    await deletePrompt(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return forbiddenResponse(error.message);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
