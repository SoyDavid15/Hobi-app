-- Migration: 0007_mood_entries.sql
-- Description: Mood tracking entries for daily wellness check-ins

create table if not exists public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null, -- format YYYY-MM-DD
  mood text not null check (mood in ('rad', 'good', 'neutral', 'tired', 'sad', 'stressed')),
  energy int not null default 3 check (energy >= 1 and energy <= 5),
  note text,
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- Index for fast queries by user and date
create index if not exists idx_mood_entries_user_date on public.mood_entries (user_id, date desc);

-- Enable Row Level Security
alter table public.mood_entries enable row level security;

-- Policies
create policy "Users can view own mood entries"
  on public.mood_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own mood entries"
  on public.mood_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mood entries"
  on public.mood_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own mood entries"
  on public.mood_entries for delete
  using (auth.uid() = user_id);
