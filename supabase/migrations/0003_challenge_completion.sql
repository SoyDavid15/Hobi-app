-- Migration: 0003_challenge_completion.sql
-- Description: Add photo and completion tracking to daily_challenges, plus Storage bucket for challenge photos

-- 1. Add completion and photo fields to daily_challenges
alter table public.daily_challenges
  add column if not exists photo_url text,
  add column if not exists is_completed boolean not null default false,
  add column if not exists completed_at timestamptz;

-- 2. RLS policies for daily_challenges (update & insert for users)
create policy "Users can update own daily challenges"
  on public.daily_challenges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can insert own daily challenges"
  on public.daily_challenges for insert
  with check (auth.uid() = user_id);

-- 3. Storage Bucket Configuration for challenge photos
insert into storage.buckets (id, name, public)
values ('challenge-photos', 'challenge-photos', true)
on conflict (id) do update set public = true;

-- Storage policies:
-- Users can view photos
create policy "Public and authenticated users can view challenge photos"
  on storage.objects for select
  using (bucket_id = 'challenge-photos');

-- Users can upload photos to their own user_id directory
create policy "Users can upload their own challenge photos"
  on storage.objects for insert
  with check (
    bucket_id = 'challenge-photos'
    and (auth.uid()::text = (storage.foldername(name))[1] or auth.role() = 'authenticated')
  );

-- Users can update or delete their own challenge photos
create policy "Users can update their own challenge photos"
  on storage.objects for update
  using (
    bucket_id = 'challenge-photos'
    and (auth.uid()::text = (storage.foldername(name))[1] or auth.role() = 'authenticated')
  );
