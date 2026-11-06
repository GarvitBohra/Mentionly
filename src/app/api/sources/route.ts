import { NextRequest, NextResponse } from "next/server";
import { getActiveBrand, listCitations } from "@/lib/data-service";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (!user) {
      return unauthorizedResponse(authError || "Authentication required");
    }

    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brand_id") || undefined;

    const brand = await getActiveBrand(user.id, brandId);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    const citations = await listCitations(user.id, brand.id);

    // Group by domain
    const domainMap: Record<
      string,
      { domain: string; count: number; mentionsBrand: number; urls: string[] }
    > = {};

    citations.forEach((c) => {
      if (!domainMap[c.domain]) {
        domainMap[c.domain] = { domain: c.domain, count: 0, mentionsBrand: 0, urls: [] };
      }
      domainMap[c.domain].count++;
      if (c.mentions_brand) {
        domainMap[c.domain].mentionsBrand++;
      }
      if (!domainMap[c.domain].urls.includes(c.url)) {
        domainMap[c.domain].urls.push(c.url);
      }
    });

    const domains = Object.values(domainMap).sort((a, b) => b.count - a.count);

    return NextResponse.json({
      brand,
      citations,
      domains,
      total_citations: citations.length,
      distinct_domains: domains.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
