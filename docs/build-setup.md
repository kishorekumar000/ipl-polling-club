# Build Setup

## Product framing

Build this as a private IPL prediction club app with:

- vote collection
- automated poll timing
- virtual settlement ledger
- admin-controlled final result declaration

Keep any real-world payment outside the app.

## Recommended product flow

### 1. Landing page

- Big IPL-themed welcome screen
- CTA like `Enter the Pavilion`
- Light motion, gradients, team accents

### 2. First-time setup page

- Ask for name
- Ask for favorite team from all 10 IPL teams
- Lock favorite team forever after first save
- Allow name change only 2 times
- Show warning before the final allowed rename

### 3. Poll page

- Show today's match card
- Show generated rivalry title
- Show vote deadline countdown
- Let user switch vote until lock time
- Show favorite-team branding on the side and background
- After deadline, replace vote buttons with final team lists

### 4. Settlement page

- Show public view-only settlement
- Example entries:
  - `Kishore (-5)`
  - `Hari (+7)`
- Show carry remainder message if there is leftover

### 5. Admin dashboard

- user list
- rename count
- favorite team
- current votes
- lock status
- match result declaration
- settlement preview
- final settlement edit controls
- multi-admin role support

## Routes

### User routes

- `/`
- `/setup`
- `/polls/today`
- `/polls/[matchId]`
- `/settlements`
- `/results/[matchId]`

### Admin routes

- `/admin/login`
- `/admin`
- `/admin/matches`
- `/admin/matches/[matchId]`
- `/admin/users`
- `/admin/settlements`

## Authentication

### Users

Login is strongly recommended.

Minimum acceptable options:

- phone OTP
- email magic link
- invite code + device-bound session for a tiny private group

Without login, people can impersonate names, vote multiple times, or break settlement trust.

### Admins

Admins must log in.

Store role on the `User` table so you can support multiple admins cleanly.

## Match automation

Use a daily ingestion job to fetch or confirm today's IPL fixtures.

### Poll schedule rules

- Regular match: create at `3:00 PM`, lock at `7:30 PM`
- Double header first match: create at `12:00 PM`, lock at `3:30 PM`
- Double header second match: create at `4:00 PM`, lock at `7:30 PM`

### Suggested job pipeline

1. `06:00 AM`: sync upcoming IPL schedule
2. per match: enqueue poll open job
3. per match: enqueue poll lock job
4. after result: admin confirms winner
5. settlement service generates entries and carry-forward

## Title generation

Use rule-based titles first.

Examples:

- `CSK vs MI` -> `Southern Derby`
- `RCB vs KKR` -> `Royal Rumble`
- `GT vs RR` -> `Titans vs Royals Clash`
- fallback -> `{Team A} vs {Team B} Showdown`

Store the generated title on the match record so it remains stable after creation.

## Settlement logic

Use integer paise internally and display whole rupees in the UI.

### Formula

- `pool = losers * 500`
- `totalPool = pool + carryIn`
- `sharePerWinner = floor(totalPool / winners)`
- `remainder = totalPool % winners`

### Example

- losers = `4`
- winners = `3`
- carry in = `100`
- total pool = `2100`
- each winner = `700`
- carry out = `0`

## Core admin actions

- create or edit match
- override title
- see live vote timeline
- declare winning team
- regenerate settlement
- adjust settlement manually if needed
- promote another admin

## Data integrity rules

- one active vote per user per match
- user can change vote only before lock time
- favorite team can be chosen only once
- name can be changed maximum two times
- settlement is immutable after publish unless admin reopens it

## Suggested implementation order

1. auth + users + onboarding
2. teams + match CRUD
3. voting flow with lock logic
4. settlement engine with carry-forward
5. admin dashboard
6. scheduler and auto fixture ingestion
7. UI polish and WhatsApp notifications
