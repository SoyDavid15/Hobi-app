create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  hobby_id text not null,
  challenge text not null,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_date)
);

alter table public.daily_challenges enable row level security;

create policy "Users can view own daily challenges"
  on public.daily_challenges for select
  using (auth.uid() = user_id);