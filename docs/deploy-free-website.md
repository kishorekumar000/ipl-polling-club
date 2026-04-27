# Free Website Deployment

This is the fastest free hosting path for the current IPL polling website:

- host the Next.js website on Vercel
- store shared club state in Supabase
- stop relying on the separate always-on local API for public usage

## What changes in this setup

When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured, the website's
`/api/shared-state` route reads and writes the club state directly from Supabase.

That means:

- the public website only needs the Next.js deployment
- users can access it from one permanent web link
- you do not need to keep PowerShell running on your laptop

## 1. Create a Supabase project

Create a free Supabase project, then copy:

- `Project URL`
- `service_role` key

Run the SQL in [docs/supabase-schema.sql](/C:/Users/Lenovo/OneDrive/Desktop/ipl-betting/docs/supabase-schema.sql)
inside the Supabase SQL editor.

## 2. Deploy the website on Vercel

Import this GitHub repository into Vercel.

Framework:

- Next.js

Root directory:

- `apps/web`

Install command:

```text
npm install
```

Build command:

```text
npm run build --workspace @ipl/web
```

## 3. Add Vercel environment variables

Add these in the Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STATE_TABLE=club_state`
- `STATE_ROW_ID=main`

Optional:

- `NEXT_PUBLIC_APP_NAME=IPL Polling Club`

## 4. Redeploy

After saving the environment variables, redeploy once.

Then the public Vercel URL becomes your shared website link.

## Local development

You can still keep the current local mode too:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

That local mode uses the Express API fallback instead of Supabase.

## Important limits of the free path

- it is a good friend-group deployment path, not a guaranteed enterprise-grade setup
- Vercel and Supabase free tiers have usage and inactivity limits
- if you outgrow free usage later, you should move to a paid production setup
