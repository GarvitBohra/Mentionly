import { NextRequest, NextResponse } from "next/server";
import { getActiveBrand, updateBrand, deleteBrand, verifyBrandOwnership } from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  website: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      const trimmed = v.trim();
      return trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    }),
  industry: z.string().optional(),
  country: z.string().optional(),
  language: z.string().optional(),
  description: z.string().max(1000).optional(),
  competitors: z
    .array(z.string())
    .optional()
    .transform((arr) => arr?.map((c) => c.trim()).filter((c) => c.length > 0)),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { id } = await params;
    const brand = await getActiveBrand(user.id, id);
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
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { id } = await params;
    const json = await req.json();
    const validated = updateBrandSchema.parse(json);

    if (!(await verifyBrandOwnership(user.id, id))) {
      return forbiddenResponse("You do not have access to this brand");
    }

    const updated = await updateBrand(user.id, id, validated);
    if (!updated) {
      return NextResponse.json({ error: "Brand not found or update failed" }, { status: 404 });
    }

    return NextResponse.json({ brand: updated });
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { id } = await params;
    if (!(await verifyBrandOwnership(user.id, id))) {
      return forbiddenResponse("You do not have access to this brand");
    }
    await deleteBrand(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return forbiddenResponse(error.message);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
