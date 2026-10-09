-- Run this once in your Supabase project's SQL Editor (Dashboard → SQL
-- Editor → New query → paste this whole file → Run) after creating the
-- project and before signing into the app with real accounts turned on.
--
-- One row per signed-in user, holding every field the app used to keep in
-- localStorage (name, school plan, activities, energy log, study history,
-- achievements seen, custom reminders, etc.) as a single JSON blob — see
-- KEYS in src/lib/store.js for the exact fields. This keeps the schema
-- simple and future-proof: a new local field never needs its own column
-- or a database migration.

create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

-- Each user can only ever read or write their own row — this is the real
-- security boundary, since the "anon" key the app uses is public by design.
-- "drop ... if exists" first makes this whole file safe to run more than
-- once (e.g. after a partial run) without erroring on "already exists".
drop policy if exists "Users can view their own data" on public.user_data;
create policy "Users can view their own data"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own data" on public.user_data;
create policy "Users can insert their own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own data" on public.user_data;
create policy "Users can update their own data"
  on public.user_data for update
  using (auth.uid() = user_id);

-- Push notification subscriptions (one row per subscribed device, keyed by
-- the browser's push endpoint URL). RLS is enabled with no policies at all
-- — deliberately deny-all for the public "anon"/"authenticated" roles — so
-- this table is reachable only from the server, using the service_role key
-- (SUPABASE_SERVICE_ROLE_KEY, never shipped to the browser), which bypasses
-- RLS entirely. Subscriptions aren't tied to a user_id: the client never
-- sends one (see src/lib/pushNotifications.js), matching this single-device
-- model unchanged from the pre-Supabase local-file version.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  state jsonb not null default '{}'::jsonb,
  tick integer not null default 0
);

alter table public.push_subscriptions enable row level security;

-- Pulgo Premium (see PREMIUM_SETUP.md). Both tables are written only by the
-- server with the service_role key. RLS on with no policies = no access for
-- the public roles; the app asks /api/premium instead.
--
-- How many AI requests each free user made per period ('d2026-10-09' for a
-- day, 'w2026-10-05' for the week starting that Monday) and feature
-- (chat, plan, rescue, prep).
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null,
  feature text not null,
  count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, period, feature)
);
alter table public.ai_usage enable row level security;

-- Who has Premium, as last reported by RevenueCat. expires_at is when the
-- current paid (or trial) period ends; null with premium = true never ends.
create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  premium boolean not null default false,
  expires_at timestamptz,
  product_id text,
  source text,
  updated_at timestamptz not null default now()
);
alter table public.entitlements enable row level security;

-- Uses one request from the allowance in a single step (two requests at the
-- same moment can't both squeeze past the limit). Returns the new count, or
-- -1 when the allowance is already used up.
create or replace function public.consume_ai_usage(p_user uuid, p_period text, p_feature text, p_limit integer)
returns integer language plpgsql security definer set search_path = public as $$
declare c integer;
begin
  insert into public.ai_usage (user_id, period, feature, count) values (p_user, p_period, p_feature, 0)
    on conflict (user_id, period, feature) do nothing;
  update public.ai_usage set count = count + 1, updated_at = now()
    where user_id = p_user and period = p_period and feature = p_feature and count < p_limit
    returning count into c;
  return coalesce(c, -1);
end $$;

-- Gives one request back (the AI call failed after it was counted).
create or replace function public.release_ai_usage(p_user uuid, p_period text, p_feature text)
returns void language sql security definer set search_path = public as $$
  update public.ai_usage set count = greatest(count - 1, 0), updated_at = now()
    where user_id = p_user and period = p_period and feature = p_feature;
$$;

revoke all on function public.consume_ai_usage(uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.release_ai_usage(uuid, text, text) from public, anon, authenticated;
