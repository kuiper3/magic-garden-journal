# Roadmap — Magic Garden Journal

> **Internal doc version:** `0.4.0` · **Last updated:** 2026-05-17

---

## Phase 1 — Journal (active)

### ✅ 0.1–0.4 — Foundation
Scaffold, Supabase auth, AriesMod cache, plants grid, variant modal.

### ✅ 0.5.x — Plants page complete
Conditions grid, list view, Aries-style cards, composed variant sprites,
all stats from wiki, acquisition badges, upsert fix, tab state fix. **Done at 0.5.9.**

### 0.6.0 — Pets page
- 23 pets grid, sorted by egg type (Common → Mythical)
- Same Seed→Egg→Pet stage layout (egg sprite → hatched pet sprite)  
- 4-variant modal: Normal, Gold, Rainbow, MaxWeight
- Pet detail: diet crops, innate abilities with trigger types, hours to mature
- Conditions tab: Gold and Rainbow pet variants
- **Owned Pets sub-tab**: track individual pets (name, weight, current/max strength)
- Done when: Pets tab feels as complete as Plants

### 0.7.0 — Polish
- Mobile bottom nav, touch targets ≥ 44px, iOS safe-area
- PWA manifest + icon
- Lighthouse ≥ 90

### 1.0.0 — Production stable
- One week of daily use without crashes or data loss
- Supabase CSV backup documented

---

## Phase 2 — Stock *(after 1.0.0)*
`magic-garden-stock` repo — SSE stream viewer for shop + weather.

## Phase 3 — Alexa Bridge *(after Stock 1.0.0)*
`magic-garden-alexa-bridge` — shareable Voice Monkey integration.
