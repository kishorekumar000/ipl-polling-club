create table if not exists public.club_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.club_state enable row level security;

comment on table public.club_state is
  'Single-row shared website state for the IPL polling club.';

insert into public.club_state (id, payload)
values (
  'main',
  '{"users":[],"matches":[],"votes":[],"settlements":[],"carryBalance":0,"auditTrail":[],"appNotifications":[]}'::jsonb
)
on conflict (id) do nothing;
