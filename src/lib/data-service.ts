import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";
import { Brand, RunResult, RunSummary, Visibility } from "@/types";

/** Supabase is the only data store. Every function throws on database errors. */
function db(): SupabaseClient {
  const client = createAdminClient();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env."
    );
  }
  return client;
}

function check<T>(res: { data: T; error: { message: string } | null }, action: string): T {
  if (res.error) throw new Error(`${action}: ${res.error.message}`);
  return res.data;
}

const BRAND_SELECT = "*, competitors(*), prompts(*)";

export async function listBrands(userId: string): Promise<Brand[]> {
  const data = check(
    await db().from("brands").select(BRAND_SELECT).eq("user_id", userId).order("created_at", { ascending: false }),
    "List brands"
  );
  return (data as Brand[]) || [];
}

/** The brand with this id, only if the user owns it. */
export async function getBrand(userId: string, brandId: string): Promise<Brand | null> {
  const { data } = await db()
    .from("brands")
    .select(BRAND_SELECT)
    .eq("id", brandId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Brand) || null;
}

async function saveCompetitors(brandId: string, names: string[]) {
  const supabase = db();
  check(await supabase.from("competitors").delete().eq("brand_id", brandId), "Reset competitors");
  if (names.length > 0) {
    check(await supabase.from("competitors").insert(names.map((name) => ({ brand_id: brandId, name }))), "Save competitors");
  }
}

export async function createBrand(
  userId: string,
  input: { name: string; keyword: string; competitors: string[] }
): Promise<Brand> {
  const data = check(
    await db().from("brands").insert({ user_id: userId, name: input.name, keyword: input.keyword }).select("id").single(),
    "Create brand"
  )!;
  await saveCompetitors(data.id, input.competitors);
  return (await getBrand(userId, data.id)) as Brand;
}

export async function updateBrand(
  userId: string,
  id: string,
  input: { name: string; keyword: string; competitors: string[] }
): Promise<Brand | null> {
  if (!(await getBrand(userId, id))) return null;
  check(await db().from("brands").update({ name: input.name, keyword: input.keyword }).eq("id", id), "Update brand");
  await saveCompetitors(id, input.competitors);
  return getBrand(userId, id);
}

export async function deleteBrand(userId: string, id: string): Promise<boolean> {
  if (!(await getBrand(userId, id))) return false;
  check(await db().from("brands").delete().eq("id", id), "Delete brand");
  return true;
}

/** Replaces the brand's prompts with a fresh generated set. */
export async function replacePrompts(brandId: string, queries: string[]): Promise<void> {
  const supabase = db();
  check(await supabase.from("prompts").delete().eq("brand_id", brandId), "Clear prompts");
  check(await supabase.from("prompts").insert(queries.map((query_text) => ({ brand_id: brandId, query_text }))), "Save prompts");
}

export async function deletePrompt(userId: string, promptId: string): Promise<boolean> {
  const supabase = db();
  const { data } = await supabase.from("prompts").select("brand_id").eq("id", promptId).maybeSingle();
  if (!data || !(await getBrand(userId, data.brand_id))) return false;
  check(await supabase.from("prompts").delete().eq("id", promptId), "Delete prompt");
  return true;
}

export async function createRun(brandId: string): Promise<string> {
  const data = check(await db().from("runs").insert({ brand_id: brandId }).select("id").single(), "Create run")!;
  return data.id;
}

export async function saveResult(result: Omit<RunResult, "id">): Promise<void> {
  check(await db().from("results").insert(result), "Save result");
}

/**
 * A run with per-name visibility totals. Pass `runId` to read a specific run
 * (so overlapping requests never read each other's run); otherwise the latest
 * run that has at least one saved result.
 */
export async function getLatestRun(brand: Brand, runId?: string): Promise<RunSummary> {
  const supabase = db();
  let query = supabase.from("runs").select("id, created_at, results(id)").eq("brand_id", brand.id);
  if (runId) query = query.eq("id", runId);
  const { data: runs } = await query.order("created_at", { ascending: false }).limit(runId ? 1 : 10);
  const run = runId
    ? runs?.[0]
    : runs?.find((r: { results: unknown[] }) => r.results.length > 0) ?? runs?.[0];
  if (run) delete (run as { results?: unknown }).results;
  if (!run) return { run: null, results: [], answered: 0, visibility: [] };

  const results = (check(
    await supabase.from("results").select("*").eq("run_id", run.id).order("created_at", { ascending: true }),
    "Load results"
  ) || []) as RunResult[];

  const answeredResults = results.filter((r) => !r.error);
  const answered = answeredResults.length;
  const percent = (n: number) => (answered ? Math.round((n / answered) * 100) : 0);

  const brandRow: Visibility = {
    name: brand.name,
    is_brand: true,
    answers_with_mention: answeredResults.filter((r) => r.brand_count > 0).length,
    total_mentions: answeredResults.reduce((sum, r) => sum + r.brand_count, 0),
    percent: 0,
  };
  const competitorRows: Visibility[] = brand.competitors.map((c) => ({
    name: c.name,
    is_brand: false,
    answers_with_mention: answeredResults.filter((r) => (r.competitor_counts?.[c.name] || 0) > 0).length,
    total_mentions: answeredResults.reduce((sum, r) => sum + (r.competitor_counts?.[c.name] || 0), 0),
    percent: 0,
  }));
  const visibility = [brandRow, ...competitorRows].map((v) => ({ ...v, percent: percent(v.answers_with_mention) }));

  return { run, results, answered, visibility };
}
