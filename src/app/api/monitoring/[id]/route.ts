import { NextRequest, NextResponse } from "next/server";
import { getMonitoringRun } from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from "@/lib/auth";

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
    const data = await getMonitoringRun(user.id, id);

    if (!data || !data.run) {
      return NextResponse.json({ error: "Monitoring run not found" }, { status: 404 });
    }

    return NextResponse.json({
      run: data.run,
      results: data.results,
      citations: data.citations,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized")) {
      return forbiddenResponse(error.message);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
