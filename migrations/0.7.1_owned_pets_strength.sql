-- ═══════════════════════════════════════════════
-- Magic Garden Journal — migration: owned_pets strength (v0.7.1)
-- Run in the Supabase SQL editor AFTER 0.7.0_owned_pets.sql.
-- Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════
-- Adds per-pet strength tracking. A pet's ability values scale by
-- strength / 100, so each pet stores its current strength and its max
-- (fully-leveled) strength. `abilities` becomes an array of ability keys the
-- pet rolled — the 0.7.0 weight map is no longer used.
--   max_strength      : 80–100  (the value a pet spawns with; never changes)
--   current_strength  : 50–max  (where it is now, before fully leveling)
-- ═══════════════════════════════════════════════

-- ── New columns ───────────────────────────────
alter table public.owned_pets add column if not exists current_level int;
alter table public.owned_pets add column if not exists max_level     int;

-- Defaults for new rows (a fully-leveled, max-roll pet).
alter table public.owned_pets alter column current_level set default 100;
alter table public.owned_pets alter column max_level     set default 100;

-- Backfill any existing rows created under 0.7.0.
update public.owned_pets set max_level     = 100 where max_level     is null;
update public.owned_pets set current_level = 100 where current_level is null;

-- ── abilities: { key: weight } → [ key, ... ] ─
-- Convert any old object-shaped values to a JSON array of their keys.
-- (No-op for rows already storing an array.)
update public.owned_pets
  set abilities = (
    select coalesce(jsonb_agg(k), '[]'::jsonb)
    from jsonb_object_keys(abilities) as k
  )
  where jsonb_typeof(abilities) = 'object';

alter table public.owned_pets alter column abilities set default '[]'::jsonb;

-- ── Range constraints ─────────────────────────
alter table public.owned_pets drop constraint if exists owned_pets_max_level_chk;
alter table public.owned_pets drop constraint if exists owned_pets_current_level_chk;

alter table public.owned_pets
  add constraint owned_pets_max_level_chk
  check (max_level between 80 and 100);

alter table public.owned_pets
  add constraint owned_pets_current_level_chk
  check (current_level between 50 and 100 and current_level <= max_level);
