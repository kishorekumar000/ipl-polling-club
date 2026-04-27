# IPL Polling Website

This workspace powers a private IPL polling website for a friend group. It is
now organized around a shared website experience rather than a mobile-app-first
distribution flow.

## What The Website Does

- lets users create a profile with a unique name and favorite team
- themes the UI around the user's favorite IPL team
- shows realistic daily match polls and vote lock deadlines
- keeps a shared settlement ledger with carry-forward remainder logic
- gives one super admin final control, with optional supporting admins
- supports optional browser notifications for poll and result activity

The website should not handle direct money collection or payouts inside the
product. Keep any real-world transfers outside the platform.

## Current Architecture

- `apps/web`: Next.js website UI
- `apps/api`: Express shared-state API
- `packages/db`: earlier Prisma workspace, reserved for future database work

Today the shared website data is persisted as a JSON file by the API so multiple
users can see the same polls, votes, and settlements.

For free public hosting, the website can also use Supabase-backed shared state
through the built-in Next.js route at `/api/shared-state`.

## Local Development

Install dependencies once:

```powershell
npm.cmd install
```

Run both services in separate terminals:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

Website:

- `http://localhost:3000`

Shared API:

- `http://localhost:4000`

## Product Guardrails

- Use this only for a private group.
- Treat settlement inside the website as a virtual ledger.
- Do not expose payment integration inside the product.

## Next Recommended Upgrade

The next major production upgrade is replacing the JSON shared state with a real
database-backed auth and storage layer.

## Free Public Deployment

If you want a free public website instead of running PowerShell on your laptop,
use:

- Vercel for the website
- Supabase for shared state

Setup docs:

- [docs/deploy-free-website.md](/C:/Users/Lenovo/OneDrive/Desktop/ipl-betting/docs/deploy-free-website.md)
- [docs/supabase-schema.sql](/C:/Users/Lenovo/OneDrive/Desktop/ipl-betting/docs/supabase-schema.sql)

See [docs/build-setup.md](/C:/Users/Lenovo/OneDrive/Desktop/ipl-betting/docs/build-setup.md) for the original system design and [docs/website-setup.md](/C:/Users/Lenovo/OneDrive/Desktop/ipl-betting/docs/website-setup.md) for the current website-first workflow.
