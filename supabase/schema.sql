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
