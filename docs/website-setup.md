# Shareable Website Setup

This project now runs best as a shared IPL polling website.

## What this enables

- multiple users see the same profiles, votes, admin changes, and settlements
- one shared poll board is available from a normal browser link
- favorite-team theming still works for every user session
- browser notifications can still be enabled without turning this into a mobile app

## Local development

Run both services:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

Website:

- `http://localhost:3000`

API:

- `http://localhost:4000`

## How the shared state works

The website keeps each user's current session in browser storage, but the real
club state is synchronized through the API:

- `GET /state`
- `PUT /state`

The API writes the shared data to `shared-state.json`.

## Deployment shape

For a public website deployment, host:

1. the Next.js website
2. the Express API
3. a persistent storage directory for the API state file

The API supports a `STATE_STORAGE_DIR` environment variable so you can point the
shared state file to a persistent volume on your host.

## Free-hosted alternative

If you want a free public deployment, use the website-only hosting path in
[docs/deploy-free-website.md](/C:/Users/Lenovo/OneDrive/Desktop/ipl-betting/docs/deploy-free-website.md).

That path keeps the same website UI but stores shared state in Supabase through
the website's own `/api/shared-state` route, so you do not need to host the
separate Express API publicly.

## Current environment variables

Website / shared API:

- `API_SERVICE_URL`

API:

- `PORT`
- `STATE_STORAGE_DIR`

## Important limitation

This is a strong shared-website prototype, but it is not yet a full production
stack with real database auth. If you want long-term reliability, move the shared
state into a database later.

## Browser notifications

Users can enable browser alerts from the website banner for:

- poll openings
- vote closing reminders
- locked polls
- results
- admin activity

These alerts work as website/browser notifications and do not require packaging
the project as a downloadable mobile app.
