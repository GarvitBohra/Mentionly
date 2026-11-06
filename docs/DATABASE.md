# Database Schema & Supabase Documentation

This document describes the PostgreSQL database schema, table relationships, performance indexes, and Row Level Security (RLS) policies implemented for **Mentionly**.

The migration file is located at:
[`supabase/migrations/20261106_mentionly_init.sql`](file:///d:/Project/Google_Buildathon_Project/Mentionly/supabase/migrations/20261106_mentionly_init.sql)

---

## 1. Schema ERD & Table Overview

Mentionly organizes data around multi-tenant **Organizations** and **Brands**:

```
profiles (auth.users)
   │
   ├──< organization_members >── organizations
                                       │
                                       └──< brands
                                              ├──< competitors
                                              ├──< prompts
                                              ├──< monitoring_runs
                                              │        └──< monitoring_results
                                              │                 └──< citations
                                              └──< geo_recommendations
```

---

## 2. Table Definitions

### 1. `profiles`
Stores extended user profile information linked to Supabase Auth.
- `id` (UUID, Primary Key, references `auth.users(id) ON DELETE CASCADE`)
- `email` (TEXT, NOT NULL)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW())

### 2. `organizations`
Tenant boundary for multi-user collaboration.
- `id` (UUID, Primary Key, DEFAULT `uuid_generate_v4()`)
- `name` (TEXT, NOT NULL)
- `slug` (TEXT, UNIQUE, NOT NULL)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3. `organization_members`
Junction table linking users to organizations with role-based permissions.
- `id` (UUID, Primary Key)
- `organization_id` (UUID, references `organizations(id) ON DELETE CASCADE`)
- `user_id` (UUID, references `profiles(id) ON DELETE CASCADE`)
- `role` (TEXT, CHECK `role IN ('owner', 'admin', 'member')`)
- `UNIQUE (organization_id, user_id)`

### 4. `brands`
Business entities being tracked for AI search visibility.
- `id` (UUID, Primary Key)
- `organization_id` (UUID, references `organizations(id) ON DELETE CASCADE`)
- `name` (TEXT, NOT NULL)
- `website` (TEXT, NOT NULL)
- `industry` (TEXT, NOT NULL)
- `country` (TEXT, DEFAULT 'Global')
- `language` (TEXT, DEFAULT 'English')
- `description` (TEXT)
- `is_default` (BOOLEAN, DEFAULT false)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 5. `competitors`
Direct market competitors monitored against the primary brand.
- `id` (UUID, Primary Key)
- `brand_id` (UUID, references `brands(id) ON DELETE CASCADE`)
- `name` (TEXT, NOT NULL)
- `website` (TEXT)
- `created_at` (TIMESTAMPTZ)

### 6. `prompts`
Customer-intent search queries benchmarked against AI models.
- `id` (UUID, Primary Key)
- `brand_id` (UUID, references `brands(id) ON DELETE CASCADE`)
- `query_text` (TEXT, NOT NULL)
- `category` (TEXT, CHECK `category IN ('Discovery', 'Recommendation', 'Comparison', 'Purchase Intent', 'Problem Solving')`)
- `is_active` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 7. `monitoring_runs`
Execution batches representing a snapshot in time.
- `id` (UUID, Primary Key)
- `brand_id` (UUID, references `brands(id) ON DELETE CASCADE`)
- `status` (TEXT, CHECK `status IN ('pending', 'running', 'completed', 'failed')`)
- `total_prompts` (INT, DEFAULT 0)
- `completed_prompts` (INT, DEFAULT 0)
- `visibility_score` (NUMERIC(5,2), DEFAULT 0)
- `brand_mention_rate` (NUMERIC(5,2), DEFAULT 0)
- `competitor_mention_rate` (NUMERIC(5,2), DEFAULT 0)
- `recommendation_rate` (NUMERIC(5,2), DEFAULT 0)
- `error_message` (TEXT)
- `started_at`, `completed_at`, `created_at` (TIMESTAMPTZ)

