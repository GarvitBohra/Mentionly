# API Reference Documentation

This document describes all existing API endpoints, HTTP methods, request payloads, and response structures in **Mentionly**.

---

## Base URL
- Local: `http://localhost:3000`
- Production: `https://<your-vercel-deployment>.vercel.app`

---

## 1. Health & Environment

### `GET /api/health`
Checks the live connectivity status of the Supabase PostgreSQL database and Gemini API.

- **Auth**: None
- **Response `200 OK`**:
```json
{
  "supabase": {
    "isConfigured": true,
    "tablesExist": true,
    "message": "Supabase PostgreSQL connected and schema verified."
  },
  "gemini": {
    "isConfigured": true,
    "activeModels": ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]
  },
  "version": "0.1.0",
  "environment": "development"
}
```

---

## 2. Brands Management

### `GET /api/brands`
Retrieves all monitored brands for the workspace.

- **Auth**: Session / Server Key
- **Response `200 OK`**:
```json
{
  "brands": [
    {
      "id": "b1000000-0000-0000-0000-000000000001",
      "name": "Mentionly",
      "website": "https://mentionly.ai",
      "industry": "AI SaaS & Search Intelligence",
      "country": "United States",
      "language": "English",
      "description": "Brand visibility monitoring across generative engines",
      "is_default": true,
      "competitors": [
        { "id": "c1", "name": "Otterly.AI", "website": "https://otterly.ai" }
      ]
    }
  ]
}
```

### `POST /api/brands`
Creates a new monitored brand entity.

- **Request Body (JSON)**:
```json
{
  "name": "Shopify",
  "website": "https://shopify.com",
  "industry": "E-commerce Platform",
  "country": "United States",
  "language": "English",
  "description": "Global commerce platform",
  "competitors": ["BigCommerce", "WooCommerce"]
}
```
- **Validation**:
  - `name`: min 2, max 100
  - `website`: valid URL
  - `industry`: min 2
  - `competitors`: array of strings, min 1, max 10
- **Response `201 Created`**: Returns `{ "brand": { ... } }`

### `GET /api/brands/[id]`
Retrieves details for a specific brand by UUID.

- **Response `200 OK`**: `{ "brand": { ... } }`
- **Response `404 Not Found`**: `{ "error": "Brand not found" }`

### `PATCH /api/brands/[id]`
Updates an existing brand's fields and competitor roster.

- **Request Body (JSON)**:
```json
{
  "industry": "Enterprise Commerce Software",
  "competitors": ["BigCommerce", "Magento", "Salesforce Commerce"]
}
```
- **Response `200 OK`**: `{ "brand": { ... } }`

### `DELETE /api/brands/[id]`
Deletes a brand and cascades deletion of its prompts and runs.

- **Response `200 OK`**: `{ "success": true }`

---

## 3. Prompts & Intent Explorer

### `GET /api/prompts?brand_id={id}`
Retrieves all prompts monitored for a given brand.

- **Query Parameters**: `brand_id` (Required UUID)
- **Response `200 OK`**:
```json
{
  "prompts": [
    {
      "id": "p1",
      "brand_id": "b1000...",
      "query_text": "What are the best AI search visibility tools?",
      "category": "Recommendation",
      "is_active": true,
      "created_at": "2026-11-06T10:00:00.000Z"
    }
  ]
}
```

### `POST /api/prompts`
Manually creates a new search prompt.

- **Request Body (JSON)**:
```json
{
  "brand_id": "b1000...",
  "query_text": "How to track ChatGPT citations for ecommerce brands?",
  "category": "Problem Solving"
}
```
- **Category Enum**: `Discovery` | `Recommendation` | `Comparison` | `Purchase Intent` | `Problem Solving`
- **Response `201 Created`**: `{ "prompt": { ... } }`

### `PATCH /api/prompts`
Modifies a prompt's text, category, or active status.

- **Request Body (JSON)**:
```json
{
  "id": "p1",
  "query_text": "Updated query text",
  "category": "Comparison",
  "is_active": true
}
```
- **Response `200 OK`**: `{ "prompt": { ... } }`

### `DELETE /api/prompts?id={id}`
Deletes a specific prompt by ID.

- **Response `200 OK`**: `{ "success": true }`

### `POST /api/prompts/generate`
Uses Google Gemini to generate high-intent buyer queries tailored to the brand.

- **Timeout**: `maxDuration = 60s`
- **Request Body (JSON)**:
```json
{
  "brand_name": "Mentionly",
  "website": "https://mentionly.ai",
  "industry": "AI Search Visibility",
  "description": "Brand visibility tracking in generative engines",
  "competitors": ["Otterly.AI", "Profound"],
  "count": 6
}
```
- **Response `200 OK`**:
```json
{
  "prompts": [
    {
      "query_text": "What are the best alternatives to Otterly AI for SEO teams?",
      "category": "Comparison"
    }
  ],
  "count": 1,
  "model": "gemini-3.8-flash"
}
```

---

## 4. Monitoring Engine

### `GET /api/monitoring?brand_id={id}`
Returns the history of monitoring runs executed for a brand.

