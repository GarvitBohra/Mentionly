import test from "node:test";
import assert from "node:assert/strict";

import { countMentions } from "../src/lib/analysis.ts";
import { formatAIError, availableProviders, askAI, generatePrompts } from "../src/lib/ai.ts";
import { parseBrandInput } from "../src/lib/brand-input.ts";

test("countMentions counts every mention, case-insensitively, on word boundaries", () => {
  assert.equal(countMentions("Burger King is great. I love burger king! Burger Kingdom is different.", "Burger King"), 2);
  assert.equal(countMentions("Nothing here", "Burger King"), 0);
});

test("countMentions tolerates curly or missing apostrophes", () => {
  const text = "Try Wendy’s or McDonalds, maybe Wendy's again.";
  assert.equal(countMentions(text, "Wendy's"), 2);
  assert.equal(countMentions(text, "Mcdonald's"), 1);
});

test("parseBrandInput requires name and keyword and cleans competitors", () => {
  assert.equal(typeof parseBrandInput({ keyword: "burger" }), "string");
  assert.equal(typeof parseBrandInput({ name: "Burger King" }), "string");
  const ok = parseBrandInput({ name: "Burger King", keyword: "burger", competitors: [" Wendy's ", "", "burger king", "Wendy's"] });
  assert.deepEqual(ok, { name: "Burger King", keyword: "burger", competitors: ["Wendy's"] });
});

test("formatAIError returns actionable, provider-specific messages", () => {
  assert.match(formatAIError({ status: 429, message: "quota" }), /OpenAI rate limit|budget/i);
  assert.match(formatAIError({ status: 401, message: "Incorrect API key" }), /Invalid OpenAI API key/);
  assert.match(formatAIError({ status: 404, message: "model not found" }), /unavailable/);
  assert.match(formatAIError({ status: 400, message: "API key not valid" }, "gemini"), /Invalid Gemini API key.*GEMINI_API_KEY/);
});

test("availableProviders: OpenAI first, Gemini second, placeholders ignored", () => {
  assert.deepEqual(availableProviders({ OPENAI_API_KEY: "sk-real", GEMINI_API_KEY: "g-real" }), ["openai", "gemini"]);
  assert.deepEqual(availableProviders({ OPENAI_API_KEY: "", GEMINI_API_KEY: "g-real" }), ["gemini"]);
  assert.deepEqual(
    availableProviders({ OPENAI_API_KEY: "your_openai_api_key_here", GEMINI_API_KEY: "your_gemini_api_key_here" }),
    []
  );
});

// ---- provider fallback, with a fake network ----------------------------------

/** Runs fn with the given env vars and a fake fetch that routes by URL; restores both afterwards. */
async function withFakeAI(env, handlers, fn) {
  const savedEnv = { ...process.env };
  const realFetch = globalThis.fetch;
  const calls = [];
  Object.assign(process.env, env);
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    calls.push({ url: u, init });
    const handler = u.includes("generativelanguage") ? handlers.gemini : handlers.openai;
    return handler(u, init);
  };
  try {
    return await fn(calls);
  } finally {
    globalThis.fetch = realFetch;
    process.env = savedEnv;
  }
}

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const geminiOk = (text) => json(200, { candidates: [{ content: { parts: [{ text }] } }] });
const openaiOk = (text) =>
  json(200, {
    id: "r1",
    object: "response",
    status: "completed",
    output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text, annotations: [] }] }],
  });

test("no OpenAI key: uses Gemini with Google Search and the key header", async () => {
  await withFakeAI(
    { OPENAI_API_KEY: "", GEMINI_API_KEY: "g-key", GEMINI_MODEL: "gemini-test" },
    { gemini: () => geminiOk("Pepsi and Coca-Cola.") },
    async (calls) => {
      assert.equal(await askAI("best cola?"), "Pepsi and Coca-Cola.");
      assert.equal(calls.length, 1);
      assert.match(calls[0].url, /models\/gemini-test:generateContent/);
      assert.equal(calls[0].init.headers["x-goog-api-key"], "g-key");
      assert.ok(JSON.parse(calls[0].init.body).tools[0].google_search);
    }
  );
});

test("OpenAI fails (invalid key): falls back to Gemini", async () => {
  await withFakeAI(
    { OPENAI_API_KEY: "sk-bad", GEMINI_API_KEY: "g-key" },
    {
      openai: () => json(401, { error: { message: "Incorrect API key provided" } }),
      gemini: () => geminiOk("From Gemini"),
    },
    async (calls) => {
      assert.equal(await askAI("q"), "From Gemini");
      assert.ok(calls.some((c) => c.url.includes("api.openai.com")));
      assert.ok(calls.some((c) => c.url.includes("generativelanguage")));
    }
  );
});

test("OpenAI works: Gemini is never called", async () => {
  await withFakeAI(
    { OPENAI_API_KEY: "sk-ok", GEMINI_API_KEY: "g-key" },
    { openai: () => openaiOk("From OpenAI"), gemini: () => geminiOk("should not be used") },
    async (calls) => {
      assert.equal(await askAI("q"), "From OpenAI");
      assert.ok(!calls.some((c) => c.url.includes("generativelanguage")));
    }
  );
});

test("Gemini search blocked by quota: retries without search and still answers", async () => {
  let n = 0;
  await withFakeAI(
    { OPENAI_API_KEY: "", GEMINI_API_KEY: "g-key" },
    {
      gemini: (_url, init) => {
        n++;
        const hasSearch = !!JSON.parse(init.body).tools;
        return hasSearch ? json(429, { error: { message: "You exceeded your current quota" } }) : geminiOk("Answer without search");
      },
    },
    async () => {
      assert.equal(await askAI("q"), "Answer without search");
      assert.equal(n, 2);
    }
  );
});

test("generatePrompts parses the JSON list from Gemini", async () => {
  const reply = '```json\n["Best cola brands?", "Top soft drinks?"]\n```';
  await withFakeAI({ OPENAI_API_KEY: "", GEMINI_API_KEY: "g-key" }, { gemini: () => geminiOk(reply) }, async () => {
    assert.deepEqual(await generatePrompts("cola", 6), ["Best cola brands?", "Top soft drinks?"]);
  });
});

test("both providers failing, or no key at all, gives a clear error", async () => {
  await withFakeAI(
    { OPENAI_API_KEY: "sk-bad", GEMINI_API_KEY: "g-bad" },
    {
      openai: () => json(429, { error: { message: "quota" } }),
      gemini: () => json(400, { error: { message: "API key not valid" } }),
    },
    async () => {
      await assert.rejects(() => askAI("q"), /OpenAI rate limit.*backup failed too.*Invalid Gemini API key/s);
    }
  );
  await withFakeAI({ OPENAI_API_KEY: "", GEMINI_API_KEY: "" }, {}, async () => {
    await assert.rejects(() => askAI("q"), /No AI key configured/);
  });
});
