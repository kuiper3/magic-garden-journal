# AI Handoff — Magic Garden Journal

> **Document version:** `0.3.0`
> **Last updated:** 2026-05-16
> **Project version this reflects:** `0.7.1`
>
> **Version history (this doc):**
> - `0.1.0` — Initial handoff during planning phase
> - `0.2.0` — Updated through v0.6.1
> - `0.3.0` — Updated through v0.7.1, mg-data.json sourced constants

---

## 1. Project snapshot

- **Name:** Magic Garden Journal
- **Owner:** Shawn (GitHub: `kuiper3`)
- **Repo:** https://github.com/kuiper3/magic-garden-journal
- **Live URL:** https://magic-garden-journal.vercel.app
- **Current version:** `0.7.1` (Plants page complete, Pets stub)
- **Next milestone:** `0.8.0` — Pets page

---

## 2. Doc version table

| Doc | Current version |
|---|---|
| `ARCHITECTURE` | `0.3.0` |
| `ROADMAP` | `0.3.0` |
| `README` | `0.3.0` |
| `CHANGELOG` | `0.3.0` |
| `AI_HANDOFF` *(this file)* | `0.3.0` |

---

## 3. The one rule

No file > 250 lines. No monolithic HTML. Game catalog fetched from AriesMod, never stored locally. Three separate repos (Journal, Stock, Alexa Bridge) — never merge.

---

## 4. Architecture

Static site → Vercel. Auth + DB → Supabase. Game data → AriesMod API (`mg-api.ariedam.fr`). No backend.

```
Browser → /api/config.js (Vercel fn, exposes SUPABASE_URL + SUPABASE_ANON_KEY)
        → Supabase (auth.signInWithPassword, journal_entries RLS table)
        → mg-api.ariedam.fr/data/* (1hr localStorage cache)
        → mg-api.ariedam.fr/assets/sprites/composed?key=...&mutations=... (variant tiles)
```

---

## 5. File layout

```
api/config.js               Vercel fn — exposes public Supabase keys
css/main.css                Auth gate, shared vars
css/nav.css                 Sidebar (desktop) / bottom bar (mobile)
css/plants.css              Full plants page styles
css/pets.css                Stub
js/app.js                   Router, nav, auth bootstrap, version string
js/lib/
  aries.js                  ALL game constants + API client (source of truth)
  icons.js                  Acquisition badges, formatters, seed finder note
  auth.js                   Supabase auth wrappers
  cache.js                  localStorage TTL cache
  supabase.js               Supabase client (fetches /api/config)
js/pages/
  plants.js                 Orchestrator — state, toolbar, tabs
  plants-grid.js            buildCard(), buildRow(), filterPlants()
  plants-modal.js           Modal, Check/Clear All, upsert toggle, variant tiles
  plants-conditions.js      Conditions grid — clickable, opens modal
  pets.js                   Stub (0.8.0)
index.html                  Shell only — auth gate + app container
```

---

## 6. Critical constants in aries.js (all sourced from mg-data.json)

### CROP_VARIANTS (12, in journal order)
Normal, Wet, Chilled, Frozen, Dawnlit, Amberlit, Thunderstruck, Gold, Rainbow, Dawnbound, Amberbound, MaxWeight

### MUTATION_API_NAME (our name → AriesMod composed endpoint param)
- Amberlit → `Ambershine`
- Dawnbound → `Dawncharged`
- Amberbound → `Ambercharged`
- All others match display name

### PLANT_SPRITE_KEY (API key → sprite filename for composed endpoint)
Some plants have different API keys vs sprite filenames:
- `OrangeTulip` → `Tulip`
- `Clover` → `CloverThreeLeaf`
- `FourLeafClover` → `CloverFourLeaf`
- `Rose` → `RoseRed`
- `PurpleDaisy` → `DaisyPurple`
- `DawnCelestial` → `DawnCelestialCrop`
- `MoonCelestial` → `MoonCelestialCrop`
All others: API key = sprite filename (e.g. `Carrot` → `Carrot`)

### CROP_RARITY (sourced from API — note: API uses "Mythic" not "Mythical")
Key corrections vs wiki guesses:
- `FourLeafClover` → `Legendary` (not Uncommon)
- `PurpleDaisy` → `Legendary` (not Legendary was correct)
- All Mythic plants: `Mythic` spelling

