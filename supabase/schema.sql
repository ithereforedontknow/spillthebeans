-- ============================================================
-- NomadCafe — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ── 1. PROFILES ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  username    text unique,
  bio         text,
  city        text,
  avatar_url  text,
  work_type   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── 2. SPOTS ─────────────────────────────────────────────────────────────────
create table if not exists public.spots (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  address          text not null,
  city             text not null,
  description      text,
  lat              double precision,
  lng              double precision,
  image_url        text,
  google_maps_url  text,
  opening_hours    text,
  price_range      smallint check (price_range in (1, 2, 3)),
  has_wifi         boolean not null default true,
  has_power        boolean not null default true,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users(id) on delete set null
);

-- ── 3. REVIEWS ───────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  spot_id             uuid not null references public.spots(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  username            text not null,
  avatar_url          text,
  body                text not null check (char_length(body) >= 30),
  -- Work rating dimensions 1–5
  wifi_quality        smallint not null check (wifi_quality between 1 and 5),
  power_outlets       smallint not null check (power_outlets between 1 and 5),
  noise_level         smallint not null check (noise_level between 1 and 5),
  laptop_friendliness smallint not null check (laptop_friendliness between 1 and 5),
  coffee_quality      smallint not null check (coffee_quality between 1 and 5),
  seating_comfort     smallint not null check (seating_comfort between 1 and 5),
  overall_score       numeric(3,1) not null,
  tags                text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, spot_id)  -- one review per user per spot
);

-- ── 4. SPOT LIKES ────────────────────────────────────────────────────────────
create table if not exists public.spot_likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  spot_id     uuid not null references public.spots(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, spot_id)
);

-- ── 5. REVIEW LIKES ──────────────────────────────────────────────────────────
create table if not exists public.review_likes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  review_id   uuid not null references public.reviews(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, review_id)
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on first Google login
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update reviews.updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists reviews_updated_at on public.reviews;
create trigger reviews_updated_at
  before update on public.reviews
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.spots       enable row level security;
alter table public.reviews     enable row level security;
alter table public.spot_likes  enable row level security;
alter table public.review_likes enable row level security;

-- Profiles
create policy "Profiles viewable by all"            on public.profiles for select using (true);
create policy "Users update own profile"            on public.profiles for update using (auth.uid() = id);
create policy "Users insert own profile"            on public.profiles for insert with check (auth.uid() = id);

-- Spots
create policy "Published spots viewable by all"     on public.spots for select
  using (is_published = true or (select is_admin from public.profiles where id = auth.uid()));
create policy "Admins insert spots"                 on public.spots for insert
  with check ((select is_admin from public.profiles where id = auth.uid()));
create policy "Admins update spots"                 on public.spots for update
  using ((select is_admin from public.profiles where id = auth.uid()));
create policy "Admins delete spots"                 on public.spots for delete
  using ((select is_admin from public.profiles where id = auth.uid()));

-- Reviews
create policy "Reviews viewable by all"             on public.reviews for select using (true);
create policy "Auth users insert reviews"           on public.reviews for insert with check (auth.uid() = user_id);
create policy "Users update own reviews"            on public.reviews for update using (auth.uid() = user_id);
create policy "Users delete own reviews"            on public.reviews for delete using (auth.uid() = user_id);

-- Spot likes
create policy "Spot likes viewable by all"          on public.spot_likes  for select using (true);
create policy "Auth users like spots"               on public.spot_likes  for insert with check (auth.uid() = user_id);
create policy "Users remove own spot likes"         on public.spot_likes  for delete using (auth.uid() = user_id);

-- Review likes
create policy "Review likes viewable by all"        on public.review_likes for select using (true);
create policy "Auth users like reviews"             on public.review_likes for insert with check (auth.uid() = user_id);
create policy "Users remove own review likes"       on public.review_likes for delete using (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_reviews_spot_id       on public.reviews(spot_id);
create index if not exists idx_reviews_user_id       on public.reviews(user_id);
create index if not exists idx_spot_likes_user_id    on public.spot_likes(user_id);
create index if not exists idx_spot_likes_spot_id    on public.spot_likes(spot_id);
create index if not exists idx_review_likes_user_id  on public.review_likes(user_id);
create index if not exists idx_spots_city            on public.spots(city);
create index if not exists idx_spots_published       on public.spots(is_published);

-- ============================================================
-- SEED: Make yourself admin
-- After your first sign-in, find your UUID in
-- Supabase Dashboard > Authentication > Users, then run:
--
--   update public.profiles set is_admin = true where id = 'YOUR-UUID-HERE';
--
-- ============================================================
