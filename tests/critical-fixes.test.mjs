import test from "node:test";
import assert from "node:assert/strict";

import { countMentions } from "../src/lib/analysis.ts";
import { formatOpenAIError } from "../src/lib/openai.ts";
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

test("formatOpenAIError returns actionable messages", () => {
  assert.match(formatOpenAIError({ status: 429, message: "quota" }), /rate limit|budget/i);
  assert.match(formatOpenAIError({ status: 401, message: "Incorrect API key" }), /Invalid OpenAI API key/);
  assert.match(formatOpenAIError({ status: 404, message: "model not found" }), /unavailable/);
});
