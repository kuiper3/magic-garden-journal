# Roadmap — Magic Garden Journal

> **Document version:** `0.2.0`
> **Last updated:** 2026-05-12
>
> **Version history (this doc):**
> - `0.1.0` — Initial roadmap during planning phase
> - `0.2.0` — Marked completed milestones, revised remaining

---

## Phase 1 — Journal (in progress)

### ✅ `0.1.0` — Scaffolding
### ✅ `0.2.0` — Supabase auth
### ✅ `0.3.0` — AriesMod cache layer
### ✅ `0.4.0` — Plants grid
### ✅ `0.5.0` — Variant drill-down modal
### ✅ `0.6.0` — Conditions tab, list view, search, sort, overall progress, rarity badges
### ✅ `0.6.1` — Upsert fix, % on cards, acquisition icons, mutation sprite normaliser, version in nav

### `0.7.0` — Pets page
- Pets grid: 23 pets sorted by egg rarity (Common → Mythical)
- 4-variant modal: Normal, Gold, Rainbow, MaxWeight
- Conditions tab: Gold and Rainbow filters across all pets
- **Owned Pets sub-tab** — track each individual pet you have: pet type, nickname, weight, abilities, current/max strength. Separate from the journal completion tracking.
- **Done when:** Pets tab feels as complete as Plants, including owned-pet entries

### `0.8.0` — Mobile polish
- Bottom nav comfortable on phone
- Touch targets ≥ 44px
- iOS safe-area padding
- PWA manifest + icon

### `0.9.0` — Bug bash
- All console errors cleared
- Loading states everywhere
- Lighthouse ≥ 90

### `1.0.0` — Production stable
- Used daily without crashes or data loss for one week
- Manual Supabase CSV backup documented

---

## Phase 2 — Stock *(after Journal 1.0.0)*
`magic-garden-stock` repo — SSE client to AriesMod `/live/stream`.

## Phase 3 — Alexa Bridge *(after Stock 1.0.0)*
`magic-garden-alexa-bridge` repo — shareable, designed for others to fork.

---

## Out of scope
- Profit Manager (deferred)
- Push notifications
- Multi-user invitations
