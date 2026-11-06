# Mentionly Technical Architecture

This document outlines the architecture, data flow, component hierarchy, and analytical engine of **Mentionly**.

---

## 1. Architectural Overview

Mentionly is built as a **modular monolith** utilizing Next.js App Router. It unites frontend presentation, server-side API handlers, relational data persistence, and external generative AI grounding in a single maintainable repository.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│        (React 19, Tailwind CSS, Lucide Icons, Recharts)     │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP Requests                 │ React Server/Client
               ▼                               │ State Hydration
┌──────────────────────────────────────────────┴──────────────┐
│                    Next.js App Router                       │
│  ├── Client / Server Components (/app/dashboard, /app/login)│
│  └── Edge-compatible API Routes (/app/api/*)                │
└──────┬──────────────────────┬───────────────────────▲───────┘
       │                      │                       │
       │ PostgREST / RLS      │ GenAI SDK with Search │ Grounding
       │ Queries              │ Grounding Tools       │ Chunks
       ▼                      ▼                       │
┌──────────────┐       ┌────────────────────────┐     │
│   Supabase   │       │   Google Gemini API    ├─────┘
│  PostgreSQL  │       │ (gemini-3.8-flash,     │
│  & Auth      │       │  Search Grounding)     │
└──────────────┘       └──────────────┬─────────┘
                                      │
                                      ▼
                       ┌────────────────────────┐
                       │    Analysis Engine     │
                       │  (lib/analysis.ts)     │
                       │  - Mention Detection   │
                       │  - Ranking Extraction  │
                       │  - Citation Parsing    │
                       └──────────────┬─────────┘
                                      │
                                      ▼
                       ┌────────────────────────┐
                       │     Scoring Engine     │
                       │   (lib/scoring.ts)     │
                       │  Composite Score 0-100 │
                       └────────────────────────┘
```

---

## 2. Frontend Structure

The user interface follows a modern dark theme inspired by Linear and Vercel.

### Route Map
- `/`: Public landing page featuring product value proposition, workflow, and CTAs.
- `/login`: Supabase email authentication and single-click demo workspace entry.
- `/signup`: User onboarding and account registration.
- `/dashboard`: Main executive analytics overview with KPI cards and Recharts visualizations.
- `/dashboard/brands`: Brand CRUD management, target geography/language, and competitor sets.
- `/dashboard/visibility`: Batch monitoring execution engine with live progress indicator and prompt inspector.
- `/dashboard/prompts`: Prompt intent explorer, category filters, and Gemini automated prompt generation.
- `/dashboard/competitors`: Competitor citation frequency, top-pick recommendation rate, and head-to-head search share table.
- `/dashboard/sources`: Discovered search grounding URLs, publisher domains, and brand citation counts.
- `/dashboard/recommendations`: Actionable GEO suggestions with priority levels and implementation tracking.
- `/dashboard/settings`: Real-time API & database health diagnostics, scoring methodology reference.

### Core UI Primitives (`src/components/ui/`)
- `Button`: Multi-variant action trigger (`primary`, `secondary`, `outline`, `ghost`, `destructive`) with integrated loading spinner.
- `Card`: Structured container component with charcoal backgrounds and thin borders (`#1f242d`).
- `Badge`: Status and category indicator with color variants (`default`, `secondary`, `success`, `warning`, `destructive`).
- `Input` & `Textarea`: Dark-themed form inputs with focus rings.
- `DisclaimerBanner`: Standardized compliance notice clarifying that results reflect Gemini API observations.

---

## 3. Backend API Architecture

All business logic resides in server-side Next.js route handlers (`src/app/api/`):

- **Data Access Layer (`src/lib/data-service.ts`)**: Decoupled service layer that queries Supabase PostgreSQL when tables exist, or gracefully falls back to an in-memory memory store (`src/lib/store.ts`) for local evaluation.
- **Request Validation (`src/lib/validations.ts`)**: Every mutating API request passes through Zod schema validation before database execution.
- **Vercel Execution Limits**: Time-sensitive routes (`/api/monitoring`, `/api/prompts/generate`, `/api/recommendations/generate`) export `maxDuration = 60` to prevent serverless function timeouts on batch AI operations.

---

## 4. Gemini AI Integration (`src/lib/gemini.ts`)

Mentionly interfaces with Google Gemini using the official `@google/genai` SDK:

### Dynamic Model Fallback Chain
Due to model lifecycle updates, Mentionly implements a candidate fallback chain:
1. `gemini-3.8-flash` (Primary default)
2. `gemini-3.5-flash` (Secondary)
3. `gemini-3.1-flash-lite` (Lightweight fallback)

### Google Search Grounding Execution
Visibility checks are executed with the Google Search tool configuration:
```ts
const response = await client.models.generateContent({
  model: "gemini-3.8-flash",
  contents: promptQuery,
  config: {
    temperature: 0.3,
    tools: [{ googleSearch: {} }],
  },
});
```
The engine parses `candidates[0].groundingMetadata.groundingChunks` to extract verified web publisher URLs, titles, and snippets.

---

## 5. Mention Analysis Workflow (`src/lib/analysis.ts`)

Once Gemini returns a response, the text is evaluated by the analysis engine:

1. **Brand Normalization**: Strips top-level domain endings (e.g., `.ai`, `.com`) to capture brand name aliases while respecting regex word boundaries (`\bBrand\b`).
2. **Mention Context Extraction**: Locates the first occurrence of the brand in the answer and extracts a surrounding 140-character window for contextual inspection.
3. **Recommendation Evaluation**: Determines whether the brand is presented positively by evaluating:
   - Placement in numbered ranking lists (e.g., `1. Brand`, `#1 Brand`).
   - Co-occurrence with positive recommendation markers (*"top pick"*, *"leading platform"*, *"highly recommended"*, *"best for"*).
4. **Competitor Extraction**: Iterates over all monitored competitor names, extracting presence and relative ranking positions.
5. **Source Attribution**: Maps each discovered search grounding chunk back to the target brand to verify if the citation URL specifically covers the brand.

---

## 6. AI Visibility Scoring Methodology (`src/lib/scoring.ts`)

The **Mentionly AI Visibility Score** is a composite metric on a 0 to 100 scale:

$$\text{Visibility Score} = (0.40 \times \text{Mention Rate}) + (0.35 \times \text{Recommendation Rate}) + (0.15 \times \text{Position Quality}) + (0.10 \times \text{Grounding Rate})$$

| Component | Weight | Metric Formula |
| :--- | :---: | :--- |
| **Brand Mention Rate** | **40%** | $\frac{\text{Successful Prompts Citing Brand}}{\text{Total Successful Prompts}} \times 100$ |
| **Recommendation Rate** | **35%** | $\frac{\text{Prompts Recommending Brand}}{\text{Total Successful Prompts}} \times 100$ |
| **Position Quality Factor** | **15%** | Weighted score from 100 (#1 rank) down to 20 (#5+ rank), or 50 if mentioned without numerical rank. |
| **Grounding Rate** | **10%** | Proportion of model answers supported by live Google Search grounding chunks. |

> 📌 **Key Rule:** Prompts that fail execution (e.g., API timeout or HTTP 429 quota exhaustion) are strictly excluded from calculations so negative rates are not artificially skewed.
