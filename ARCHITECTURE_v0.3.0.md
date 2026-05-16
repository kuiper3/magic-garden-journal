# Architecture — Magic Garden Journal

> **Document version:** `0.3.0`
> **Last updated:** 2026-05-16
> **Project version this reflects:** `0.7.1`

---

## System: three repos, one upstream

| Repo | Status | Purpose |
|---|---|---|
| `magic-garden-journal` | Active | Personal crop & pet tracker |
| `magic-garden-stock` | Not started | Live shop/weather (Phase 2) |
| `magic-garden-alexa-bridge` | Not started | Voice alerts (Phase 3) |

## Tech stack

Vercel (static) · Supabase (auth + Postgres) · AriesMod API (game data) · Vanilla JS ES modules

## Data flow

```
Browser
 ├─ GET /api/config → SUPABASE_URL + SUPABASE_ANON_KEY (Vercel Function)
 ├─ Supabase Auth → signInWithPassword, session, journal_entries RLS
 └─ mg-api.ariedam.fr
     ├─ /data/plants|pets|mutations|eggs|abilities|weathers (1hr cache)
     └─ /assets/sprites/composed?key=sprite/plant/<Name>&mutations=<Mut>
```

## Module layout

```
api/config.js             Exposes public Supabase env vars to browser
css/main.css              Auth gate, reset, shared CSS vars
css/nav.css               Sidebar + mobile bottom bar + version tag
css/plants.css            Full plants page (cards, modal, conditions, list)
css/pets.css              Stub — 0.8.0
js/app.js                 Router, nav, auth bootstrap
js/lib/
  aries.js                ALL constants + API client (single source of truth)
  icons.js                Badges, formatters, seedFinderNote
  auth.js                 Supabase auth wrappers
  cache.js                localStorage TTL wrapper
  supabase.js             Supabase client factory
js/pages/
  plants.js               Orchestrator: state, tabs, toolbar, overall progress
  plants-grid.js          buildCard(), buildRow(), filterPlants()
  plants-modal.js         Modal: stages, stats, variant tiles, check/clear all
  plants-conditions.js    Conditions grid: clickable, opens modal
  pets.js                 Stub — 0.8.0
index.html                Shell: auth gate div + app div
```

## Supabase schema

```sql
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  item_type     text not null check (item_type in ('crop', 'pet')),
  item_key      text not null,      -- e.g. 'FourLeafClover', 'OrangeTulip'
  variant_key   text not null,      -- e.g. 'Gold', 'Dawnlit', 'MaxWeight'
  discovered_at timestamptz not null default now(),
  unique (user_id, item_type, item_key, variant_key)
);
-- RLS: all operations restricted to auth.uid() = user_id
-- Sign-ups disabled in Supabase project settings
```

## aries.js constants (ground truth)

All sourced from `mg-data.json` (live API dump, 2026-05-16):

- `CROP_VARIANTS` — 12 variants in journal order
- `PET_VARIANTS` — 4 variants
- `MUTATION_API_NAME` — display name → AriesMod composed endpoint param
- `MUTATION_SPRITES` — direct sprite URLs per mutation
- `WEATHER_SPRITES` — weather icon URLs
- `PLANT_SPRITE_KEY` — API key → sprite filename stem (for crops with mismatched names)
- `CROP_RARITY` — 54 crops, sourced from API (uses "Mythic" not "Mythical")
- `CROP_ACQUISITION` — sourced from `eligibleShops` + `purchasable` + wiki
- `CROP_STATIC_DATA` — grow/regrow seconds, base/max weight kg (wiki-sourced)
- `seedFinderTier()` — Common/Uncommon→I, Rare/Legendary→II, Mythic→III, Divine/Celestial→null
- `composedSpriteUrl(key, variant)` — builds composed endpoint URL using PLANT_SPRITE_KEY

## Out of scope

Profit Manager · Push notifications · Multi-user · Offline beyond 1hr cache
