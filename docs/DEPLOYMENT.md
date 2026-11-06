# Production Deployment Guide (Vercel & Supabase)

This guide provides step-by-step instructions for deploying **Mentionly** to Vercel and configuring production cloud services.

---

## 1. Prerequisites
- A GitHub account with access to [https://github.com/GarvitBohra/Mentionly](https://github.com/GarvitBohra/Mentionly).
- A [Vercel](https://vercel.com) account.
- A [Supabase](https://supabase.com) project.
- A [Google AI Studio](https://aistudio.google.com/app/apikey) Gemini API Key.

---

## 2. Supabase Production Database Setup

1. Log in to [Supabase](https://supabase.com/dashboard) and open your project.
2. Open the **SQL Editor** from the left-hand navigation.
3. Paste the contents of [`supabase/migrations/20261106_mentionly_init.sql`](file:///d:/Project/Google_Buildathon_Project/Mentionly/supabase/migrations/20261106_mentionly_init.sql) and click **Run**.
4. Confirm in the **Table Editor** that 10 tables are created:
   `profiles`, `organizations`, `organization_members`, `brands`, `competitors`, `prompts`, `monitoring_runs`, `monitoring_results`, `citations`, `geo_recommendations`.
5. Under **Project Settings** > **API**, retrieve:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

---

## 3. Vercel Deployment Setup

1. Log in to [Vercel](https://vercel.com) and click **"Add New..."** > **Project**.
2. Select the GitHub repository: `GarvitBohra/Mentionly`.
3. In the **Configure Project** screen:
   - **Framework Preset**: Next.js (automatically detected)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Expand **Environment Variables** and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   GEMINI_API_KEY=<your-google-gemini-api-key>
   ```
5. Click **Deploy**.

---

## 4. Post-Deployment Production Verification

After deployment completes, perform the following verification checks on your live production URL:

1. **Health Diagnostic Check**:
   Visit `https://<your-vercel-domain>/api/health`. Confirm that `supabase.tablesExist` is `true` and `gemini.isConfigured` is `true`.
2. **Landing Page Load**:
   Confirm that `https://<your-vercel-domain>/` loads with styling and functional links.
3. **Brand Creation**:
   Navigate to `/dashboard/brands` and create a brand. Verify it appears in your Supabase `brands` table.
4. **AI Visibility Run**:
   Navigate to `/dashboard/visibility`, select a prompt, and click **"Run AI Check"**. Verify that the run completes and generates grounding sources.

---

## 5. Rollback Procedure

If a breaking deployment occurs on Vercel:

1. Open your Vercel Project Dashboard.
2. Navigate to the **Deployments** tab.
3. Locate the previous successful deployment.
4. Click the three dots (`...`) icon on the right side of the deployment row and select **"Promote to Production"**.
5. Vercel will instantaneously route production traffic back to the previous deployment build with zero downtime.
