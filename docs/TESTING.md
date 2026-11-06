# Testing Guide & Quality Assurance

This document details test execution commands, automated test suites, manual verification procedures, and known MVP limitations for **Mentionly**.

---

## 1. Automated Test Commands

Mentionly incorporates a native Node.js test suite with zero extra third-party test dependencies:

| Task | Command | Description |
| :--- | :--- | :--- |
| **Run Integration Suite** | `node --test tests/mentionly-suite.test.mjs` | Executes 10 end-to-end integration tests against the live API. |
| **TypeScript Typecheck** | `npx tsc --noEmit` | Validates static types across all app and lib files. |
| **ESLint Audit** | `npm run lint` | Verifies Next.js and React code quality and syntax rules. |
| **Production Build Test**| `npm run build` | Compiles an optimized Next.js production build for all 24 routes. |

---

## 2. Automated Integration Suite (`tests/mentionly-suite.test.mjs`)

The test suite covers the complete user lifecycle:

1. **Landing Page Verification**: Confirms `GET /` returns `200 OK` with hero headline and brand positioning.
2. **Health Check Diagnostics**: Verifies `GET /api/health` reports status for Supabase and Gemini.
3. **Brand CRUD Lifecycle**: Tests brand creation (`POST /api/brands`), updating (`PATCH /api/brands/[id]`), and deletion (`DELETE /api/brands/[id]`).
4. **Input Validation Integrity**: Confirms invalid brand payloads return `400 Bad Request` with descriptive Zod error messages.
5. **Prompt Management**: Verifies prompt creation, text editing, category updating, and active status toggling.
6. **Gemini Prompt Generation**: Tests `POST /api/prompts/generate` to ensure structured JSON queries are returned.
7. **Analytics API Integrity**: Confirms `GET /api/analytics` returns numeric KPI values, score trends, and competitor lists.
8. **Competitor Intelligence**: Verifies `GET /api/competitors` returns dynamic target brand mention rates and competitor breakdowns.
9. **Sources & Grounding Citations**: Checks domain aggregation in `GET /api/sources`.
10. **GEO Recommendations Lifecycle**: Tests recommendation retrieval and status mutation (`open` $\to$ `in_progress`).

---

## 3. Manual Test Procedures

### Procedure A: AI Visibility Check Execution
1. Navigate to `/dashboard/visibility`.
2. Check 3 to 5 active prompts.
3. Click **"Run AI Check"**.
4. Confirm:
   - Progress bar displays and animates.
   - Run card displays updated Visibility Score.
   - Expanding a prompt card displays the **Original AI Observation Text** from Gemini and citations.

### Procedure B: Brand Onboarding
1. Navigate to `/dashboard/brands`.
2. Click **"Add Brand"**.
3. Input valid URL, name, industry, and at least one competitor.
4. Click **"Save Brand"**.
5. Confirm the brand card renders immediately and is selectable in the header dropdown.

### Procedure C: Responsive Mobile Navigation
1. Open Chrome DevTools (`F12`) and toggle Mobile Device Emulation (iPhone 14 / Pixel 7).
2. Click the hamburger menu icon in the top header.
3. Verify the mobile drawer slides out with all 8 navigation links.
4. Tap any link to verify page transition and drawer auto-dismissal.

---

## 4. Known MVP Limitations & Edge Cases

1. **Gemini Free-Tier Rate Limits (HTTP 429)**
   - When using a free Google AI Studio key, high-frequency prompt executions may encounter rate limits (`429 Quota Exceeded`).
   - Mentionly safely caps runs to 10 prompts per batch and captures 429 errors gracefully without crashing or faking data.
2. **Postgres Migration Requirement**
   - Supabase PostgREST requires tables to exist before queries can succeed. Until `supabase/migrations/20261106_mentionly_init.sql` is run in the Supabase SQL Editor, the system operates in resilient in-memory fallback mode.
3. **Grounding Citation Availability**
   - Google Search Grounding availability depends on prompt specificity. General philosophical questions may not trigger grounding search chunks; customer-intent and commercial comparison questions trigger grounding citations reliably.
