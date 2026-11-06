import { NextRequest, NextResponse } from "next/server";
import { getActiveBrand, updateBrand, deleteBrand } from "@/lib/data-service";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  website: z.string().url().optional(),
  industry: z.string().min(2).max(100).optional(),
  country: z.string().min(2).optional(),
  language: z.string().min(2).optional(),
  description: z.string().max(1000).optional(),
  competitors: z.array(z.string().min(1)).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = await getActiveBrand(id);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json({ brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const validated = updateBrandSchema.parse(json);

    const updated = await updateBrand(id, validated);
    if (!updated) {
      return NextResponse.json({ error: "Brand not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ brand: updated });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteBrand(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
