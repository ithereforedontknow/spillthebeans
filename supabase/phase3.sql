-- ============================================================
-- spillthebeans Phase 3 — Run in Supabase SQL Editor
-- ============================================================

-- ── 1. SLUG column on spots ───────────────────────────────────────────────────
alter table public.spots
  add column if not exists slug text unique;

-- Slug generator helper
create or replace function public.slugify(input text)
returns text language plpgsql immutable as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(trim(input), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
end;
$$;

-- Auto-generate slug on insert if not provided
create or replace function public.set_spot_slug()
returns trigger language plpgsql as $$
declare
  base_slug text;
  final_slug text;
  counter   int := 0;
begin
  if new.slug is null or new.slug = '' then
    base_slug  := public.slugify(new.name);
    final_slug := base_slug;
    -- Append counter if slug already exists
    while exists (select 1 from public.spots where slug = final_slug and id != new.id) loop
      counter    := counter + 1;
      final_slug := base_slug || '-' || counter;
    end loop;
    new.slug := final_slug;
  end if;
  return new;
end;
$$;

drop trigger if exists spots_set_slug on public.spots;
create trigger spots_set_slug
  before insert or update of name on public.spots
  for each row execute procedure public.set_spot_slug();

-- Backfill slugs for existing spots
update public.spots set slug = null where slug is null;
-- (trigger will fire and generate them — but trigger only fires on update,
--  so we force it with a no-op update)
update public.spots set name = name where slug is null;

-- ── 2. AMENITY columns ────────────────────────────────────────────────────────
alter table public.spots
  add column if not exists amenity_no_time_limit  boolean not null default false,
  add column if not exists amenity_standing_desk  boolean not null default false,
  add column if not exists amenity_outdoor_seating boolean not null default false,
  add column if not exists amenity_open_24h       boolean not null default false,
  add column if not exists amenity_reservable     boolean not null default false,
  add column if not exists amenity_pet_friendly   boolean not null default false;

-- ── 3. STRUCTURED OPENING HOURS ──────────────────────────────────────────────
-- Store as JSON: { mon: "8:00-22:00", tue: "8:00-22:00", ... , sun: null }
-- null = closed, "00:00-23:59" = open all day
alter table public.spots
  add column if not exists hours_json jsonb;

-- ── 4. WEIGHTED WORK SCORE FUNCTION ──────────────────────────────────────────
-- Weights: WiFi 2x, Power 1.5x, Laptop 1.5x, Noise 1x, Coffee 0.75x, Seating 0.75x
-- Normalised to a 1-5 scale.
create or replace function public.weighted_work_score(
  wifi    numeric,
  power   numeric,
  noise   numeric,
  laptop  numeric,
  coffee  numeric,
  seating numeric
)
returns numeric language sql immutable as $$
  select round(
    (wifi * 2 + power * 1.5 + laptop * 1.5 + noise * 1 + coffee * 0.75 + seating * 0.75)
    / (2 + 1.5 + 1.5 + 1 + 0.75 + 0.75),
    1
  );
$$;

-- ── 5. INDEXES ────────────────────────────────────────────────────────────────
create index if not exists idx_spots_slug  on public.spots(slug);
create index if not exists idx_spots_hours on public.spots using gin(hours_json);

-- ── 6. RLS: slug is public same as other spot columns (already covered) ───────
-- No new policies needed — slug is just another column on spots.

-- ============================================================
-- VERIFY:
--   select id, name, slug from public.spots limit 10;
--   select amenity_no_time_limit, amenity_standing_desk from public.spots limit 5;
-- ============================================================
