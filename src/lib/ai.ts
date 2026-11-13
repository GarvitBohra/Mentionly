import OpenAI from "openai";

/**
 * AI provider layer. OpenAI is used when OPENAI_API_KEY is set; Gemini
 * (GEMINI_API_KEY) is the backup. If OpenAI has no key, or the OpenAI call
 * fails (bad key, no quota, model unavailable, timeout...), the same request
 * is retried on Gemini.
 */
type Provider = "openai" | "gemini";

const PROVIDERS: Record<Provider, { name: string; keyEnv: string; modelEnv: string; defaultModel: string }> = {
  openai: { name: "OpenAI", keyEnv: "OPENAI_API_KEY", modelEnv: "OPENAI_MONITOR_MODEL", defaultModel: "gpt-4.1" },
  gemini: { name: "Gemini", keyEnv: "GEMINI_API_KEY", modelEnv: "GEMINI_MODEL", defaultModel: "gemini-3.5-flash-lite" },
};
// Read at call time so a changed environment takes effect without a restart of this module.
const modelFor = (p: Provider) => process.env[PROVIDERS[p].modelEnv] || PROVIDERS[p].defaultModel;

const TIMEOUT_MS = 40_000; // per question, so a whole run fits in the host's function time limit
// Gemini 2.5+/3.x models spend output tokens on hidden reasoning; a small budget can end with no text.
const GEMINI_MIN_OUTPUT_TOKENS = 2048;
// Statuses where Google Search grounding was refused (not on this plan / quota) and a plain answer can still work.
const SEARCH_UNAVAILABLE_STATUSES = [400, 403, 429];

const isRealKey = (v?: string) => !!v && v.trim() !== "" && !/^your[-_]|_here$/i.test(v.trim());

/** Providers that have a key, in the order they are tried. */
export function availableProviders(env: Record<string, string | undefined> = process.env): Provider[] {
  const list: Provider[] = [];
  if (isRealKey(env.OPENAI_API_KEY)) list.push("openai");
  if (isRealKey(env.GEMINI_API_KEY)) list.push("gemini");
  return list;
}

export function formatAIError(error: unknown, provider: Provider = "openai"): string {
  const { name, keyEnv, modelEnv } = PROVIDERS[provider];
  const e = error as { status?: number; message?: string };
  const raw = e?.message || String(error);
  if (/^(OpenAI|Gemini|No AI key)/.test(raw)) return raw;
  if (e?.status === 429 || /rate.limit|quota|insufficient_quota|resource_exhausted/i.test(raw)) {
    return `${name} rate limit or budget limit reached. Check your ${name} usage and try again later.`;
  }
  if (e?.status === 401 || e?.status === 403 || /incorrect api key|invalid api key|api key not valid|authentication|permission/i.test(raw)) {
    return `Invalid ${name} API key. Check ${keyEnv} in .env.`;
  }
  if (e?.status === 404 || /model.*not found|does not exist/i.test(raw)) {
    const hint = provider === "gemini" ? ` (${raw.replace(/\s+/g, " ").slice(0, 120)})` : "";
    return `${name} model "${modelFor(provider)}" is unavailable${hint}. Set ${modelEnv} to a model your project can access.`;
  }
  return `${name} request failed: ${raw}`;
}

interface TextRequest {
  prompt: string;
  instructions: string;
  search: boolean; // let the model use web search
  maxTokens: number;
}

async function openaiText(req: TextRequest): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create(
    {
      model: modelFor("openai"),
      max_output_tokens: req.maxTokens,
      instructions: req.instructions,
      input: req.prompt,
      ...(req.search ? { tools: [{ type: "web_search" as const, search_context_size: "low" as const }] } : {}),
    },
    { timeout: TIMEOUT_MS, maxRetries: 0 }
  );
  const text = response.output_text.trim();
  if (!text) throw new Error("OpenAI returned no answer.");
  return text;
}

async function geminiCall(req: TextRequest, withSearch: boolean) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelFor("gemini")}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY as string },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.instructions }] },
        contents: [{ role: "user", parts: [{ text: req.prompt }] }],
        ...(withSearch ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: { maxOutputTokens: Math.max(req.maxTokens, GEMINI_MIN_OUTPUT_TOKENS) },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }
  );
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function geminiText(req: TextRequest): Promise<string> {
  let { res, data } = await geminiCall(req, req.search);
  // Google Search grounding is not available on every Gemini plan (e.g. the free tier
  // returns a quota error). Retry once without it so the backup still answers.
  if (!res.ok && req.search && SEARCH_UNAVAILABLE_STATUSES.includes(res.status)) {
    ({ res, data } = await geminiCall(req, false));
  }
  if (!res.ok) {
    throw Object.assign(new Error(data?.error?.message || `HTTP ${res.status}`), { status: res.status });
  }
  const parts: Array<{ text?: string }> = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("Gemini returned no answer.");
  return text;
}

/** Runs the request on the first provider that works, falling back to the next. */
async function generateText(req: TextRequest): Promise<string> {
  const providers = availableProviders();
  if (providers.length === 0) {
    throw new Error("No AI key configured. Add OPENAI_API_KEY (or GEMINI_API_KEY) to .env.");
  }
  const failures: string[] = [];
  for (const provider of providers) {
    try {
      return await (provider === "openai" ? openaiText(req) : geminiText(req));
    } catch (error) {
      failures.push(formatAIError(error, provider));
    }
  }
  const message = failures.join(" Then the backup failed too: ");
  const hasBackup = providers.includes("gemini");
  throw new Error(hasBackup ? message : `${message} Tip: add GEMINI_API_KEY to enable an automatic Gemini backup.`);
}

/** Search questions people would ask about a keyword. Only the keyword is sent. */
export async function generatePrompts(keyword: string, count = 6): Promise<string[]> {
  const text = (
    await generateText({
      search: false,
      maxTokens: 1200,
      instructions: "Return only a JSON array of strings. No markdown.",
      prompt: `Generate exactly ${count} different questions that real people ask AI chat assistants when they want to choose or compare brands, companies or products for "${keyword}". Every question must ask for recommendations, rankings or comparisons so the answer names specific brands (for example "What are the best ${keyword} brands?", "Which ${keyword} option is best value?", "Top ${keyword} places people recommend"). Questions must not need a location or personal details to answer. Never mention any brand, company or website name in the questions.`,
    })
  )
    .replace(/```json|```/g, "")
    .trim();

  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const parsed = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
    const prompts = (Array.isArray(parsed) ? parsed : [])
      .map((p) => String(p).trim())
      .filter(Boolean)
      .slice(0, count);
    if (prompts.length > 0) return prompts;
  } catch {
    // fall through to the readable error below
  }
  throw new Error("The AI returned an invalid prompt list. Please try again.");
}

/** Asks an AI chat assistant (with web search) the question and returns its answer text. */
export async function askAI(prompt: string): Promise<string> {
  return generateText({
    search: true,
    maxTokens: 1200,
    instructions:
      "Answer directly and concisely. Name specific brands, companies or products by name. Do not ask clarifying questions; assume the United States if a location matters.",
    prompt,
  });
}
