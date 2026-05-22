# Architecture — Magic Garden Journal

> **Internal doc version:** `0.4.0` · **Last updated:** 2026-05-17 · **Project:** `0.5.9`

---

## System

Three repos, one upstream data source. Never merge.

| Repo | Status | Purpose |
|---|---|---|
| `magic-garden-journal` | Active (v0.5.9) | Personal crop & pet tracker |
| `magic-garden-stock` | Not started | Live shop/weather (Phase 2) |
| `magic-garden-alexa-bridge` | Not started | Voice alerts (Phase 3) |

## Stack

Vercel (static) · Supabase (auth + Postgres RLS) · AriesMod API · Vanilla JS ES modules · No build step

## Data flow

```
Browser
 ├─ GET /api/config → { supabaseUrl, supabaseAnon }   (Vercel Function)
 ├─ Supabase Auth → signInWithPassword, session
 ├─ Supabase DB  → journal_entries (RLS: user_id = auth.uid())
 └─ mg-api.ariedam.fr
     ├─ /data/plants|pets|mutations|eggs|abilities|weathers  (1h localStorage cache)
     └─ /assets/sprites/composed?key=sprite/plant/<stem>&mutations=<MutApiName>
```

## Module map

```
api/config.js           Vercel fn — exposes env vars to browser
index.html              Shell: auth gate + app container (no logic)
js/app.js               Router, nav render, auth bootstrap, version
js/lib/
  aries.js              Single source of truth for all game constants + API client
  icons.js              Badges, formatters, seedFinderNote
  auth.js               signIn, signOut, getSession, initAuth
  cache.js              get(key, ttl, fetchFn) — localStorage TTL wrapper
  supabase.js           getSupabase() — client factory, fetches /api/config once
js/pages/
  plants.js             Orchestrator: module state, tabs, toolbar, overall progress
  plants-grid.js        buildCard(), buildRow(), filterPlants()
  plants-modal.js       openModal(), closeModal(), tile toggle (upsert), Check/Clear All
  plants-conditions.js  Conditions grid: composed mutated sprites, opens plant modal
  pets.js               Stub — 0.6.0
css/
  main.css              Auth gate, reset, shared CSS vars (--green, --gold-light, etc.)
  nav.css               Sidebar (desktop) + bottom bar (mobile)
  plants.css            Full plants page
  pets.css              Stub
```

## Supabase schema

```sql
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  item_type     text not null check (item_type in ('crop', 'pet')),
  item_key      text not null,
  variant_key   text not null,
  discovered_at timestamptz not null default now(),
  unique (user_id, item_type, item_key, variant_key)
);
```
RLS policies restrict all operations to `auth.uid() = user_id`. Sign-ups disabled at project level.

## Key aries.js exports

| Export | Purpose |
|---|---|
| `CROP_VARIANTS` | 12 variants in journal order |
| `CROP_ORDER` | 54 API keys in journal order |
| `PLANT_SPRITE_KEY` | API key → sprite filename stem (7 mismatches) |
| `MUTATION_API_NAME` | Display name → composed endpoint param |
| `MUTATION_SPRITES` | Direct mutation icon URLs |
| `CROP_RARITY` | All 54 crops, from API (uses `Mythic`) |
| `CROP_ACQUISITION` | Source info from `eligibleShops` + wiki |
| `CROP_STATIC_DATA` | grow/regrow/baseWeight/maxWeight (wiki) |
| `seedFinderTier(rarity)` | Common/Uncommon→I, Rare/Leg→II, Mythic→III |
| `composedSpriteUrl(key, variant)` | Builds composed endpoint URL |
| `fetchPlants/Pets/Mutations/Eggs/Weathers/Abilities()` | Cached API fetchers |
