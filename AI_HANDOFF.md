# AI Handoff — Magic Garden Journal

> **Internal doc version:** `0.5.0` · **Last updated:** 2026-05-21
> **Project version:** `0.6.0`

---

## 1. Project snapshot

- **Owner:** Shawn (GitHub: `kuiper3`)
- **Repo:** https://github.com/kuiper3/magic-garden-journal
- **Live:** https://magic-garden-journal.vercel.app
- **Current version:** `0.6.0` — Plants + Pets discovery pages complete
- **Next milestone:** `0.6.1` — Owned Pets sub-tab (new `owned_pets` table)

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
css/pets.css                Pets page — diet chips, ability list, grids (loads w/ plants.css)
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
  pets.js                   Orchestrator — grid, Egg/A–Z sort, modal, progress
  pets-grid.js              buildPetCard(), buildPetRow(), filterPets()
  pets-modal.js             Modal — egg, diet chips, abilities, 4 variant tiles
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
9. **Pet composed sprites** — derive the stem from `pet.sprite`'s filename, not the API
   key. `petSpriteStem()` strips the `?v=` query + extension. `PET_SPRITE_KEY` is an
   override map only (empty unless a specific pet's Gold/Rainbow sprite 404s).
10. **Pet display names** — keys are PascalCase; `petDisplayName()` inserts spaces
    (`WhiteCaribou` → "White Caribou"). Prefer an API `name` field if one ever appears.

---

## 8. Pets page (0.6.0) — shipped

- **Data:** `getPetsSorted()` in `aries.js` returns pets keyed from `/data/pets`,
  each annotated with `eggName` + `eggPrice` (cheapest egg whose `faunaSpawnWeights`
  includes the pet). Default sort = egg price; A–Z re-sorts by display name.
- **Sprites:** `composedPetSpriteUrl(pet, variant)` — Normal/MaxWeight use the base
  `pet.sprite`; Gold/Rainbow hit `sprite/pet/<stem>&mutations=<Gold|Rainbow>`.
  `<stem>` is parsed from the pet's own `sprite` URL (`petSpriteStem`), so no
  hardcoded key map is needed. `PET_SPRITE_KEY` exists as an override only.
- **Modal** shows: Egg → Pet stages, egg source + price, rarity, hours to mature,
  diet (crop chips — sprites pulled from cached `/data/plants`), innate abilities
  (name + trigger + weighted % share + description from `/data/abilities`), and the
  4 variant tiles. Tile toggles upsert/delete `journal_entries` with `item_type='pet'`.
- **4 variants:** Normal, Gold, Rainbow, MaxWeight (`PET_VARIANTS`).
- **No schema migration** — `item_type='pet'` was already in the CHECK constraint.

### Deferred to 0.6.1
- **Owned Pets sub-tab** — individual instances (name, weight, abilities). Does NOT
  fit `journal_entries` (one row per *discovery*, not per *instance*). Needs a new
  table, e.g.:
  ```sql
  create table public.owned_pets (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users(id) on delete cascade,
    pet_key    text not null,         -- API key, e.g. 'SnowFox'
    nickname   text,
    weight_kg  numeric,
    variant    text,                  -- Normal | Gold | Rainbow
    abilities  jsonb,                 -- chosen/rolled abilities
    created_at timestamptz not null default now()
  );
  -- RLS: all ops where auth.uid() = user_id
  ```
- **Pet Conditions tab** — only Gold + Rainbow qualify; deferred (low value).

---

## 9. How to start a new session

1. Read this file.
2. Check `CHANGELOG.md` for latest shipped version.
3. Ask Shawn what milestone we're on and what's blocking.
4. Never assume codebase state — ask to paste or reference GitHub.
5. Reference `mg-data.json` before hardcoding any game constant.
