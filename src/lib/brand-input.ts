export interface BrandInput {
  name: string;
  keyword: string;
  competitors: string[];
}

/** Validates the brand form body. Returns the clean input, or an error message string. */
export function parseBrandInput(body: any): BrandInput | string {
  const name = String(body?.name ?? "").trim();
  const keyword = String(body?.keyword ?? "").trim();
  if (!name) return "Brand name is required";
  if (!keyword) return "Keyword is required (for example: burger)";

  const raw: unknown[] = Array.isArray(body?.competitors) ? body.competitors : [];
  const competitors = Array.from(
    new Set(raw.map((c) => String(c).trim()).filter((c) => c && c.toLowerCase() !== name.toLowerCase()))
  );
  return { name: name.slice(0, 100), keyword: keyword.slice(0, 200), competitors };
}
