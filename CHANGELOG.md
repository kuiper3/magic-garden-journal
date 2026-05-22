# Changelog — Magic Garden Journal

> **Internal doc version:** `0.5.2` · **Last updated:** 2026-05-22
> Versions here track the **project** (package.json), not this document.

---

## [0.6.2] — 2026-05-22 *(Mutations + ability polish + plant card timing)*

### Changed
- **Mutations tab: all 4 variants** — Normal, Gold, Rainbow, Max Weight. Normal and
  Max Weight use the base pet sprite (no composed endpoint); Max Weight gets a scale +
  gold-glow CSS treatment matching the in-modal variant tile.
- **Mutations tab: egg-type multi-select filter** — pills for each egg type derived
  from the live pet data (Common, Uncommon, Rare, Legendary, Snow, Dawn, Horse,
  Mythical, Winter). Multi-select: click to toggle; no selection = show all.
  Combined with Show all / Missing-only, counts update to reflect the filtered set.
- **Ability display simplified** — removed weighted % share and progress bars.
  Now shows: ability name, trigger tag, and description only.
- **Plant card: grow + regrow time** — "⏱ Grow" row always shown; "🔄 Regrow"
  row appears only for multi-harvest crops (hidden when `null`). Values from
  `CROP_STATIC_DATA`.

### Notes
- Regrow in the **modal** stats grid was already correct (shows `—` for single-harvest,
  time for multi-harvest). The card was missing it; that's now fixed.
- Owned Pets (0.7.0) and per-pet feeding values (0.6.3) remain deferred; see §10–11.

## [0.6.1] — 2026-05-21 *(Pets: card + mutations tab)*

### Changed
- **Pet card now shows just the pet** (single hero sprite) — the egg was dropped
  from the card. The Egg → Pet flow lives in the modal instead.
- **Modal stages relabeled** to read `<Egg name> → <Pet name>`
  (e.g. "Snow Egg" → "Snow Fox") instead of generic "Egg"/"Pet".

### Added
- **Mutations tab** on the Pets page (`pets-conditions.js`), mirroring the crops
  Conditions tab: Gold / Rainbow sub-tabs, Show all / Missing-only filter, per-variant
  progress, grid of all pets with composed mutated sprites. Click opens the pet modal.
  `pets.js` gained a Pets | Mutations tab group.

### Deferred (next session) — head start in AI_HANDOFF §10–11
- **Eggs Explorer tab** — per egg, list spawnable pets + %. Uses live
  `/data/eggs` `faunaSpawnWeights`; no manual data needed.
- **Per-pet feeding / hunger values** — formula reverse-engineered from the in-game
  feeding tables (see handoff §11). Reduces transcription to one base value per
  (pet, crop) instead of the full mutation matrix.

## [0.6.0] — 2026-05-21 *(Pets page)*

