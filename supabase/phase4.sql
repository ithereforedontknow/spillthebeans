-- ============================================================
-- SpillTheBeans Phase 4 — Run in Supabase SQL Editor
-- ============================================================

-- ── 1. SPOT SUBMISSIONS ───────────────────────────────────────────────────────
create table if not exists public.spot_submissions (
  id               uuid primary key default gen_random_uuid(),
  submitted_by     uuid not null references auth.users(id) on delete cascade,
  submitter_name   text not null,
  -- Core spot fields (mirrors spots table)
  name             text not null,
  address          text not null,
  city             text not null,
  description      text,
  lat              numeric(9,6),
  lng              numeric(9,6),
  image_url        text,
  google_maps_url  text,
  opening_hours    text,
  price_range      smallint check (price_range between 1 and 3),
  has_wifi         boolean not null default true,
  has_power        boolean not null default true,
  -- Submission state
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note       text,           -- rejection reason or admin comment
  reviewed_by      uuid references auth.users(id) on delete set null,
  reviewed_at      timestamptz,
  -- Approved spot reference
  spot_id          uuid references public.spots(id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table public.spot_submissions enable row level security;

create policy "Public read approved submissions"
  on public.spot_submissions for select using (true);
create policy "Auth users submit spots"
  on public.spot_submissions for insert
  with check (auth.uid() = submitted_by);
create policy "Admins manage submissions"
  on public.spot_submissions for update
  using ((select is_admin from public.profiles where id = auth.uid()));

create index if not exists idx_submissions_status on public.spot_submissions(status);
create index if not exists idx_submissions_user   on public.spot_submissions(submitted_by);

-- ── 2. SPOT UPDATE FLAGS ──────────────────────────────────────────────────────
create table if not exists public.spot_updates (
  id           uuid primary key default gen_random_uuid(),
  spot_id      uuid not null references public.spots(id) on delete cascade,
  reported_by  uuid not null references auth.users(id) on delete cascade,
  category     text not null check (category in (
    'wifi_gone','wifi_unreliable','power_gone','closed_permanently',
    'wrong_hours','price_changed','moved_location','other'
  )),
  note         text,
  status       text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolved_by  uuid references auth.users(id) on delete set null,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (spot_id, reported_by, category)  -- one report per category per user per spot
);

alter table public.spot_updates enable row level security;

create policy "Public read spot updates" on public.spot_updates for select using (true);
create policy "Auth users report updates"
  on public.spot_updates for insert
  with check (auth.uid() = reported_by);
create policy "Admins resolve updates"
  on public.spot_updates for update
  using ((select is_admin from public.profiles where id = auth.uid()));

create index if not exists idx_spot_updates_spot   on public.spot_updates(spot_id);
create index if not exists idx_spot_updates_status on public.spot_updates(status) where status = 'open';

-- ── 3. SPOT PHOTOS GALLERY ────────────────────────────────────────────────────
create table if not exists public.spot_photos (
  id           uuid primary key default gen_random_uuid(),
  spot_id      uuid not null references public.spots(id) on delete cascade,
  uploaded_by  uuid not null references auth.users(id) on delete cascade,
  url          text not null,
  caption      text,
  is_featured  boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.spot_photos enable row level security;

create policy "Public read photos"      on public.spot_photos for select using (true);
create policy "Auth users upload photos"
  on public.spot_photos for insert with check (auth.uid() = uploaded_by);
create policy "Owners delete own photos"
  on public.spot_photos for delete using (auth.uid() = uploaded_by);
create policy "Admins manage photos"
  on public.spot_photos for update
  using ((select is_admin from public.profiles where id = auth.uid()));

create index if not exists idx_photos_spot on public.spot_photos(spot_id);

-- ── 4. HOURS SUGGESTIONS ──────────────────────────────────────────────────────
create table if not exists public.hours_suggestions (
  id            uuid primary key default gen_random_uuid(),
  spot_id       uuid not null references public.spots(id) on delete cascade,
  suggested_by  uuid not null references auth.users(id) on delete cascade,
  hours_json    jsonb not null,  -- same format as spots.hours_json
  note          text,
  status        text not null default 'pending' check (status in ('pending','applied','dismissed')),
  reviewed_by   uuid references auth.users(id) on delete set null,
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.hours_suggestions enable row level security;

create policy "Public read hours suggestions" on public.hours_suggestions for select using (true);
create policy "Auth users suggest hours"
  on public.hours_suggestions for insert with check (auth.uid() = suggested_by);
create policy "Admins manage suggestions"
  on public.hours_suggestions for update
  using ((select is_admin from public.profiles where id = auth.uid()));

create index if not exists idx_hours_spot on public.hours_suggestions(spot_id);

-- ── 5. VERIFIED BADGE VIEW ────────────────────────────────────────────────────
-- A spot is "verified" when:
--   • 3+ reviews
--   • Most recent review within 90 days
--   • No open update flags
create or replace view public.spot_verified as
select
  s.id as spot_id,
  count(distinct r.id) >= 3
    and max(r.created_at) > now() - interval '90 days'
    and not exists (
      select 1 from public.spot_updates u
      where u.spot_id = s.id and u.status = 'open'
    ) as is_verified
from public.spots s
left join public.reviews r on r.spot_id = s.id
group by s.id;

grant select on public.spot_verified to anon, authenticated;

-- ── 6. CITY STATS VIEW ────────────────────────────────────────────────────────
create or replace view public.city_stats as
select
  s.city,
  count(distinct s.id)                                    as spot_count,
  count(distinct r.id)                                    as review_count,
  count(distinct r.user_id)                               as reviewer_count,
  round(avg(r.overall_score)::numeric, 1)                 as avg_score,
  max(r.created_at)                                       as last_reviewed_at
from public.spots s
left join public.reviews r on r.spot_id = s.id
where s.is_published = true
group by s.city
order by spot_count desc;

grant select on public.city_stats to anon, authenticated;

-- ── 7. ADMIN: approve submission RPC ──────────────────────────────────────────
create or replace function public.approve_submission(submission_id uuid)
returns uuid language plpgsql security definer as $$
declare
  sub    public.spot_submissions%rowtype;
  new_id uuid;
begin
  if not (select is_admin from public.profiles where id = auth.uid()) then
    raise exception 'Admin only';
  end if;

  select * into sub from public.spot_submissions where id = submission_id;
  if not found then raise exception 'Submission not found'; end if;

  -- Create the real spot (draft by default — admin can publish after review)
  insert into public.spots (
    name, address, city, description, lat, lng,
    image_url, google_maps_url, opening_hours,
    price_range, has_wifi, has_power, is_published, created_by
  ) values (
    sub.name, sub.address, sub.city, sub.description, sub.lat, sub.lng,
    sub.image_url, sub.google_maps_url, sub.opening_hours,
    sub.price_range, sub.has_wifi, sub.has_power, false, sub.submitted_by
  )
  returning id into new_id;

  -- Mark submission approved
  update public.spot_submissions
  set status = 'approved', spot_id = new_id,
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = submission_id;

  return new_id;
end;
$$;

-- ============================================================
-- VERIFY:
--   select * from public.city_stats;
--   select * from public.spot_verified limit 5;
-- ============================================================