### 8. `monitoring_results`
Individual prompt observation results within a monitoring run.
- `id` (UUID, Primary Key)
- `run_id` (UUID, references `monitoring_runs(id) ON DELETE CASCADE`)
- `prompt_id` (UUID, references `prompts(id) ON DELETE SET NULL`)
- `prompt_query` (TEXT, NOT NULL)
- `prompt_category` (TEXT, NOT NULL)
- `raw_response` (TEXT) - Original unprocessed model response
- `brand_mentioned` (BOOLEAN, DEFAULT false)
- `brand_recommended` (BOOLEAN, DEFAULT false)
- `brand_position` (INT) - Rank in recommendation lists
- `mention_context` (TEXT) - Extracted 140-char excerpt
- `competitors_mentioned` (JSONB, DEFAULT '[]'::jsonb)
- `has_grounding` (BOOLEAN, DEFAULT false)
- `error` (TEXT) - Recorded error if execution failed
- `created_at` (TIMESTAMPTZ)

### 9. `citations`
Discovered web URLs and publisher domains retrieved by Google Search Grounding.
- `id` (UUID, Primary Key)
- `monitoring_result_id` (UUID, references `monitoring_results(id) ON DELETE CASCADE`)
- `brand_id` (UUID, references `brands(id) ON DELETE CASCADE`)
- `title` (TEXT)
- `url` (TEXT, NOT NULL)
- `domain` (TEXT, NOT NULL)
- `snippet` (TEXT)
- `associated_prompt` (TEXT)
- `mentions_brand` (BOOLEAN, DEFAULT false)
- `created_at` (TIMESTAMPTZ)

### 10. `geo_recommendations`
Actionable Generative Engine Optimization suggestions synthesized by Gemini.
- `id` (UUID, Primary Key)
- `brand_id` (UUID, references `brands(id) ON DELETE CASCADE`)
- `run_id` (UUID, references `monitoring_runs(id) ON DELETE SET NULL`)
- `title` (TEXT, NOT NULL)
- `category` (TEXT, CHECK `category IN ('Website Content', 'Brand Authority', 'Missing Information', 'Competitor Insights', 'Content Opportunities')`)
- `explanation` (TEXT, NOT NULL)
- `evidence` (TEXT, NOT NULL)
- `suggested_action` (TEXT, NOT NULL)
- `priority` (TEXT, DEFAULT 'Medium', CHECK `priority IN ('High', 'Medium', 'Low')`)
- `status` (TEXT, DEFAULT 'open', CHECK `status IN ('open', 'in_progress', 'applied', 'dismissed')`)
- `related_prompt` (TEXT)
- `related_source` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

## 3. Indexes

Indexes are established for frequent query filters and foreign key lookups:
```sql
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_brands_org ON public.brands(organization_id);
CREATE INDEX idx_competitors_brand ON public.competitors(brand_id);
CREATE INDEX idx_prompts_brand ON public.prompts(brand_id);
CREATE INDEX idx_prompts_active ON public.prompts(brand_id, is_active);
CREATE INDEX idx_runs_brand ON public.monitoring_runs(brand_id);
CREATE INDEX idx_runs_status ON public.monitoring_runs(status);
CREATE INDEX idx_results_run ON public.monitoring_results(run_id);
CREATE INDEX idx_citations_brand ON public.citations(brand_id);
CREATE INDEX idx_citations_result ON public.citations(monitoring_result_id);
CREATE INDEX idx_geo_recs_brand ON public.geo_recommendations(brand_id);
```

---

## 4. Row Level Security (RLS) Policies

All 10 tables have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`). Security policies verify tenant membership using security definer functions:

- `public.is_org_member(org_id UUID)`: Verifies that `auth.uid()` belongs to the organization.
- `public.is_brand_member(b_id UUID)`: Joins `brands` to `organization_members` to verify that `auth.uid()` has access to the brand.

Users can only query, insert, or modify data belonging to organizations they belong to.

---

## 5. Migration Instructions

To apply the schema to your Supabase project:
1. Log in to [Supabase](https://supabase.com/dashboard) and navigate to your project.
2. Select **SQL Editor** from the left navigation bar.
3. Click **New query**.
4. Open [`supabase/migrations/20261106_mentionly_init.sql`](file:///d:/Project/Google_Buildathon_Project/Mentionly/supabase/migrations/20261106_mentionly_init.sql) in your code editor, copy all lines, and paste into the query window.
5. Click **Run**.
6. Navigate to **Table Editor** to confirm all 10 tables appear.

