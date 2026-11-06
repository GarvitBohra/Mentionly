# Mentionly — AI Search Visibility Platform

> **Know when AI talks about your brand.**  
> Monitor your brand visibility across AI-generated answers, understand your competitors, and discover the sources shaping AI recommendations.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini API](https://img.shields.io/badge/Google%20GenAI-Gemini%20API-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)

---

## 📚 Technical Documentation Hub

Comprehensive architectural, operational, and deployment guides are available in the [`docs/`](docs/) directory:

- ⚙️ **[Environment Setup & Keys](docs/ENV_SETUP.md)**: Configuration guide for Supabase and Google Gemini credentials.
- 🏗️ **[Technical Architecture](docs/ARCHITECTURE.md)**: Modular monolith overview, component hierarchy, Gemini Grounding pipeline, and scoring formulas.
- 🗄️ **[Database Schema & RLS](docs/DATABASE.md)**: ERD diagrams, 10-table schema definitions, indexes, and Row Level Security isolation.
- 🔌 **[API Reference](docs/API.md)**: Full REST API documentation, request payloads, response schemas, and status codes.
- 🧪 **[Testing & QA](docs/TESTING.md)**: Automated integration test suite (`tests/mentionly-suite.test.mjs`), manual QA procedures, and known limits.
- 🚢 **[Production Deployment](docs/DEPLOYMENT.md)**: Step-by-step Vercel deployment, Supabase production migration, and rollback procedures.

---

## 🚀 Product Overview

**Mentionly** is an AI Search Visibility and Generative Engine Optimization (GEO) platform that helps businesses monitor whether conversational AI systems mention, recommend, and cite their brands when answering customer questions.

When buyers ask AI systems (such as Google Gemini, Perplexity, or ChatGPT) for vendor recommendations, software comparisons, and market alternatives, AI models choose which brands to cite, which to recommend as top choices, and which to omit. Mentionly turns black-box AI responses into actionable intelligence and empirical grounding citations.

> **Important Notice:** Mentionly measures empirical AI visibility based on observations from the Gemini API with Google Search Grounding. It does not guarantee how consumer conversational models will answer specific individual queries.

---

## 🌟 Key Features

1. **Executive Analytics Dashboard (`/dashboard`)**
   - **Composite AI Visibility Score (0–100)**: Weighted index combining mention rate, recommendation strength, rank quality, and grounding.
   - **Trend Visualizations**: Historical area charts tracking score progression across runs.
   - **Head-to-Head Comparison**: Dynamic target brand vs. competitor share bar charts.
   - **Category Breakdown**: Visibility distribution across *Discovery*, *Recommendation*, *Comparison*, *Purchase Intent*, and *Problem Solving*.

2. **Brand & Competitor Management (`/dashboard/brands`)**
   - Full CRUD operations: create, read, edit, and delete business entities.
   - Manage target country, primary language, industry sectors, and competitor sets.

3. **Prompt Intent Explorer (`/dashboard/prompts`)**
   - Automatically generate high-intent buyer questions using Gemini.
   - Filter and categorize prompts.
   - Inline prompt editing, activation toggles, and deletion.

4. **AI Visibility Engine (`/dashboard/visibility`)**
   - Execute batch monitoring runs against Gemini with Google Search Grounding enabled.
   - Inspect raw AI responses, extract mention context windows, and track competitor positions.
   - Safe batch execution limits (10 prompts per run) to protect API quotas.

5. **Competitor Intelligence (`/dashboard/competitors`)**
   - Benchmark citation rates, recommendation frequencies, and prompts where competitors dominate.
   - Compare head-to-head AI market share.

6. **Sources & Grounding Citations (`/dashboard/sources`)**
   - Inspect verified web URLs and publisher domains retrieved by Google Search Grounding.
   - Domain-level analysis showing which external publications drive brand citations.

7. **Generative Engine Optimization (GEO) Insights (`/dashboard/recommendations`)**
   - Actionable recommendations synthesized by Gemini from actual monitoring observations.
   - Filter by category (*Website Content*, *Brand Authority*, *Missing Information*, *Competitor Insights*, *Content Opportunities*) and priority (*High*, *Medium*, *Low*).
   - Track implementation status (`open`, `in_progress`, `applied`, `dismissed`).

---

## 🛠 Technology Stack

- **Framework**: Next.js App Router (React 19, TypeScript)
- **UI & Design**: Tailwind CSS, Lucide React icons, shadcn/ui-inspired primitives
- **Visual Analytics**: Recharts
- **Validation**: Zod
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Supabase Auth
- **AI Integration**: Official Google Gen AI SDK (`@google/genai`) with Google Search Grounding
- **Active Gemini Models**: `gemini-3.8-flash` (primary), `gemini-3.5-flash`, `gemini-3.1-flash-lite`

---

## 📁 Project Directory Structure

```
Mentionly/
├── docs/                                    # Technical documentation guides
│   ├── ENV_SETUP.md                         # Secrets & environment setup
│   ├── ARCHITECTURE.md                      # Architecture & analytical pipelines
│   ├── DATABASE.md                          # Schema definitions & RLS
│   ├── API.md                               # API endpoints & payloads
│   ├── TESTING.md                           # Automated test suite & QA
│   └── DEPLOYMENT.md                        # Vercel deployment guide
├── supabase/
│   └── migrations/
│       └── 20261106_mentionly_init.sql      # Supabase PostgreSQL schema migration
├── tests/
│   └── mentionly-suite.test.mjs             # 10-step automated integration test suite
├── src/
│   ├── app/
│   │   ├── page.tsx                         # Landing page with hero & CTAs
│   │   ├── login/page.tsx                   # Supabase Auth Login with Demo fallback
│   │   ├── signup/page.tsx                  # Supabase Auth Signup
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                   # Collapsible sidebar, header & mobile drawer
│   │   │   ├── page.tsx                     # Main Dashboard with KPI cards & Recharts
│   │   │   ├── brands/page.tsx              # Brand & Competitor CRUD management
│   │   │   ├── visibility/page.tsx          # Batch monitoring engine & prompt inspector
│   │   │   ├── prompts/page.tsx             # Prompt explorer with Gemini generation
│   │   │   ├── competitors/page.tsx         # Head-to-head competitor share table
│   │   │   ├── sources/page.tsx             # Discovered search grounding URLs & domains
│   │   │   ├── recommendations/page.tsx     # Gemini GEO recommendations & status tracking
│   │   │   └── settings/page.tsx            # API diagnostics & scoring methodology doc
│   │   └── api/                             # Server-side API Route Handlers
│   │       ├── health/                      # GET live Supabase & Gemini diagnostics
│   │       ├── brands/                      # GET, POST brands
│   │       │   └── [id]/                    # GET, PATCH, DELETE brand
│   │       ├── prompts/                     # GET, POST, PATCH, DELETE prompts
│   │       │   └── generate/                # POST Gemini automated prompt generator
│   │       ├── monitoring/                  # GET, POST monitoring runs
│   │       │   └── [id]/                    # GET run results & raw responses
│   │       ├── analytics/                   # GET aggregated dashboard metrics
│   │       ├── competitors/                 # GET competitor share metrics
│   │       ├── sources/                     # GET citation domains & URLs
│   │       └── recommendations/             # GET, PATCH, POST GEO recommendations
│   ├── components/
│   │   ├── ui/                              # Button, Card, Badge, Input, DisclaimerBanner
│   │   └── dashboard/                       # Sidebar, Header, KpiCard, EmptyState
│   └── lib/
│       ├── gemini.ts                        # Gen AI SDK client & Search Grounding
│       ├── analysis.ts                      # Mention, ranking & citation parser
│       ├── scoring.ts                       # AI Visibility Score formula (0-100)
│       ├── monitoring-engine.ts             # Batch runner with execution safety limits
│       ├── data-service.ts                  # Hybrid Supabase DB & local demo store
│       ├── store.ts                         # In-memory local fallback store
│       └── validations.ts                   # Zod request schemas
├── .env.example                             # Environment variable template
├── package.json                             # Dependencies & scripts
└── tsconfig.json                            # TypeScript configuration
```

---

## ⚡ Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/GarvitBohra/Mentionly.git
cd Mentionly
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate your Supabase and Gemini credentials in `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
GEMINI_API_KEY=<your-gemini-api-key>
```
*(If credentials are not supplied, Mentionly automatically runs in an in-memory demo fallback mode).*

### 3. Initialize Supabase Database
Execute `supabase/migrations/20261106_mentionly_init.sql` in your [Supabase SQL Editor](https://supabase.com/dashboard).

### 4. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Development & Quality Commands

```bash
# Run automated integration test suite (10 tests)
node --test tests/mentionly-suite.test.mjs

# Run TypeScript static analysis
npx tsc --noEmit

# Run ESLint check
npm run lint

# Compile optimized production build
npm run build
```

---

## 🚢 Deployment to Vercel

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`).
3. Deploy! Detailed instructions: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.
