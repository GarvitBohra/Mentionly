-- Mentionly AI Search Visibility Platform Schema
-- Supabase PostgreSQL Migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 3. ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE (organization_id, user_id)
);

-- 4. BRANDS
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website TEXT NOT NULL,
    industry TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'Global',
    language TEXT NOT NULL DEFAULT 'English',
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. COMPETITORS
CREATE TABLE IF NOT EXISTS public.competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. PROMPTS
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Discovery' CHECK (category IN ('Discovery', 'Recommendation', 'Comparison', 'Purchase Intent', 'Problem Solving')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. MONITORING RUNS
CREATE TABLE IF NOT EXISTS public.monitoring_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    total_prompts INT DEFAULT 0,
    completed_prompts INT DEFAULT 0,
    visibility_score NUMERIC(5,2) DEFAULT 0,
    brand_mention_rate NUMERIC(5,2) DEFAULT 0,
    competitor_mention_rate NUMERIC(5,2) DEFAULT 0,
    recommendation_rate NUMERIC(5,2) DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 8. MONITORING RESULTS
CREATE TABLE IF NOT EXISTS public.monitoring_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES public.monitoring_runs(id) ON DELETE CASCADE,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE SET NULL,
    prompt_query TEXT NOT NULL,
    prompt_category TEXT NOT NULL,
    raw_response TEXT,
    brand_mentioned BOOLEAN DEFAULT false,
    brand_recommended BOOLEAN DEFAULT false,
    brand_position INT,
    mention_context TEXT,
    competitors_mentioned JSONB DEFAULT '[]'::jsonb,
    has_grounding BOOLEAN DEFAULT false,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 9. CITATIONS & SOURCES
CREATE TABLE IF NOT EXISTS public.citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoring_result_id UUID NOT NULL REFERENCES public.monitoring_results(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    title TEXT,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    snippet TEXT,
    associated_prompt TEXT,
    mentions_brand BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 10. GEO RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.geo_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.monitoring_runs(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Website Content', 'Brand Authority', 'Missing Information', 'Competitor Insights', 'Content Opportunities')),
    explanation TEXT NOT NULL,
    evidence TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'applied', 'dismissed')),
    related_prompt TEXT,
    related_source TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_brands_org ON public.brands(organization_id);
CREATE INDEX IF NOT EXISTS idx_competitors_brand ON public.competitors(brand_id);
CREATE INDEX IF NOT EXISTS idx_prompts_brand ON public.prompts(brand_id);
CREATE INDEX IF NOT EXISTS idx_prompts_active ON public.prompts(brand_id, is_active);
CREATE INDEX IF NOT EXISTS idx_runs_brand ON public.monitoring_runs(brand_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON public.monitoring_runs(status);
CREATE INDEX IF NOT EXISTS idx_results_run ON public.monitoring_results(run_id);
CREATE INDEX IF NOT EXISTS idx_citations_brand ON public.citations(brand_id);
CREATE INDEX IF NOT EXISTS idx_citations_result ON public.citations(monitoring_result_id);
CREATE INDEX IF NOT EXISTS idx_geo_recs_brand ON public.geo_recommendations(brand_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geo_recommendations ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check brand membership
CREATE OR REPLACE FUNCTION public.is_brand_member(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.brands b
        JOIN public.organization_members om ON om.organization_id = b.organization_id
        WHERE b.id = b_id AND om.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations: Members can view their orgs
CREATE POLICY "Members view orgs" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Authenticated users can create orgs" ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Organization Members: Members can view team
CREATE POLICY "Members view org members" ON public.organization_members FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Users can join or create membership" ON public.organization_members FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_org_member(organization_id));

-- Brands: Org members can read, create, update, delete
CREATE POLICY "Org members select brands" ON public.brands FOR SELECT USING (public.is_org_member(organization_id));
CREATE POLICY "Org members insert brands" ON public.brands FOR INSERT WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY "Org members update brands" ON public.brands FOR UPDATE USING (public.is_org_member(organization_id));
CREATE POLICY "Org members delete brands" ON public.brands FOR DELETE USING (public.is_org_member(organization_id));

-- Competitors: Brand members can read/write
CREATE POLICY "Brand members select competitors" ON public.competitors FOR SELECT USING (public.is_brand_member(brand_id));
CREATE POLICY "Brand members insert competitors" ON public.competitors FOR INSERT WITH CHECK (public.is_brand_member(brand_id));
CREATE POLICY "Brand members delete competitors" ON public.competitors FOR DELETE USING (public.is_brand_member(brand_id));

-- Prompts: Brand members can read/write
CREATE POLICY "Brand members select prompts" ON public.prompts FOR SELECT USING (public.is_brand_member(brand_id));
CREATE POLICY "Brand members insert prompts" ON public.prompts FOR INSERT WITH CHECK (public.is_brand_member(brand_id));
CREATE POLICY "Brand members update prompts" ON public.prompts FOR UPDATE USING (public.is_brand_member(brand_id));
CREATE POLICY "Brand members delete prompts" ON public.prompts FOR DELETE USING (public.is_brand_member(brand_id));

-- Monitoring Runs
CREATE POLICY "Brand members select runs" ON public.monitoring_runs FOR SELECT USING (public.is_brand_member(brand_id));
CREATE POLICY "Brand members insert runs" ON public.monitoring_runs FOR INSERT WITH CHECK (public.is_brand_member(brand_id));
CREATE POLICY "Brand members update runs" ON public.monitoring_runs FOR UPDATE USING (public.is_brand_member(brand_id));

-- Monitoring Results
CREATE POLICY "Members select results" ON public.monitoring_results FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.monitoring_runs r
        WHERE r.id = run_id AND public.is_brand_member(r.brand_id)
    )
);
CREATE POLICY "Members insert results" ON public.monitoring_results FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.monitoring_runs r
        WHERE r.id = run_id AND public.is_brand_member(r.brand_id)
    )
);

-- Citations
CREATE POLICY "Brand members select citations" ON public.citations FOR SELECT USING (public.is_brand_member(brand_id));
CREATE POLICY "Brand members insert citations" ON public.citations FOR INSERT WITH CHECK (public.is_brand_member(brand_id));

-- GEO Recommendations
CREATE POLICY "Brand members select recs" ON public.geo_recommendations FOR SELECT USING (public.is_brand_member(brand_id));
CREATE POLICY "Brand members insert recs" ON public.geo_recommendations FOR INSERT WITH CHECK (public.is_brand_member(brand_id));
CREATE POLICY "Brand members update recs" ON public.geo_recommendations FOR UPDATE USING (public.is_brand_member(brand_id));