### Added
- **Pets collection page** — full parity with Plants for discovery tracking.
  - `js/pages/pets.js` — orchestrator: search, Egg / A–Z sort, card + list views,
    Missing-only filter, overall progress. State persists across navigation.
  - `js/pages/pets-grid.js` — `buildPetCard` / `buildPetRow` / `filterPets`.
    Egg → Pet stage layout (vs. crops' Seed → Plant → Crop). Shows cheapest egg
    price + hours-to-mature. `petDisplayName()` spaces PascalCase keys
    (`SnowFox` → "Snow Fox"); `fmtHours()` renders mature time.
  - `js/pages/pets-modal.js` — egg source + price, rarity, mature time,
    **diet** crop chips (sprite + name), **innate abilities** (name, trigger,
    weighted % share, description), and the 4 variant tiles
    (Normal / Gold / Rainbow / MaxWeight) with Supabase tracking.
  - `css/pets.css` — diet chips, ability list, 3-up stat grid, 4-up variant grid.
- `aries.js`: `composedPetSpriteUrl(pet, variant)` + `PET_SPRITE_KEY` override map.
  The composed stem is derived from each pet's own `sprite` URL at runtime, so
  `SnowFox` / `WhiteCaribou` / `FireHorse` resolve without a hardcoded table.

### Notes
- **No schema migration needed** — `journal_entries.item_type` already allows `'pet'`.
- Pet diet sprites reuse cached `/data/plants`; abilities reuse `/data/abilities`.

### Deferred to 0.6.1
- **Owned Pets sub-tab** — tracks individual pet *instances* (name, weight, abilities);
  needs its own Supabase table, so it's split out from the discovery grid.
- **Pet Conditions tab** — only Gold + Rainbow qualify (2 variants); low value vs.
  the per-pet modal + Missing-only filter. Revisit if wanted.

## [0.5.9] — 2026-05-17

### Fixed
- Tab highlight desync: switching to Pets and back no longer shows the wrong tab active.
  `render()` now reads `_activeTab`, `_sortMode`, `_viewMode`, `_search` state when rebuilding
  the toolbar so every control reflects actual state on re-mount.
- Vercel build warning: added `"type": "module"` to `package.json`.
- `package.json` version bumped from `0.1.0` → `0.5.9`.

## [0.5.8] — 2026-05-17

### Fixed
- `plants-modal.js` syntax error: `function rarityIconName(rarity) { return rarity; // comment }`
  — closing brace was inside the comment, causing module parse failure and
  "Failed to load page. Try refreshing." across the entire app.

## [0.5.7] — 2026-05-17 *(sprite key fixes + static data)*

### Fixed
- Duplicate `export function composedSpriteUrl` in `aries.js` (caused module failure).

### Added
- `PLANT_SPRITE_KEY` map — corrects sprite filename stems for composed endpoint:
  `OrangeTulip→Tulip`, `Clover→CloverThreeLeaf`, `FourLeafClover→CloverFourLeaf`,
  `Rose→RoseRed`, `PurpleDaisy→DaisyPurple`, `DawnCelestial→DawnCelestialCrop`,
  `MoonCelestial→MoonCelestialCrop`.
- `CROP_STATIC_DATA` — grow, regrow (seconds), baseWeight, maxWeight (kg) for all 54 crops,
  wiki-sourced. Modal uses this since the API doesn't reliably return these fields.

### Changed
- `CROP_RARITY` corrected from `mg-data.json`: `FourLeafClover→Legendary`, rarity spelling
  now `Mythic` throughout (API uses `Mythic`, not `Mythical`).
- `CROP_ACQUISITION` sourced from API `eligibleShops` + `purchasable` flags.
- Acquisition badges use real game sprites (Dawn icon, Frost icon, CloverThreeLeaf, RoseRed).
- `MUTATION_SPRITES` and `WEATHER_SPRITES` confirmed from `mg-data.json`.
- Modal stats (GROW / REGROW / WEIGHT) now show correct values for every crop.

## [0.5.6] — 2026-05-16 *(conditions grid + card click fix)*

### Fixed
- Cards not clickable (ReferenceError: `isTallPlant` removed from import but still called).
- Conditions tab was a list — redesigned as clickable grid matching Plants layout.
- Clicking a Conditions card now opens the plant modal (full info + toggle).
- Rarity icons dark on dark backgrounds — added `rgba(0,0,0,0.45)` pill backdrop.

## [0.5.5] — 2026-05-16 *(aries.js ground truth from mg-data.json)*

### Changed
- All constants in `aries.js` sourced from live `mg-data.json` API dump.
- `fetchAbilities()` added.
- `icons.js` acquisition badges use real weather/plant sprites from the API.

## [0.5.4] — 2026-05-16 *(Aries-style card layout)*

### Added
- Seed → Plant → Crop stage row on every card using `seed.sprite`, `plant.sprite`, `crop.sprite`.
- Real rarity icon PNGs from `mg-api.ariedam.fr/assets/sprites/ui/RarityXxx.png`.
- Real coin PNG from `mg-api.ariedam.fr/assets/sprites/ui/Coin.png`.
- `icons.js` helper module.

## [0.5.3] — 2026-05-12 *(upsert fix + % on cards)*

### Fixed
- Upsert bug: `insert` → `upsert ignoreDuplicates:true` preventing tile revert.
- Mutation sprite lookup: normalised case-insensitive fallback.

### Added
- Variant order corrected to journal order.
- MaxWeight tile: golden border + glow + 1.25× scale.

## [0.5.2] — 2026-05-12 *(conditions + list view)*

### Added
- Conditions tab with variant filter pills + Show all / Missing only.
- List view toggle (compact rows with seed/sell price).
- Overall progress bar, search box, Missing only filter, A-Z sort.
- Check All + Clear All in modal.
- `plants-grid.js`, `plants-modal.js`, `plants-conditions.js` split.

## [0.5.1] — 2026-05-12 *(variant modal)*

### Added
- 12-variant drill-down modal with optimistic UI + Supabase upsert.

## [0.5.0] — 2026-05-12 *(plants grid)*

### Added
- 54-crop grid with AriesMod sprites, progress bars.
- `CROP_VARIANTS` (12), verified `CROP_ORDER` (54 keys from browser console).
- Sidebar nav (desktop) + bottom bar (mobile).

## [0.4.x] — 2026-05-12

- `0.4.0`: `cache.js` localStorage TTL, `aries.js` API client.
- `0.3.0`: Supabase auth live, `/api/config.js` Vercel function, password show/hide.
- `0.2.0`: Repo scaffold, all five planning docs, Vercel deploy, auth gate UI.

---

[0.5.9]: https://github.com/kuiper3/magic-garden-journal/compare/v0.5.8...v0.5.9
[0.5.8]: https://github.com/kuiper3/magic-garden-journal/compare/v0.5.7...v0.5.8
