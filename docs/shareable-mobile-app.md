# Shareable Mobile App Setup

This project now supports a shared app state through the API instead of only
browser `localStorage`.

## What this enables

- multiple users can see the same polls, votes, settlements, and admin changes
- the web app can still be installed as an app on phones
- notification history stays inside the app UI

## Local development

Run both servers:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

Web:

- `http://localhost:3000`

API:

- `http://localhost:4000`

Shared state endpoint:

- `GET /state`
- `PUT /state`

## Important limitation

This is now a shared-state app foundation, but a real public multi-user app still
needs deployment.

To share it with everyone:

1. deploy the web app to an HTTPS host
2. deploy the API to an HTTPS host
3. set `NEXT_PUBLIC_API_URL` to the deployed API URL
4. add a real database and push subscription storage for production-scale use

## Mobile install

Once the web app is deployed on HTTPS, users can:

- open the site
- tap `Install app` or `Add to Home Screen`
- allow notifications

## Current notification model

The app already supports:

- in-app notification center
- browser notifications on the current device
- poll open / poll closing / poll locked alerts
- result and admin activity alerts

For true background notifications across all users and all devices when the app is
fully closed, add a production push service later.
