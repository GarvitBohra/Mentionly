# Mentionly

See how often your brand and your competitors are mentioned in AI chat answers.

1. Add a brand: name, keyword people search (e.g. `burger`) and competitors.
2. OpenAI writes the search questions people ask about that keyword.
3. Mentionly asks an AI chat assistant (with web search) each question.
4. You see how many answers mention your brand and each competitor.

Next.js 15 + Supabase (auth and Postgres) + OpenAI.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the Supabase keys and `OPENAI_API_KEY`.
3. In the Supabase SQL Editor, run `supabase/schema.sql` (it replaces any old Mentionly tables).
4. `npm run dev`, open http://localhost:3000, sign up, add a brand.

If Supabase email confirmation is on, confirm the email before signing in (or turn it off for a demo).

## Code map

```
src/app/dashboard/page.tsx   the whole app UI (brand, prompts, results)
src/app/api/                 brands, prompts, run, results
src/lib/openai.ts            generatePrompts + askAI
src/lib/analysis.ts          countMentions
src/lib/data-service.ts      all Supabase reads/writes (scoped by user_id)
src/middleware.ts            session refresh, protects /dashboard
supabase/schema.sql          5 tables
```

`npm test` runs the unit tests, `npm run build` builds.
