# Changelog — Magic Garden Journal

> **Document version:** `0.3.0`
> **Last updated:** 2026-05-16
>
> **Version history (this doc):**
> - `0.1.0` — Initial
> - `0.2.0` — Through v0.6.1
> - `0.3.0` — Through v0.7.1

---

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.7.1] — 2026-05-16

### Fixed
- Cards not opening (ReferenceError: `isTallPlant` removed from import but still called)
- Conditions tab was a list — redesigned as clickable grid matching Plants layout
- Clicking a Conditions card now opens the same plant modal (full info + toggle)
- Rarity badges dark on dark — added `rgba(0,0,0,0.45)` pill backdrop
- Mutation sprites in conditions now show actual per-crop mutated sprite via composed endpoint

### Added
- `PLANT_SPRITE_KEY` map — corrects sprite filename stems for composed endpoint:
  OrangeTulip→Tulip, Clover→CloverThreeLeaf, FourLeafClover→CloverFourLeaf,
  Rose→RoseRed, PurpleDaisy→DaisyPurple, DawnCelestial→DawnCelestialCrop,
  MoonCelestial→MoonCelestialCrop
- `CROP_STATIC_DATA` — grow time, regrow time, base weight, max weight for all 54 crops
  (wiki-sourced; modal uses this since API doesn't reliably return these fields)
- Modal now shows correct GROW / REGROW / WEIGHT stats for every crop

### Changed
- `CROP_RARITY` corrected from mg-data.json: FourLeafClover→Legendary, all Mythic→"Mythic"
- `CROP_ACQUISITION` sourced from API `eligibleShops`+`purchasable` flags
- Acquisition badges use real game sprites: Dawn→DawnIcon.png, Winter→FrostIcon.png,
  St. Pat's→CloverThreeLeaf.png, Rose Day→RoseRed.png, Chance→CloverFourLeaf.png
- `MUTATION_SPRITES` confirmed from mg-data.json
- `WEATHER_SPRITES` confirmed from mg-data.json

## [0.7.0] — 2026-05-16

### Added
- Aries Explorer-inspired card layout: Seed → Plant → Crop stage row
- Real rarity icons from `mg-api.ariedam.fr/assets/sprites/ui/RarityXxx.png`
- Real coin icon from `mg-api.ariedam.fr/assets/sprites/ui/Coin.png`
- Sell price icon (SVG up-arrow) matching Aries explorer style
- `icons.js` helper module (acquisition badges, formatters, seed finder note)
- Modal: rarity icon, harvest type, acquisition source, seed finder note, full stats grid

### Changed
- Conditions tab: per-crop mutated sprites via composed endpoint (wet carrot, not wet icon)

## [0.6.1] — 2026-05-12

### Fixed
- Upsert bug: `insert` → `upsert ignoreDuplicates:true` (was causing tile revert on duplicate)
- Mutation sprite lookup: normalised case-insensitive fallback

### Changed
- Variant order corrected: Normal, Wet, Chilled, Frozen, Dawnlit, Amberlit, Thunderstruck,
  Gold, Rainbow, Dawnbound, Amberbound, MaxWeight
- MaxWeight tile: golden border + glow + 1.25× scale

## [0.6.0] — 2026-05-12

### Added
- Conditions tab with variant filter pills + Show all/Missing only
- List view toggle (compact rows with seed price, sell price)
- Overall progress bar (journal-wide %)
- Search box, Missing only filter, A-Z sort
- Check All + Clear All buttons in modal
- Rarity badges with `RARITY_META` colour coding
- `icons.js`, `plants-grid.js`, `plants-modal.js`, `plants-conditions.js` split

## [0.5.0] — 2026-05-12 — 0.5.x

### Added
- Variant drill-down modal with 12 tiles per crop
- Optimistic UI with Supabase upsert
- Esc key closes modal

## [0.4.0] — 2026-05-12

### Added
- Plants grid (54 crops), AriesMod sprites, progress bars
- `CROP_VARIANTS` (12), `CROP_ORDER` (54 verified keys)
- Sidebar nav (desktop) + bottom bar (mobile)

## [0.3.0] — 2026-05-12
- `cache.js` localStorage TTL wrapper
- `aries.js` AriesMod API client

## [0.2.0] — 2026-05-12
- Supabase auth live (`signInWithPassword`, session persistence)
- `/api/config.js` Vercel function for env var injection
- Password show/hide toggle

## [0.1.0] — 2026-05-11
- Repo scaffold, Vercel deploy, auth gate UI, all 5 planning docs

---

[Unreleased]: https://github.com/kuiper3/magic-garden-journal/compare/v0.7.1...HEAD
[0.7.1]: https://github.com/kuiper3/magic-garden-journal/releases/tag/v0.7.1
