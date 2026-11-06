import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

test("1. Public Landing Page renders correctly", async () => {
  const res = await fetch(`${BASE_URL}/`);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /Know when AI talks about your brand/i);
  assert.match(html, /Mentionly/i);
  assert.match(html, /AI Search Visibility Platform/i);
});

test("2. Platform Health Check endpoint", async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.gemini);
  assert.ok(data.supabase);
  assert.equal(typeof data.gemini.isConfigured, "boolean");
});

test("3. Brand CRUD operations", async () => {
  // A. List existing brands
  const listRes = await fetch(`${BASE_URL}/api/brands`);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.ok(Array.isArray(listData.brands));

  // B. Create a new test brand
  const newBrandPayload = {
    name: "Automated QA Brand",
    website: "https://qa-test-brand.com",
    industry: "DevOps & Testing",
    country: "United States",
    language: "English",
    description: "Automated test brand for QA verification",
    competitors: ["Competitor X", "Competitor Y"],
  };

  const createRes = await fetch(`${BASE_URL}/api/brands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newBrandPayload),
  });
  assert.equal(createRes.status, 201);
  const createdData = await createRes.json();
  assert.ok(createdData.brand.id);
  assert.equal(createdData.brand.name, newBrandPayload.name);
  const brandId = createdData.brand.id;

  // C. Update the brand
  const updateRes = await fetch(`${BASE_URL}/api/brands/${brandId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      industry: "Updated Enterprise Software",
    }),
  });
  assert.equal(updateRes.status, 200);
  const updatedData = await updateRes.json();
  assert.equal(updatedData.brand.industry, "Updated Enterprise Software");

  // D. Delete the test brand
  const deleteRes = await fetch(`${BASE_URL}/api/brands/${brandId}`, {
    method: "DELETE",
  });
  assert.equal(deleteRes.status, 200);
});

test("4. Brand Validation handles invalid input", async () => {
  const invalidPayload = {
    name: "A", // too short (min 2)
    website: "not-a-valid-url",
    industry: "",
    competitors: [],
  };

  const res = await fetch(`${BASE_URL}/api/brands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invalidPayload),
  });
  assert.equal(res.status, 400);
  const errorData = await res.json();
  assert.ok(errorData.error);
});

test("5. Prompt Explorer & Management", async () => {
  const listBrandsRes = await fetch(`${BASE_URL}/api/brands`);
  const { brands } = await listBrandsRes.json();
  const brandId = brands[0].id;

  // A. Create custom prompt
  const createRes = await fetch(`${BASE_URL}/api/prompts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_id: brandId,
      query_text: "What are the best automated testing tools for AI search?",
      category: "Recommendation",
    }),
  });
  assert.equal(createRes.status, 201);
  const { prompt } = await createRes.json();
  assert.ok(prompt.id);

  // B. Edit prompt query text
  const editRes = await fetch(`${BASE_URL}/api/prompts`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: prompt.id,
      query_text: "Which platforms best track brand presence in AI search?",
      category: "Discovery",
    }),
  });
  assert.equal(editRes.status, 200);
  const editedData = await editRes.json();
  assert.equal(editedData.prompt.category, "Discovery");

  // C. Toggle active status
  const toggleRes = await fetch(`${BASE_URL}/api/prompts`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: prompt.id,
      is_active: false,
    }),
  });
  assert.equal(toggleRes.status, 200);

  // D. Delete prompt
  const delRes = await fetch(`${BASE_URL}/api/prompts?id=${prompt.id}`, {
    method: "DELETE",
  });
  assert.equal(delRes.status, 200);
});

test("6. Gemini Prompt Generation endpoint", async () => {
  const res = await fetch(`${BASE_URL}/api/prompts/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brand_name: "Mentionly",
      website: "https://mentionly.ai",
      industry: "AI Search Visibility",
      description: "Brand visibility monitoring across generative engines",
      competitors: ["Otterly.AI", "Profound"],
      count: 4,
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.prompts));
  assert.equal(data.prompts.length, 4);
  assert.ok(data.prompts[0].query_text);
  assert.ok(data.prompts[0].category);
});

test("7. Analytics API returns valid structure & KPI metrics", async () => {
  const res = await fetch(`${BASE_URL}/api/analytics`);
  assert.equal(res.status, 200);
  const { analytics } = await res.json();

  assert.ok(analytics.kpis);
  assert.equal(typeof analytics.kpis.visibility_score, "number");
  assert.equal(typeof analytics.kpis.brand_mention_rate, "number");
  assert.ok(Array.isArray(analytics.brand_vs_competitor));
  assert.ok(Array.isArray(analytics.recent_runs));
});

test("8. Competitors endpoint returns dynamic head-to-head metrics", async () => {
  const res = await fetch(`${BASE_URL}/api/competitors`);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(data.brand);
  assert.ok(Array.isArray(data.competitors));
  assert.equal(typeof data.brand_mention_rate, "number");
  assert.equal(typeof data.brand_recommendation_rate, "number");
});

test("9. Sources & Citations endpoint returns domain-level aggregation", async () => {
  const res = await fetch(`${BASE_URL}/api/sources`);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(Array.isArray(data.citations));
  assert.ok(Array.isArray(data.domains));
  assert.equal(typeof data.total_citations, "number");
});

test("10. GEO Recommendations endpoint and status update", async () => {
  const res = await fetch(`${BASE_URL}/api/recommendations`);
  assert.equal(res.status, 200);
  const data = await res.json();

  assert.ok(Array.isArray(data.recommendations));
  if (data.recommendations.length > 0) {
    const targetRec = data.recommendations[0];
    const updateRes = await fetch(`${BASE_URL}/api/recommendations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: targetRec.id,
        status: "in_progress",
      }),
    });
    assert.equal(updateRes.status, 200);
  }
});

