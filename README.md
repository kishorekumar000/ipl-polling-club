# IPL Polling Platform

This workspace is set up for a private IPL prediction platform for a closed friend group.

The app should handle:

- invite-only users
- admin-controlled match lifecycle
- automatic poll creation and locking
- favorite-team onboarding
- virtual settlement calculation with carried remainder

The app should not handle direct money collection or payouts inside the platform. Keep any real-world transfers outside the product.

## Recommended Stack

- `apps/web`: Next.js + TypeScript + Tailwind
- `apps/api`: Express + TypeScript + Prisma
- `packages/db`: Prisma schema and shared database client
- PostgreSQL: source of truth
- Redis: scheduling and background jobs

## Why This Setup

- PostgreSQL fits your data model better than MongoDB because votes, matches, settlements, and carry-forward balances are relational.
- A separate API keeps admin workflows, cron jobs, and result settlement logic isolated from UI code.
- Redis-backed jobs are safer than plain cron when process restarts matter.

## Product Guardrails

- Use this only for a private group.
- Treat settlement inside the app as a virtual ledger.
- Do not expose public signup or payment integration.

## Folders

- `apps/web`: landing, onboarding, poll, settlements, admin UI
- `apps/api`: auth, polling, admin, scheduler, settlement APIs
- `packages/db`: Prisma schema
- `docs`: product and system setup notes

## First Build Phases

1. Build auth, onboarding, manual match creation, voting, and settlement logic.
2. Add automatic match import and scheduled poll creation.
3. Add title generation, richer IPL visuals, and admin analytics.

See [docs/build-setup.md](/C:/Users/Lenovo/OneDrive/Desktop/ipl-betting/docs/build-setup.md) for the full system design.
