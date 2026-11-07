import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { seedDemoWorkspace } from "@/lib/demo-workspace";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(req);
    const brand = seedDemoWorkspace(`org-${user.id}`);
    return NextResponse.json({ brand, is_demo: true });
  } catch {
    return NextResponse.json({ error: "Unable to prepare the demo workspace" }, { status: 500 });
  }
}
