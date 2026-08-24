-- Migration: 0004_twelve_hour_challenges.sql
-- Description: Support 12-hour challenge slots (AM/PM) — two challenges per day

-- 1. Add period column
alter table public.daily_challenges
  add column if not exists period text not null default 'AM';

-- 2. Drop the old unique constraint (user_id, challenge_date)
alter table public.daily_challenges
  drop constraint if exists daily_challenges_user_id_challenge_date_key;

-- 3. Create the new unique constraint (user_id, challenge_date, period)
alter table public.daily_challenges
  add constraint daily_challenges_user_id_challenge_date_period_key
  unique (user_id, challenge_date, period);
