# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mentionly is an AI Search Visibility (GEO) platform: it runs buyer-style prompts against Gemini with Google Search Grounding, then measures whether a brand is mentioned, recommended and cited. Next.js 15 App Router + React 19 + TypeScript + Tailwind, Supabase (Postgres/Auth), `@google/genai`. Detailed guides live in `docs/` (ARCHITECTURE, DATABASE, API, TESTING, DEPLOYMENT, ENV_SETUP).

## Commands

```bash
npm run dev            # dev server at http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit       # typecheck
npm test               # tsx --test on both test files
npx tsx --test tests/critical-fixes.test.mjs          # single file
npx tsx --test --test-name-pattern="Issue 2" tests/critical-fixes.test.mjs   # single test
```

- `tests/critical-fixes.test.mjs` is a unit suite that imports `src/lib/*.ts` directly (hence `tsx`; plain `node --test` can't load the `.ts` files).
- `tests/mentionly-suite.test.mjs` hits a live server (`TEST_BASE_URL`, default `http://localhost:3000`). Its tests silently skip network checks when the server isn't running, so a pass doesn't prove the API works. Start `npm run dev` first for real coverage.
- Env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`. The Supabase schema is `supabase/migrations/20261106_mentionly_init.sql` and is applied manually in the Supabase SQL editor.

## Architecture

Modular monolith: UI pages in `src/app/dashboard/*`, all business logic in route handlers under `src/app/api/*`, shared logic in `src/lib/`.

**Pipeline (the part that spans several files):**
`monitoring-engine.ts` (batch runner, max 10 prompts per run) → `gemini.ts` (`executeVisibilityQuery`, Search Grounding tool, model fallback chain `gemini-3.8-flash` → `gemini-3.5-flash` → `gemini-3.1-flash-lite`) → `analysis.ts` (brand/alias mention detection, 140-char context window, numbered-rank and "top pick" recommendation detection, competitor positions, grounding-chunk → citation mapping) → `scoring.ts` (composite 0–100: 40% mention rate, 35% recommendation rate, 15% position quality, 10% grounding rate). Prompts whose execution failed (timeouts, 429s) must be excluded from score calculations.

**Hybrid persistence (`data-service.ts` + `store.ts`):** API routes never query Supabase directly; they go through `data-service.ts`. It checks `checkSupabaseHealth()` (cached 30s). If Supabase is unconfigured or the tables are missing, it falls back to the in-memory `memoryStore`. The store lives on `globalThis` and is persisted to `.mentionly_state.json` in the project root, so local data survives restarts. Any new entity or field needs both a Supabase path and a `memoryStore` path.

**Auth and multi-tenancy (`auth.ts`):** Data is scoped by `organizationId` (resolved via `getOrCreateUserOrganization`). `getAuthenticatedUser` accepts a Bearer token or a cookie session, and otherwise **falls back to a demo user** (`demo@mentionly.ai`) so demo flows never get a 401. `src/middleware.ts` is a deliberate pass-through, so real protection happens in the route handlers. Tenant isolation is covered by `critical-fixes.test.mjs`. Keep every query org-scoped.

**Validation and limits:** Mutating routes validate with the Zod schemas in `src/lib/validations.ts`. Long AI routes (`/api/monitoring`, `/api/prompts/generate`, `/api/recommendations/generate`) export `maxDuration = 60` for Vercel.

Path alias `@/` maps to `src/`. Shared types are in `src/types/index.ts`.

## Notes

- `.env`, `.mentionly_state.json` and `../API_keys/` hold secrets or local data. Don't commit or echo them.
- Mentionly reports observations from the Gemini API only. UI copy uses `DisclaimerBanner` to say so; keep that framing.
