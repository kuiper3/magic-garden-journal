# AI Handoff — Magic Garden Journal

> **Internal doc version:** `0.4.0` · **Last updated:** 2026-05-17
> **Project version:** `0.5.9`

---

## 1. Project snapshot

- **Owner:** Shawn (GitHub: `kuiper3`)
- **Repo:** https://github.com/kuiper3/magic-garden-journal
- **Live:** https://magic-garden-journal.vercel.app
- **Current version:** `0.5.9` — Plants page complete, Pets stub
- **Next milestone:** `0.6.0` — Pets page

---

## 2. Architecture

Static site → Vercel. Auth + DB → Supabase. Game data → AriesMod API. No backend.

```
Browser
 ├─ /api/config.js  (Vercel fn — exposes SUPABASE_URL + SUPABASE_ANON_KEY)
 ├─ Supabase        (signInWithPassword, journal_entries RLS)
 └─ mg-api.ariedam.fr
     ├─ /data/plants|pets|mutations|eggs|abilities|weathers  (1hr cache)
     └─ /assets/sprites/composed?key=sprite/plant/<Name>&mutations=<Mut>
```

---

## 3. File layout

```
api/config.js               Vercel fn — exposes public Supabase env vars
css/main.css                Auth gate, shared vars
css/nav.css                 Sidebar + mobile bottom bar + version tag
css/plants.css              Full plants page (cards, modal, conditions, list)
css/pets.css                Stub — 0.6.0
js/app.js                   Router, nav, auth bootstrap, version string
js/lib/
  aries.js                  ALL constants + API client (single source of truth)
  icons.js                  Acquisition badges, formatters, seedFinderNote
  auth.js                   Supabase auth wrappers
  cache.js                  localStorage TTL cache
  supabase.js               Supabase client factory
js/pages/
  plants.js                 Orchestrator — tabs, toolbar, state (persists across nav)
  plants-grid.js            buildCard(), buildRow(), filterPlants()
  plants-modal.js           Modal, Check/Clear All, upsert toggle, variant tiles
  plants-conditions.js      Conditions grid — clickable, opens plant modal
  pets.js                   Stub — 0.6.0
index.html                  Shell only
package.json                type:module, version 0.5.9
```

---

## 4. Critical constants in aries.js (sourced from mg-data.json)

### CROP_VARIANTS (12, in journal order)
`Normal, Wet, Chilled, Frozen, Dawnlit, Amberlit, Thunderstruck, Gold, Rainbow, Dawnbound, Amberbound, MaxWeight`

### MUTATION_API_NAME — display name → composed endpoint param
| Display | API param |
|---|---|
| Amberlit | `Ambershine` |
| Dawnbound | `Dawncharged` |
| Amberbound | `Ambercharged` |
| All others | same as display name |

### PLANT_SPRITE_KEY — API key → sprite filename stem
| API key | Sprite stem |
|---|---|
| `OrangeTulip` | `Tulip` |
| `Clover` | `CloverThreeLeaf` |
| `FourLeafClover` | `CloverFourLeaf` |
| `Rose` | `RoseRed` |
| `PurpleDaisy` | `DaisyPurple` |
| `DawnCelestial` | `DawnCelestialCrop` |
| `MoonCelestial` | `MoonCelestialCrop` |
All other API keys match their sprite filename directly.

### CROP_RARITY (from mg-data.json)
- API uses `"Mythic"` not `"Mythical"` — everywhere in code uses `Mythic`
- `FourLeafClover` → `Legendary` (not Uncommon)
- `PurpleDaisy` → `Legendary`

### CROP_STATIC_DATA (wiki-sourced, all 54 crops)
Fields: `grow` (s), `regrow` (s|null), `baseWeight` (kg), `maxWeight` (kg)
Used by modal since the API doesn't reliably return these fields.
maxWeight = baseWeight × maxScale (Aries explorer "Max Scale" column).

### composedSpriteUrl(cropKey, variant)
Uses `PLANT_SPRITE_KEY[cropKey] ?? cropKey` for the stem.
`sprite/plant/<stem>` — server auto-detects tall plants, no `tallplant` needed.

---

## 5. Supabase schema

```sql
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  item_type     text not null check (item_type in ('crop', 'pet')),
  item_key      text not null,    -- API key e.g. 'FourLeafClover', 'OrangeTulip'
  variant_key   text not null,    -- e.g. 'Gold', 'Dawnlit', 'MaxWeight'
  discovered_at timestamptz not null default now(),
  unique (user_id, item_type, item_key, variant_key)
);
-- RLS: all ops restricted to auth.uid() = user_id
```

**Always `upsert` with `ignoreDuplicates:true`** — bare `insert` on existing row throws
unique constraint → optimistic UI reverts.

---

## 6. State persistence across navigation

`plants.js` keeps module-level state (`_activeTab`, `_sortMode`, `_viewMode`, `_search`,
`_missingOnly`, `_plants`, `_discovered`). When the user navigates away and back, `render()`
is called again but state variables persist — the template now reads these variables so
tabs, sort, view, and filter buttons correctly reflect state on re-mount.

---

## 7. Lessons (do not relearn)

1. **Upsert not insert** — unique constraint causes optimistic UI revert
2. **PLANT_SPRITE_KEY** — must use sprite stem, not API key, for composed endpoint
3. **Rarity is `Mythic`** — not `Mythical` anywhere in code, CSS, or sprite filenames
4. **Composed endpoint auto-handles tall plants** — always use `sprite/plant/`
5. **FourLeafClover rarity = Legendary** (not Uncommon, verified from API)
6. **`mg-data.json`** — uploaded by Shawn from browser console dump. Ground truth.
   Path in Claude sessions: `/mnt/user-data/uploads/mg-data.json`
7. **Inline comments eat closing braces** — `{ return x; // comment }` is broken JS.
   Always put the `}` on its own line when a comment is present.
8. **`type: "module"` in package.json** — suppresses Vercel ESM→CJS warning for api/config.js

---

## 8. Pets page (0.6.0) — known from mg-data.json

- 23 pets: Worm, Snail, Bee, Chicken, Bunny, Dragonfly, Pig, Cow, Turkey, Squirrel,
  Turtle, Goat, SnowFox, Stoat, WhiteCaribou, Pony, Sheep, Horse, Ostrich, FireHorse,
  Butterfly, Peacock, Capybara
- Fields: `sprite`, `rarity`, `hoursToMature`, `diet` (array of crop keys),
  `innateAbilityWeights` (map of ability key → weight)
- Egg types: CommonEgg, UncommonEgg, RareEgg, LegendaryEgg, SnowEgg, DawnEgg,
  HorseEgg, MythicalEgg, WinterEgg (9 total)
- Pet composed sprites: `sprite/pet/<PetName>&mutations=Gold` etc.
- Modal will show: diet crops, innate abilities with trigger types, egg source, hours to mature
- "Owned Pets" sub-tab: track individual pets (name, weight, abilities)
- 4 variants: Normal, Gold, Rainbow, MaxWeight

---

## 9. How to start a new session

1. Read this file.
2. Check `CHANGELOG.md` for latest shipped version.
3. Ask Shawn what milestone we're on and what's blocking.
4. Never assume codebase state — ask to paste or reference GitHub.
5. Reference `mg-data.json` before hardcoding any game constant.
