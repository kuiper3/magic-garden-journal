# Roadmap — Magic Garden Journal

> **Document version:** `0.3.0`
> **Last updated:** 2026-05-16

---

## Phase 1 — Journal

### ✅ 0.1.0 — Scaffold
### ✅ 0.2.0 — Supabase auth
### ✅ 0.3.0 — AriesMod cache layer
### ✅ 0.4.0 — Plants grid (54 crops, sprites, progress)
### ✅ 0.5.0 — Variant modal (12 tiles, upsert toggle)
### ✅ 0.6.0 — Conditions tab, list view, search, sort, overall progress
### ✅ 0.6.1 — Upsert fix, % on cards, acquisition icons
### ✅ 0.7.0 — Aries-style cards (Seed→Plant→Crop stages, real coin/rarity icons)
### ✅ 0.7.1 — Sprite key fixes, CROP_STATIC_DATA, conditions grid, rarity backdrop

### 0.8.0 — Pets page
- Grid of 23 pets sorted by egg type (CommonEgg → MythicalEgg)
- Same Seed→Egg→Pet stage layout as Plants (egg sprite → pet sprite)
- 4-variant modal: Normal, Gold, Rainbow, MaxWeight
- Pet detail: diet crops, innate abilities with trigger types, hours to mature
- Conditions tab for Gold and Rainbow pet variants
- **Owned Pets sub-tab**: track individual pets (name, weight, current/max strength, abilities)
- Done when: Pets tab matches Plants in completeness

### 0.9.0 — Polish
- Mobile bottom nav comfortable
- Touch targets ≥ 44px
- iOS safe-area padding
- PWA manifest + icon
- Lighthouse ≥ 90

### 1.0.0 — Production stable
- No crashes or data loss for one week of daily use
- Manual Supabase CSV backup documented

---

## Phase 2 — Stock *(after 1.0.0)*
`magic-garden-stock` — SSE client to `/live/stream`, shop + weather panels

## Phase 3 — Alexa Bridge *(after Stock 1.0.0)*
`magic-garden-alexa-bridge` — shareable, no personal data
