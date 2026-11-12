-- Mentionly schema (simplified MVP). Run once in the Supabase SQL Editor.
-- WARNING: drops the previous Mentionly tables, including any data in them.

DROP TABLE IF EXISTS public.citations, public.geo_recommendations, public.monitoring_results,
  public.monitoring_runs, public.organization_members, public.organizations, public.profiles,
  public.results, public.runs, public.prompts, public.competitors, public.brands CASCADE;
DROP FUNCTION IF EXISTS public.is_org_member(uuid), public.is_brand_member(uuid);

CREATE TABLE public.brands (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  keyword    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.competitors (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name     TEXT NOT NULL
);

CREATE TABLE public.prompts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.runs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id   UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  prompt_query      TEXT NOT NULL,
  answer            TEXT,
  brand_count       INT NOT NULL DEFAULT 0,
  competitor_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  error             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brands_user ON public.brands(user_id);
CREATE INDEX idx_competitors_brand ON public.competitors(brand_id);
CREATE INDEX idx_prompts_brand ON public.prompts(brand_id);
CREATE INDEX idx_runs_brand ON public.runs(brand_id, created_at DESC);
CREATE INDEX idx_results_run ON public.results(run_id);

-- The server uses the service-role key and checks brands.user_id in code.
-- RLS with no policies blocks all direct access from the browser (anon key).
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
