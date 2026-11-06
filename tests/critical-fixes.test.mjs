import test from "node:test";
import assert from "node:assert/strict";

import { calculateVisibilityMetrics } from "../src/lib/scoring.ts";
import { formatGeminiError, executeVisibilityQuery } from "../src/lib/gemini.ts";
import { memoryStore } from "../src/lib/store.ts";
import { unauthorizedResponse, forbiddenResponse } from "../src/lib/auth.ts";

test("Issue 1 & 5: Authentication response helpers return 401 and 403 with standard schemas", () => {
  const unauth = unauthorizedResponse("Session required");
  assert.equal(unauth.status, 401);

  const forbidden = forbiddenResponse("Access denied");
  assert.equal(forbidden.status, 403);
});

test("Issue 2: Multi-tenant data isolation prevents data leakage across organizations", () => {
  memoryStore.clearAll();

  // Create brand for Tenant A
  const orgA = "org-user-aaa";
  const brandA = memoryStore.saveBrand({
    id: "brand-a-1",
    organization_id: orgA,
    name: "Tenant A Brand",
    website: "https://tenant-a.com",
    industry: "SaaS",
    country: "US",
    language: "EN",
    created_at: new Date().toISOString(),
    competitors: [],
  });

  // Create brand for Tenant B
  const orgB = "org-user-bbb";
  const brandB = memoryStore.saveBrand({
    id: "brand-b-1",
    organization_id: orgB,
    name: "Tenant B Brand",
    website: "https://tenant-b.com",
    industry: "Fintech",
    country: "US",
    language: "EN",
    created_at: new Date().toISOString(),
    competitors: [],
  });

  // Querying Tenant A's brands returns ONLY Tenant A's brands
  const brandsA = memoryStore.getBrands(orgA);
  assert.equal(brandsA.length, 1);
  assert.equal(brandsA[0].id, brandA.id);
  assert.equal(brandsA[0].name, "Tenant A Brand");

  // Querying Tenant B's brands returns ONLY Tenant B's brands
  const brandsB = memoryStore.getBrands(orgB);
  assert.equal(brandsB.length, 1);
  assert.equal(brandsB[0].id, brandB.id);

  // Tenant A cannot look up Tenant B's brand
  const crossLookup = memoryStore.getBrand(brandB.id, orgA);
  assert.equal(crossLookup, undefined);
});

test("Issue 3: Gemini visibility execution produces valid grounding sources", async () => {
  const res = await executeVisibilityQuery("What is the top visibility tool?", { brandName: "Mentionly" });
  assert.ok(res.text);
  assert.ok(Array.isArray(res.groundingSources));
  assert.equal(typeof res.hasGrounding, "boolean");
});

test("Issue 4: Visibility scoring strictly excludes failed prompts from metric calculations", () => {
  // Case A: 3 prompts, 1 failed (with error), 1 mentioned brand, 1 did not
  const results = [
    {
      id: "res-1",
      run_id: "run-1",
      prompt_query: "Top SEO tool",
      prompt_category: "Discovery",
      raw_response: "TestBrand is a great platform for AI SEO.",
      brand_mentioned: true,
      brand_recommended: true,
      brand_position: 1,
      competitors_mentioned: [],
      has_grounding: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "res-2",
      run_id: "run-1",
      prompt_query: "Top Analytics tool",
      prompt_category: "Discovery",
      raw_response: "Google Analytics and Mixpanel are industry leaders.",
      brand_mentioned: false,
      brand_recommended: false,
      competitors_mentioned: [{ name: "Mixpanel", mentioned: true }],
      has_grounding: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "res-3",
      run_id: "run-1",
      prompt_query: "Failed query due to 429",
      prompt_category: "Discovery",
      raw_response: "",
      brand_mentioned: false,
      brand_recommended: false,
      error: "Gemini API rate limit exceeded (HTTP 429)",
      competitors_mentioned: [],
      has_grounding: false,
      created_at: new Date().toISOString(),
    },
  ];

  const scores = calculateVisibilityMetrics(results, 2);

  // Total successful prompts is 2 (failed prompt is excluded)
  assert.equal(scores.totalSuccessfulPrompts, 2);
  // Brand mention rate: 1 out of 2 = 50.0% (NOT 33.3% which would penalize for system error)
  assert.equal(scores.brandMentionRate, 50.0);
  assert.equal(scores.recommendationRate, 50.0);
  assert.equal(scores.competitorMentionRate, 50.0);
  assert.ok(scores.visibilityScore > 0);
});

test("Issue 4: Visibility scoring handles runs where all prompts fail honestly", () => {
  const allFailedResults = [
    {
      id: "res-1",
      run_id: "run-all-fail",
      prompt_query: "Query 1",
      prompt_category: "Discovery",
      raw_response: "",
      brand_mentioned: false,
      brand_recommended: false,
      error: "429 Quota Exceeded",
      competitors_mentioned: [],
      has_grounding: false,
      created_at: new Date().toISOString(),
    },
    {
      id: "res-2",
      run_id: "run-all-fail",
      prompt_query: "Query 2",
      prompt_category: "Discovery",
      raw_response: "",
      brand_mentioned: false,
      brand_recommended: false,
      error: "429 Quota Exceeded",
      competitors_mentioned: [],
      has_grounding: false,
      created_at: new Date().toISOString(),
    },
  ];

  const scores = calculateVisibilityMetrics(allFailedResults, 0);
  assert.equal(scores.totalSuccessfulPrompts, 0);
  assert.equal(scores.visibilityScore, 0);
  assert.equal(scores.brandMentionRate, 0);
  assert.equal(scores.recommendationRate, 0);
  assert.equal(scores.competitorMentionRate, 0);
});

test("Issue 6: Gemini API errors are formatted with actionable, user-friendly messages", () => {
  // Test 429 Quota
  const quotaErr = formatGeminiError(new Error("RESOURCE_EXHAUSTED: Quota exceeded for quota metric"));
  assert.match(quotaErr, /rate limit or quota exceeded/i);
  assert.match(quotaErr, /HTTP 429/i);

  // Test 401 Invalid Key
  const authErr = formatGeminiError(new Error("API_KEY_INVALID: API key not valid"));
  assert.match(authErr, /Invalid Gemini API key/i);

  // Test Timeout
  const timeoutErr = formatGeminiError(new Error("DEADLINE_EXCEEDED"));
  assert.match(timeoutErr, /timed out/i);
});
