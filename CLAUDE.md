# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mentionly counts how often a brand and its competitors are mentioned in AI chat answers. The flow is: a user adds a brand (name, keyword, competitors) → AI generates search questions about the keyword → each question is asked to an AI with web search → the dashboard shows mention counts per brand. Next.js 15 (App Router) + React 19 + TypeScript + Tailwind, Supabase (auth + Postgres), OpenAI with Gemini as backup. The project was recently simplified to this MVP, so older references to scoring engines, monitoring runs, GEO recommendations or `memoryStore` no longer apply.

## Commands

```bash
npm run dev            # http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit       # typecheck
npm test               # tsx --test tests/critical-fixes.test.mjs
npx tsx --test --test-name-pattern="countMentions" tests/critical-fixes.test.mjs   # single test
```

Tests are pure unit tests that import `src/lib/*.ts` directly, so they need `tsx`, not plain `node --test`. Setup: copy `.env.example` to `.env` (Supabase keys, `OPENAI_API_KEY`, optional `GEMINI_API_KEY`), then run `supabase/schema.sql` in the Supabase SQL editor. **That script drops the old Mentionly tables and their data.**

## Architecture

- **UI:** essentially one page, `src/app/dashboard/page.tsx` (brand, prompts, results). `login`/`signup` share `src/components/auth-form.tsx`.
- **API routes** (`src/app/api/`): `brands`, `prompts` (+ `generate`), `run`, `results`. Each calls `getAuthenticatedUser(req)` and returns `unauthorizedResponse()` on null. There is no demo-user fallback any more.
- **`src/lib/data-service.ts`:** all Supabase reads and writes. Every query is scoped by `user_id`. Routes should not talk to Supabase directly.
- **`src/lib/ai.ts` (provider layer):** `generatePrompts` and `askAI`. OpenAI (Responses API with `web_search`) is tried first. If `OPENAI_API_KEY` is missing or the call fails, the same request is retried on Gemini (REST `generateContent`, Google Search grounding, falling back to a plain answer when search is refused). `availableProviders()` treats placeholder keys like `your_..._here` as unset. `formatAIError` turns provider errors into user-readable messages, and `askAI` errors are stored as-is in results.
- **`src/lib/analysis.ts`:** `countMentions` does case-insensitive, word-boundary matching that tolerates curly apostrophes.
- **`/api/run`:** takes up to 10 prompts (`MAX_PROMPTS`), asks them all in parallel with `Promise.all`, and saves one result per prompt, including per-prompt errors. It returns 502 only if every prompt failed. `maxDuration = 60` and the 40s per-question timeout in `ai.ts` are sized together for serverless hosts, so keep them consistent if you change either.
- **`src/middleware.ts`:** refreshes the Supabase session, redirects signed-out users from `/dashboard` to `/login`, and redirects signed-in users away from the landing, login and signup pages. It skips all checks when Supabase env vars are unset or placeholders. API routes enforce their own auth.
- **Schema:** `supabase/schema.sql` defines 5 tables (brands, competitors, prompts, runs, results). Path alias `@/` maps to `src/`.

## Notes

- `.env` holds secrets (gitignored). Don't commit or echo it. `.mentionly_state.json` is a gitignored leftover from the old in-memory store that the code no longer reads.
