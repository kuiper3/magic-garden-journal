# Roadmap — Magic Garden Journal

> **Status 2026-06-06:** v0.9.0 shipped — Owned Pets (strength model, JSON import w/ auto-computed strength), sidebar overhaul, Settings hub (4 themes, backup, danger zone), guide, exporter userscript. Next major: Google sign-in. Next PROJECT: Stock Tracker (separate repo).


> **Internal doc version:** `0.4.0` · **Last updated:** 2026-05-17

---

## Phase 1 — Journal (active)

### ✅ 0.1–0.4 — Foundation
Scaffold, Supabase auth, AriesMod cache, plants grid, variant modal.

### ✅ 0.5.x — Plants page complete
Conditions grid, list view, Aries-style cards, composed variant sprites,
all stats from wiki, acquisition badges, upsert fix, tab state fix. **Done at 0.5.9.**

### ✅ 0.6.0 — Pets page *(shipped 2026-05-21)*
- 23-pet grid sorted by cheapest egg price (Egg mode) or A–Z
- Egg → Pet stage layout (egg sprite → hatched pet sprite)
- 4-variant modal: Normal, Gold, Rainbow, MaxWeight
- Pet detail: diet crops, innate abilities (trigger + weighted %), hours to mature
- No schema change — `item_type='pet'` reuses `journal_entries`

### ✅ 0.6.1 — Pets: pet-only cards, Egg→Pet modal, Mutations tab *(shipped 2026-05-21)*
- Card shows just the pet; modal shows Egg → Pet; Gold/Rainbow Mutations tab + Missing filter

### 0.6.2 — Eggs + feeding
- Eggs Explorer tab (live faunaSpawnWeights); per-pet feeding values (formula solved, see handoff §11)

### 0.6.3 — Owned Pets
- **Owned Pets sub-tab**: track individual pets (name, weight, current/max strength).
  Needs a new Supabase table (`owned_pets`) — discovery grid does not cover instances.
- Pet Conditions tab (Gold / Rainbow) — optional; low value, revisit on demand.
- Done when: Pets tab feels as complete as Plants.

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
