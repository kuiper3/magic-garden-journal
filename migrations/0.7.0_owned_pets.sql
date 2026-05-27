-- ═══════════════════════════════════════════════
-- Magic Garden Journal — migration: owned_pets (v0.7.0)
-- Run in the Supabase SQL editor.
-- ═══════════════════════════════════════════════
-- One row per *physical* pet a user owns (distinct from journal_entries, which
-- tracks one row per species *discovery*). `abilities` holds the rolled ability
-- weights as { abilityKey: weight }; proc share = weight / Σ(weights).
-- ═══════════════════════════════════════════════

create table if not exists public.owned_pets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  pet_key     text not null,                              -- API key, e.g. 'SnowFox'
  nickname    text,
  weight_kg   numeric,
  variant     text not null default 'Normal'
                check (variant in ('Normal', 'Gold', 'Rainbow')),
  abilities   jsonb not null default '{}'::jsonb,         -- { abilityKey: weight }
  created_at  timestamptz not null default now()
);

-- Fast lookups for "my pets" and per-species counts (Pets-page badge).
create index if not exists owned_pets_user_idx     on public.owned_pets (user_id);
create index if not exists owned_pets_user_pet_idx on public.owned_pets (user_id, pet_key);

-- ── Row-level security ────────────────────────
alter table public.owned_pets enable row level security;

drop policy if exists "owned_pets_select_own" on public.owned_pets;
drop policy if exists "owned_pets_insert_own" on public.owned_pets;
drop policy if exists "owned_pets_update_own" on public.owned_pets;
drop policy if exists "owned_pets_delete_own" on public.owned_pets;

create policy "owned_pets_select_own" on public.owned_pets
  for select using (auth.uid() = user_id);

create policy "owned_pets_insert_own" on public.owned_pets
  for insert with check (auth.uid() = user_id);

create policy "owned_pets_update_own" on public.owned_pets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "owned_pets_delete_own" on public.owned_pets
  for delete using (auth.uid() = user_id);
