# Environment Setup & Secrets Configuration

This guide details how to configure environment variables for **Mentionly** across local development and production deployment on Vercel.

---

## 1. Required Environment Variables

Mentionly relies on four primary environment variables:

| Variable Name | Required | Target / Scope | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client & Server | The public HTTPS URL of your Supabase project (e.g., `https://xyzcompany.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client & Server | The public anonymous API key for Supabase client-side authentication and public requests. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server Only | The elevated administrative service role secret key used by backend API routes for database queries and bypassing RLS when operating system workflows. |
| `GEMINI_API_KEY` | **Yes** | Server Only | The Google AI Studio Gemini API key used for executing visibility search prompts, Google Search Grounding queries, and GEO recommendation synthesis. |

> ⚠️ **Security Notice:** `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` must **never** be prefixed with `NEXT_PUBLIC_` and must never be exposed or imported in client-side components (`"use client"`).

---

## 2. Google Gemini API Configuration

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create or select a Google Cloud project.
3. Click **"Create API Key"** and copy the generated key string.
4. Supported active models configured in Mentionly:
   - Primary: `gemini-3.8-flash`
   - Secondary: `gemini-3.5-flash`
   - Fallback: `gemini-3.1-flash-lite`
5. Ensure your API key has Google Search Grounding permissions enabled (enabled by default on current Gemini developer tier projects).

---

## 3. Supabase Configuration

1. Visit the [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Under **Project Settings** > **API**:
   - Copy the **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
   - Copy the **`anon` `public` key** into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Copy the **`service_role` `secret` key** into `SUPABASE_SERVICE_ROLE_KEY`.
3. Under **Authentication** > **Providers**:
   - Ensure **Email** auth is enabled.
   - For frictionless local development, you may disable "Confirm email" under Auth Settings so test accounts can sign in immediately without email delivery confirmation.
4. Under **SQL Editor**:
   - Execute the schema migration script located in `supabase/migrations/20261106_mentionly_init.sql`.

---

## 4. Local Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in your editor and populate your keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   GEMINI_API_KEY=<your-gemini-key>
   ```
3. **Note on `.env.local` vs `.env`**:
   - Next.js assigns higher priority to `.env.local` than `.env`.
   - If you populate `.env`, ensure `.env.local` does not contain stale or placeholder credentials.
   - Both `.env` and `.env*.local` are explicitly listed in `.gitignore` to prevent accidental credential commits.

---

## 5. Vercel Production Environment Configuration

When deploying Mentionly to Vercel:

1. Navigate to your project dashboard on Vercel: **Settings** > **Environment Variables**.
2. Add each variable individually:
   - `NEXT_PUBLIC_SUPABASE_URL` (Check: *Production*, *Preview*, *Development*)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Check: *Production*, *Preview*, *Development*)
   - `SUPABASE_SERVICE_ROLE_KEY` (Check: *Production*, *Preview*, *Development*)
   - `GEMINI_API_KEY` (Check: *Production*, *Preview*, *Development*)
3. Click **Save** and trigger a redeployment.

---

## 6. Zero-Friction Fallback (Offline / Pre-Key Mode)

Mentionly contains an automated memory fallback store (`src/lib/store.ts`). If API credentials are not yet configured or are invalid:
- The platform automatically operates in **Demo Mode**, displaying sample brands and pre-calculated baseline runs.
- The UI clearly displays a **DEMO DATA** badge to prevent confusion.
- Once valid keys are populated in `.env` and tables exist in Supabase, the application seamlessly switches to live database and Gemini queries.

