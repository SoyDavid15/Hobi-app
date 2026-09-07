create table public.user_hobbies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hobby_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, hobby_id)
);

alter table public.user_hobbies enable row level security;

create policy "Users can view own hobbies"
  on public.user_hobbies for select
  using (auth.uid() = user_id);

create policy "Users can insert own hobbies"
  on public.user_hobbies for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own hobbies"
  on public.user_hobbies for delete
  using (auth.uid() = user_id);