- **Response `200 OK`**:
```json
{
  "runs": [
    {
      "id": "r1",
      "brand_id": "b100...",
      "status": "completed",
      "total_prompts": 5,
      "completed_prompts": 5,
      "visibility_score": 72.5,
      "brand_mention_rate": 60.0,
      "competitor_mention_rate": 80.0,
      "recommendation_rate": 40.0,
      "created_at": "2026-11-06T10:00:00.000Z"
    }
  ]
}
```

### `POST /api/monitoring`
Executes a new batch visibility monitoring run against Gemini with Google Search Grounding.

- **Timeout**: `maxDuration = 60s`
- **Request Body (JSON)**:
```json
{
  "brand_id": "b1000...",
  "prompt_ids": ["p1", "p2", "p3"]
}
```
- **Workflow**:
  1. Sets run to `running`.
  2. Executes queries against Gemini with Search Grounding enabled.
  3. Extracts raw response, checks brand and competitor mentions, parses citation URLs.
  4. Calculates composite AI Visibility Score.
  5. Updates status to `completed` and returns results.
- **Response `200 OK`**: `{ "run": { ... }, "message": "Monitoring run completed successfully" }`

### `GET /api/monitoring/[id]`
Retrieves run metadata, individual prompt results, raw AI text, and grounding citations.

- **Response `200 OK`**:
```json
{
  "run": { ... },
  "results": [
    {
      "id": "res1",
      "prompt_query": "What are the best AI search monitoring tools?",
      "brand_mentioned": true,
      "brand_recommended": true,
      "brand_position": 4,
      "raw_response": "Leading tools include Profound, Otterly, and Mentionly...",
      "has_grounding": true
    }
  ],
  "citations": [
    {
      "title": "GEO Guide 2026",
      "url": "https://searchengineland.com/geo-guide",
      "domain": "searchengineland.com",
      "mentions_brand": true
    }
  ]
}
```

---

## 5. Analytics & Intelligence

### `GET /api/analytics?brand_id={id}`
Aggregates dashboard KPI metrics, score trends, category distributions, and top sources.

- **Response `200 OK`**:
```json
{
  "analytics": {
    "is_demo": false,
    "kpis": {
      "visibility_score": 72.5,
      "brand_mention_rate": 60.0,
      "competitor_mention_rate": 80.0,
      "prompts_monitored": 5,
      "sources_discovered": 4
    },
    "trend": [
      { "date": "Nov 6", "visibility_score": 72.5, "brand_mentions": 60, "competitor_mentions": 80 }
    ],
    "brand_vs_competitor": [
      { "name": "Mentionly", "mention_rate": 60, "recommendation_rate": 40, "is_target_brand": true }
    ],
    "top_sources": [
      { "domain": "searchengineland.com", "count": 2, "mentions_brand_count": 2 }
    ]
  }
}
```

### `GET /api/competitors?brand_id={id}`
Returns competitor intelligence metrics and target brand share.

- **Response `200 OK`**:
```json
{
  "brand": { ... },
  "brand_mention_rate": 60.0,
  "brand_recommendation_rate": 40.0,
  "competitors": [
    {
      "name": "Otterly.AI",
      "mention_count": 3,
      "mention_rate": 60.0,
      "recommendation_rate": 40.0,
      "top_prompts": ["Best alternatives to Otterly AI"]
    }
  ],
  "has_monitoring_data": true
}
```

### `GET /api/sources?brand_id={id}`
Returns discovered citations grouped by domain and individual URLs.

- **Response `200 OK`**:
```json
{
  "citations": [ ... ],
  "domains": [
    { "domain": "techcrunch.com", "count": 1, "mentionsBrand": 1, "urls": [ ... ] }
  ],
  "total_citations": 4,
  "distinct_domains": 3
}
```

---

## 6. GEO Recommendations

### `GET /api/recommendations?brand_id={id}`
Retrieves actionable Generative Engine Optimization recommendations.

- **Response `200 OK`**:
```json
{
  "recommendations": [
    {
      "id": "geo1",
      "title": "Publish a Dedicated Competitor Comparison Matrix",
      "category": "Competitor Insights",
      "priority": "High",
      "status": "open",
      "explanation": "Competitors were cited in 80% of queries...",
      "suggested_action": "Create an authoritative comparison page..."
    }
  ]
}
```

### `POST /api/recommendations/generate`
Uses Gemini to synthesize recommendations from recent run observations.

- **Timeout**: `maxDuration = 60s`
- **Request Body (JSON)**: `{ "brand_id": "b1000..." }`
- **Response `200 OK`**: `{ "recommendations": [ ... ], "message": "Generated GEO recommendations successfully" }`

### `PATCH /api/recommendations`
Updates an action item's status.

- **Request Body (JSON)**:
```json
{
  "id": "geo1",
  "status": "in_progress"
}
```
- **Status Enum**: `open` | `in_progress` | `applied` | `dismissed`
- **Response `200 OK`**: `{ "success": true, "id": "geo1", "status": "in_progress" }`
