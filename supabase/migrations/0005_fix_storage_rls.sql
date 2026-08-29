-- Migration: 0005_fix_storage_rls.sql
-- Description: Fix critical RLS vulnerability in challenge-photos storage bucket by removing unsafe auth.role() = 'authenticated' check

-- 1. Drop insecure policies if they exist
drop policy if exists "Users can upload their own challenge photos" on storage.objects;
drop policy if exists "Users can update their own challenge photos" on storage.objects;
drop policy if exists "Users can delete their own challenge photos" on storage.objects;

-- 2. Create strict secure policies enforcing exact user folder ownership (auth.uid() = first folder segment)
create policy "Users can upload their own challenge photos"
  on storage.objects for insert
  with check (
    bucket_id = 'challenge-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own challenge photos"
  on storage.objects for update
  using (
    bucket_id = 'challenge-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own challenge photos"
  on storage.objects for delete
  using (
    bucket_id = 'challenge-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
