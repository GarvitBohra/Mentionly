import { NextRequest, NextResponse } from "next/server";
import { getMonitoringRun } from "@/lib/data-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await getMonitoringRun(id);

    if (!data || !data.run) {
      return NextResponse.json({ error: "Monitoring run not found" }, { status: 404 });
    }

    return NextResponse.json({
      run: data.run,
      results: data.results,
      citations: data.citations,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

