-- ============================================================
-- SpillTheBeans Phase 5 — Social
-- ============================================================

-- ── 1. FOLLOWS ────────────────────────────────────────────────────────────────
create table if not exists public.follows (
  id           uuid primary key default gen_random_uuid(),
  follower_id  uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

alter table public.follows enable row level security;

create policy "Public read follows"     on public.follows for select using (true);
create policy "Auth users follow"       on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users unfollow own"      on public.follows for delete using (auth.uid() = follower_id);

create index if not exists idx_follows_follower  on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

-- ── 2. FOLLOWER / FOLLOWING COUNTS VIEW ───────────────────────────────────────
create or replace view public.profile_social as
select
  p.id,
  p.username,
  p.avatar_url,
  p.city,
  p.bio,
  count(distinct f1.follower_id)  as follower_count,
  count(distinct f2.following_id) as following_count
from public.profiles p
left join public.follows f1 on f1.following_id = p.id
left join public.follows f2 on f2.follower_id  = p.id
group by p.id, p.username, p.avatar_url, p.city, p.bio;

grant select on public.profile_social to anon, authenticated;

-- ── 3. ACTIVITY FEED ─────────────────────────────────────────────────────────
-- Union of reviews + checkins from users you follow
-- We build this as a function that takes the requesting user's id

create or replace function public.get_feed(requesting_user_id uuid, page_offset int default 0)
returns table (
  id          uuid,
  type        text,
  actor_id    uuid,
  actor_name  text,
  actor_avatar text,
  spot_id     uuid,
  spot_name   text,
  spot_slug   text,
  spot_city   text,
  body        text,
  score       numeric,
  created_at  timestamptz
)
language sql stable security definer as $$
  -- Reviews from followed users
  select
    r.id,
    'review'::text            as type,
    r.user_id                 as actor_id,
    r.username                as actor_name,
    r.avatar_url              as actor_avatar,
    s.id                      as spot_id,
    s.name                    as spot_name,
    s.slug                    as spot_slug,
    s.city                    as spot_city,
    r.body,
    r.overall_score::numeric  as score,
    r.created_at
  from public.reviews r
  join public.spots s on s.id = r.spot_id
  where r.user_id in (
    select following_id from public.follows where follower_id = requesting_user_id
  )

  union all

  -- Own reviews too (your own activity in your feed)
  select
    r.id, 'review'::text, r.user_id, r.username, r.avatar_url,
    s.id, s.name, s.slug, s.city, r.body, r.overall_score::numeric, r.created_at
  from public.reviews r
  join public.spots s on s.id = r.spot_id
  where r.user_id = requesting_user_id

  order by created_at desc
  limit 30 offset page_offset;
$$;

-- ── 4. "PEOPLE YOU MIGHT KNOW" ────────────────────────────────────────────────
-- Users in same city, not already following, ordered by review count
create or replace function public.suggested_users(requesting_user_id uuid)
returns table (
  id           uuid,
  username     text,
  avatar_url   text,
  city         text,
  review_count bigint
)
language sql stable security definer as $$
  select
    p.id, p.username, p.avatar_url, p.city,
    count(r.id) as review_count
  from public.profiles p
  left join public.reviews r on r.user_id = p.id
  where p.id != requesting_user_id
    and p.id not in (
      select following_id from public.follows where follower_id = requesting_user_id
    )
    and p.city = (select city from public.profiles where id = requesting_user_id)
  group by p.id, p.username, p.avatar_url, p.city
  having count(r.id) > 0
  order by count(r.id) desc
  limit 8;
$$;

-- ============================================================
-- VERIFY:
--   select * from public.profile_social limit 5;
-- ============================================================
