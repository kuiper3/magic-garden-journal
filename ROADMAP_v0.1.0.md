# Roadmap — Magic Garden Journal

> **Document version:** `0.1.0`
> **Last updated:** 2026-05-11
> **Project version this reflects:** `0.1.0 — Unreleased`
>
> **Version history (this doc):**
> - `0.1.0` — Initial roadmap written during planning phase

---

> **Versioning convention:** [Semantic Versioning 2.0.0](https://semver.org). `0.x.y` = initial development. `1.0.0` = first daily-stable release. After 1.0.0: MAJOR = breaking changes, MINOR = new features, PATCH = fixes only.
>
> **Doc versioning convention:** Each planning doc has its own semver track. PATCH = typo/clarification. MINOR = new sections or meaningful content additions. MAJOR = structural overhaul of the doc.

---

## Phase 1 — Journal

### `0.1.0` — Scaffolding *(next session)*
- Fresh GitHub repo `magic-garden-journal`
- Repo skeleton matching `ARCHITECTURE_v0.1.0.md`
- `index.html` shell with auth gate (UI only)
- `js/app.js` empty router
- `.env.example`
- Vercel project created and deploying on push
- All five planning docs committed with versioned filenames
- **Done when:** Vercel URL shows a static login screen

### `0.2.0` — Supabase auth
- Supabase project provisioned
- Owner account created; sign-ups disabled
- Auth gate calls `supabase.auth.signInWithPassword`
- Session persists across reloads
- Sign-out button
- **Done when:** you can log in from phone and PC and stay signed in

### `0.3.0` — AriesMod client + cache layer
- `lib/aries.js` fetches `/data/plants`, `/data/pets`, `/data/mutations`, `/data/eggs`
- `lib/cache.js` localStorage TTL wrapper
- Force-refresh button in nav
- Graceful degradation when AriesMod is unreachable
- **Done when:** catalog loads, caches, and recovers from 5xx without crashing

### `0.4.0` — Plants page (grid)
- Plants tab renders 47+ crops in seed-shop price order
- Each card: sprite, name, progress bar (`x / N variants`)
- Variants derived from `/data/mutations`, not hardcoded
- Responsive grid: 3 cols desktop, 2 tablet, 1 phone
- **Done when:** grid visually matches the in-game journal

### `0.5.0` — Plants page (drill-down)
- Clicking a crop opens a modal: all variants for that crop
- Discovered = sprite + name; undiscovered = silhouette + "???"
- Tap variant → toggles discovered state → writes to Supabase
- Optimistic UI with rollback on error
- **Done when:** you can check off variants on phone and see them on PC after refresh

### `0.6.0` — Pets page
- Same grid + drill-down pattern as Plants
- Sort order from egg rarity via `/data/eggs`
- Includes Dawn-era pets automatically (no hardcoding)
- **Done when:** Pets tab feels identical in interaction to Plants

### `0.7.0` — Search & filter
- Search box (filter by name)
- "Show only incomplete" toggle
- Sort: rarity (default), alphabetical, progress %, recently discovered

### `0.8.0` — Mobile polish
- Bottom nav on mobile, sidebar on desktop
- Touch targets ≥ 44px
- iOS safe-area handling
- PWA manifest (no service worker)

### `0.9.0` — Bug bash & polish
- All console errors cleared
- Loading states for every async call
- Empty-state UI when catalog is unavailable
- Lighthouse ≥ 90 on all categories
- README finalized with screenshots

### `1.0.0` — Production stable
- No known crashes or data loss
- Used daily for at least one week
- Manual Supabase CSV backup documented

---

## Phase 2 — Stock module *(after Journal 1.0.0)*

Own repo: `magic-garden-stock`. Own semver.

- `0.1.0` — Repo + Vercel + planning docs
- `0.2.0` — SSE client to `/live/shops/stream`, raw output
- `0.3.0` — Styled shop panels with sprites
- `0.4.0` — Weather panel from `/live/weather/stream`
- `0.5.0` — Cycle history (last N rotations)
- `0.6.0` — Priority items highlight (config in localStorage)
- `0.7.0` — Mobile polish
- `1.0.0` — Stable

---

## Phase 3 — Alexa Bridge *(after Stock 1.0.0)*

Own repo: `magic-garden-alexa-bridge`. Own semver. Designed for public sharing.

- `0.1.0` — Repo + docs; barebones Node.js script
- `0.2.0` — SSE listener to AriesMod; console log on match
- `0.3.0` — Voice Monkey integration (SSML rules enforced)
- `0.4.0` — Cycle-key deduplication
- `0.5.0` — Config file: priority items, device, repeat behavior
- `0.6.0` — Deploy guide: Railway / Render / Pi
- `0.7.0` — Setup walkthrough README for non-technical users
- `1.0.0` — Public-share ready; no personal data in repo

---

## Out of scope

- Profit Manager (deferred indefinitely)
- Push notifications to phone
- Multi-user invitations / journal sharing
- Offline mode beyond cache TTL
- AI-generated content inside the app
