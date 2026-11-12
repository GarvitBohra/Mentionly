import OpenAI from "openai";

const MODEL = process.env.OPENAI_MONITOR_MODEL || "gpt-4.1";

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !key.trim() || key === "your_openai_api_key_here") {
    throw new Error("OpenAI is not configured. Add OPENAI_API_KEY to .env.");
  }
  return new OpenAI({ apiKey: key });
}

export function formatOpenAIError(error: unknown): string {
  const e = error as { status?: number; message?: string };
  const raw = e?.message || String(error);
  if (raw.startsWith("OpenAI ")) return raw;
  if (e?.status === 429 || /rate.limit|quota|insufficient_quota/i.test(raw)) {
    return "OpenAI rate limit or budget limit reached. Check your OpenAI project budget and try again later.";
  }
  if (e?.status === 401 || /incorrect api key|invalid api key|authentication/i.test(raw)) {
    return "Invalid OpenAI API key. Check OPENAI_API_KEY in .env.";
  }
  if (e?.status === 404 || /model.*not found|does not exist/i.test(raw)) {
    return `OpenAI model "${MODEL}" is unavailable to this project. Set OPENAI_MONITOR_MODEL to a model your project can access.`;
  }
  return `OpenAI request failed: ${raw}`;
}

/** Search questions people would ask about a keyword. Only the keyword is sent. */
export async function generatePrompts(keyword: string, count = 6): Promise<string[]> {
  try {
    const response = await getClient().responses.create({
      model: MODEL,
      max_output_tokens: 1200,
      instructions: "Return only a JSON array of strings. No markdown.",
      input: `Generate exactly ${count} different questions that real people type into ChatGPT when they want to choose or compare brands, companies or products for "${keyword}". Every question must ask for recommendations, rankings or comparisons so the answer names specific brands (for example "What are the best ${keyword} brands?", "Which ${keyword} option is best value?", "Top ${keyword} places people recommend"). Questions must not need a location or personal details to answer. Never mention any brand, company or website name in the questions.`,
    });
    const text = response.output_text.replace(/```json|```/g, "").trim();
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const parsed = JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text);
    const prompts = (Array.isArray(parsed) ? parsed : [])
      .map((p) => String(p).trim())
      .filter(Boolean)
      .slice(0, count);
    if (prompts.length === 0) throw new Error("empty");
    return prompts;
  } catch (error) {
    if ((error as Error)?.message === "empty" || error instanceof SyntaxError) {
      throw new Error("OpenAI returned an invalid prompt list. Please try again.");
    }
    throw new Error(formatOpenAIError(error));
  }
}

/** Asks ChatGPT (with web search) the question and returns its answer text. */
export async function askChatGPT(prompt: string): Promise<string> {
  try {
    const response = await getClient().responses.create({
      model: MODEL,
      max_output_tokens: 700,
      tools: [{ type: "web_search" }],
      instructions:
        "Answer directly and concisely. Name specific brands, companies or products by name. Do not ask clarifying questions; assume the United States if a location matters.",
      input: prompt,
    });
    const text = response.output_text.trim();
    if (!text) throw new Error("OpenAI returned no answer. Please run the check again.");
    return text;
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }
}
