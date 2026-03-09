-- ============================================================
-- NomadCafe Phase 2 — Run in Supabase SQL Editor
-- ============================================================

-- ── 1. REVIEWS: add flagging columns ─────────────────────────────────────────
alter table public.reviews
  add column if not exists is_flagged     boolean not null default false,
  add column if not exists flagged_reason text,
  add column if not exists flagged_by     uuid references auth.users(id) on delete set null,
  add column if not exists flagged_at     timestamptz;

-- Index for admin "show flagged" queries
create index if not exists idx_reviews_flagged on public.reviews(is_flagged) where is_flagged = true;

-- ── 2. SPOTS: ensure image_url column exists (already does, just confirming) ─

-- ── 3. RLS: allow any auth user to flag a review (set is_flagged=true only)
-- Admins can update all review fields (unflag, delete)
create policy "Admins update any review"
  on public.reviews for update
  using ((select is_admin from public.profiles where id = auth.uid()))
  with check (true);

-- Allow authenticated users to flag (limited update — only is_flagged fields)
-- Note: the existing "Users update own reviews" policy covers owners.
-- For flagging OTHER users' reviews, we use a separate RPC to avoid
-- giving broad update access.
create or replace function public.flag_review(
  review_id uuid,
  reason    text default null
)
returns void language plpgsql security definer as $$
begin
  -- Must be authenticated
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  -- Cannot flag your own review
  if (select user_id from public.reviews where id = review_id) = auth.uid() then
    raise exception 'Cannot flag your own review';
  end if;
  update public.reviews
  set
    is_flagged     = true,
    flagged_reason = reason,
    flagged_by     = auth.uid(),
    flagged_at     = now()
  where id = review_id;
end;
$$;

create or replace function public.unflag_review(review_id uuid)
returns void language plpgsql security definer as $$
begin
  if not (select is_admin from public.profiles where id = auth.uid()) then
    raise exception 'Admin only';
  end if;
  update public.reviews
  set is_flagged = false, flagged_reason = null, flagged_by = null, flagged_at = null
  where id = review_id;
end;
$$;

-- ── 4. SUPABASE STORAGE: spot images bucket ───────────────────────────────────
-- Run this to create the bucket (or do it in the Supabase Dashboard > Storage)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'spot-images',
  'spot-images',
  true,                          -- public bucket — images served via CDN
  5242880,                       -- 5 MB max per file
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Storage RLS: anyone can read, authenticated users can upload, owners can delete
create policy "Public read spot images"
  on storage.objects for select
  using (bucket_id = 'spot-images');

create policy "Auth users upload spot images"
  on storage.objects for insert
  with check (bucket_id = 'spot-images' and auth.uid() is not null);

create policy "Users delete own uploads"
  on storage.objects for delete
  using (bucket_id = 'spot-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── 5. PASSPORT / BADGES ─────────────────────────────────────────────────────
-- Badges are computed from review counts — no separate table needed.
-- We add a helper view for convenience.

create or replace view public.user_passport as
select
  p.id,
  p.username,
  p.avatar_url,
  count(distinct r.spot_id)  as spots_visited,
  count(r.id)                as total_reviews,
  round(avg(r.overall_score)::numeric, 1) as avg_score_given,
  -- Badge tier derived from spots visited
  case
    when count(distinct r.spot_id) >= 25 then 'Veteran'
    when count(distinct r.spot_id) >= 10 then 'Grinder'
    when count(distinct r.spot_id) >=  5 then 'Regular'
    when count(distinct r.spot_id) >=  1 then 'Explorer'
    else 'Newcomer'
  end as badge_tier
from public.profiles p
left join public.reviews r on r.user_id = p.id
group by p.id, p.username, p.avatar_url;

-- Grant read access
grant select on public.user_passport to anon, authenticated;

-- ============================================================
-- DONE. Verify with:
--   select * from public.user_passport limit 5;
--   select * from storage.buckets where id = 'spot-images';
-- ============================================================

-- ── Fix: sync Google avatar correctly ────────────────────────────────────────
-- Google OAuth metadata uses 'picture', not 'avatar_url'.
-- Update the trigger and add a one-time backfill for existing users.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do update set
    avatar_url = coalesce(
      excluded.avatar_url,
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    );
  return new;
end;
$$;

-- One-time backfill: copy Google picture into existing profiles that have no avatar
update public.profiles p
set avatar_url = coalesce(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture'
)
from auth.users u
where p.id = u.id
  and p.avatar_url is null
  and (
    u.raw_user_meta_data->>'avatar_url' is not null
    or u.raw_user_meta_data->>'picture'  is not null
  );