### CROP_STATIC_DATA (wiki-sourced, all 54 crops)
Fields: `grow` (seconds), `regrow` (seconds|null), `baseWeight` (kg), `maxWeight` (kg)
Used by the modal for GROW / REGROW / WEIGHT stats since the API doesn't always return these.

### composedSpriteUrl(cropKey, variant)
Uses `PLANT_SPRITE_KEY[cropKey] ?? cropKey` to build `sprite/plant/<stem>`.
Appends `&mutations=<MUTATION_API_NAME[variant]>` for non-Normal/MaxWeight.

---

## 7. AriesMod API — verified from mg-data.json

- **54 plants** (not 47 as originally estimated)
- **23 pets** across 8 egg types
- **71 abilities** with `trigger`, `baseProbability`, `baseParameters`, `color` fields
- **10 mutations** (API keys: Gold, Rainbow, Wet, Chilled, Frozen, Thunderstruck, Dawnlit, Ambershine, Dawncharged, Ambercharged)
- **9 egg types**: CommonEgg, UncommonEgg, RareEgg, LegendaryEgg, SnowEgg, DawnEgg, HorseEgg, MythicalEgg, WinterEgg
- **6 weathers**: Rain, Frost, Thunderstorm, Dawn, AmberMoon, Sunny

Composed sprite endpoint: `/assets/sprites/composed?key=sprite/plant/<Name>&mutations=<ApiMutationName>`
- Handles tall plants automatically from server-side metadata
- Multiple mutations: `mutations=Wet,Gold` (comma-separated, any order)
- Gold = yellow colour filter applied server-side (no client CSS needed)

---

## 8. Supabase schema

```sql
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  item_type     text not null check (item_type in ('crop', 'pet')),
  item_key      text not null,    -- AriesMod API key e.g. 'FourLeafClover', 'OrangeTulip'
  variant_key   text not null,    -- e.g. 'Gold', 'Dawnlit', 'MaxWeight'
  discovered_at timestamptz not null default now(),
  unique (user_id, item_type, item_key, variant_key)
);
-- RLS: select/insert/delete restricted to auth.uid() = user_id
```

Always use `upsert` with `ignoreDuplicates: true` — never bare `insert`. Unique constraint causes optimistic UI revert on duplicate insert.

---

## 9. Lessons (do not relearn)

1. **Upsert not insert** — bare insert on existing row throws unique constraint → UI reverts
2. **PLANT_SPRITE_KEY** — must use sprite filename stem, not API key, for composed endpoint
3. **Rarity is "Mythic"** — API and sprite files use `Mythic`, not `Mythical`
4. **Composed endpoint auto-handles tall plants** — no need to specify `sprite/tallplant/`
5. **FourLeafClover rarity = Legendary** — not Uncommon (verified from API)
6. **mg-data.json** — uploaded by Shawn from browser console dump, contains all live API data. Use as ground truth. Stored at `/mnt/user-data/uploads/mg-data.json` in Claude sessions.

---

## 10. Pets page (0.8.0) — what we know from mg-data.json

From the API dump:
- 23 pets: Worm, Snail, Bee, Chicken, Bunny, Dragonfly, Pig, Cow, Turkey, Squirrel, Turtle, Goat, SnowFox, Stoat, WhiteCaribou (not "Caribou"), Pony, Sheep, Horse, Ostrich, FireHorse, Butterfly, Peacock, Capybara
- Pet fields: `sprite`, `rarity`, `hoursToMature`, `diet` (array of crop API keys), `innateAbilityWeights` (map of ability key → weight)
- `maxHunger` and `maxWeight` not in API — need from wiki
- Egg types confirmed: CommonEgg, UncommonEgg, RareEgg, LegendaryEgg, SnowEgg, DawnEgg, HorseEgg, MythicalEgg, WinterEgg
- Pet sprite path: `sprite/pet/<PetName>` for composed endpoint (Gold/Rainbow pets)

Pets page will mirror Plants: same grid + modal + conditions structure. Modal shows: diet crops, abilities (with trigger types from abilities data), egg source, hours to mature.

---

## 11. How to continue

1. Read this file.
2. Read `ARCHITECTURE_v0.3.0.md`.
3. Check `CHANGELOG_v0.3.0.md` for what shipped.
4. Ask: "What milestone are we on?"
5. The `mg-data.json` file has all game data — reference it before hardcoding anything.
