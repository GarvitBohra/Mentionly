# Mentionly — AI Search Visibility Platform

> **Know when AI talks about your brand.**  
> Monitor your brand visibility across AI-generated answers, understand your competitors, and discover the sources shaping AI recommendations.

---

## 🚀 Overview

**Mentionly** is an AI Search Visibility and Generative Engine Optimization (GEO) platform that helps businesses understand how their brand appears in AI-generated search responses.

When customers ask conversational search engines (such as Google Gemini) for vendor recommendations, comparison analyses, and solution evaluations, AI models decide which brands to cite, which to recommend, and which to omit. Mentionly turns black-box AI responses into transparent, quantifiable metrics and empirical grounding citations.

> **Important Notice:** Mentionly measures empirical AI visibility from Gemini API observations with Google Search Grounding. It does not guarantee that brands will appear in end-user consumer AI responses.

---

## 🛠 Tech Stack

- **Frontend & App Framework**: Next.js App Router (React 19, TypeScript)
- **UI & Styling**: Tailwind CSS, Lucide React icons, shadcn/ui styling conventions
- **Theme**: Premium dark mode (deep charcoal background, subtle borders, glowing accent highlights)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) & Supabase Auth
- **AI Integration**: Official Google Gen AI SDK (`@google/genai`) with Google Search Grounding
- **Visual Analytics**: Recharts
- **Validation**: Zod
- **Architecture**: Modular monolith with server-side API routes

---

## 🌟 Key Features

1. **Brand & Competitor Management (`/dashboard/brands`)**
   - Manage business profiles, target regions, industries, and direct competitors.
   - Set primary brand context for continuous monitoring.

2. **AI Search Prompt Explorer (`/dashboard/prompts`)**
   - Automatically generate high-intent search questions using Gemini.
   - Categorize by *Discovery*, *Recommendation*, *Comparison*, *Purchase Intent*, and *Problem Solving*.
   - Activate/deactivate prompts for fine-grained monitoring.

3. **AI Visibility Engine (`/dashboard/visibility`)**
   - Execute batch monitoring runs against Gemini with Google Search Grounding enabled.
   - Extract raw AI responses, evaluate brand citations, analyze competitor appearances, and track positions.
   - View detailed inspection logs and historical runs.

4. **Executive Dashboard (`/dashboard`)**
   - **AI Visibility Score (0-100)**: Composite index based on mentions, recommendations, list rankings, and grounding presence.
   - **Trend Visualizations**: Historical score progression across runs.
   - **Head-to-Head Comparison**: Target brand vs. competitors bar charts.
   - **Prompt Intent Breakdown**: Category-level visibility performance.

5. **Competitor Intelligence (`/dashboard/competitors`)**
   - Benchmark citation rates and top-pick recommendation dominance.
   - Discover which queries favor competitors and where your brand was omitted.

6. **Sources & Grounding Citations (`/dashboard/sources`)**
   - Inspect verified web URLs and publisher domains retrieved by Google Search Grounding.
   - Domain-level analysis of which publications drive brand citations.

7. **Generative Engine Optimization (GEO) Recommendations (`/dashboard/recommendations`)**
   - Actionable recommendations synthesized by Gemini from actual monitoring observations.
   - Categorized by *Website Content*, *Brand Authority*, *Missing Information*, *Competitor Insights*, and *Content Opportunities*.

---

## 📐 AI Visibility Scoring Methodology

The **Mentionly AI Visibility Score** is a weighted composite index from 0 to 100:

| Factor | Weight | Description |
| :--- | :---: | :--- |
| **Brand Mention Rate** | **40%** | Proportion of successful search queries where the brand is explicitly cited. |
| **Recommendation Rate** | **35%** | Proportion of responses where the brand is recommended or positioned as a top choice. |
| **Ranking Position Quality** | **15%** | Bonus weighting when the brand appears early (#1 to #3) in comparison lists. |
| **Search Grounding Verification** | **10%** | Verification that answers were grounded with live Google Search chunks. |

*Failed queries are excluded from calculations to avoid skewing negative rates.*

---

## ⚙️ Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/mentionly.git
cd mentionly
npm install
```

### 2. Configure Environment Variables
Create `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your API credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

> **Zero Friction Local Evaluation:** Mentionly includes an intelligent local fallback store. If Supabase or Gemini API keys are omitted during initial setup, the platform automatically provides realistic demonstration data and simulated monitoring runs so you can explore the complete application immediately!

### 3. Initialize Supabase PostgreSQL Database
Run the SQL migration script located at:
```
supabase/migrations/20261106_mentionly_init.sql
```
in your Supabase SQL Editor to set up all tables, foreign keys, indexes, and Row Level Security policies.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚢 Deployment (Vercel)

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add the environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
4. Deploy!

