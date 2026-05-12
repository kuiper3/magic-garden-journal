# Changelog — Magic Garden Journal

> **Document version:** `0.2.0`
> **Last updated:** 2026-05-12
>
> **Version history (this doc):**
> - `0.1.0` — Initial changelog created during planning phase
> - `0.2.0` — Added released milestones 0.1.0 through 0.6.1

---

All notable changes to **Magic Garden Journal** are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

## [0.6.1] — 2026-05-12

### Fixed
- **Upsert bug** — tile toggle used `insert` which failed with Supabase unique constraint when a row already existed, causing optimistic UI to revert. Changed to `upsert` with `ignoreDuplicates: true`.
- Mutation sprite lookup now uses case-insensitive normalised matching so Amberlit, Dawnbound, Amberbound sprites resolve even if API key casing differs.

### Changed
- Progress now shows `disc/total · pct%` in both card and modal (was `disc / total` only).
- Seed price `🌰 Xk` now visible on each card in card view.
- Acquisition source icons changed from generic 🔒 to type-specific icons (🗓️ event, 🌅 Dawn Shop, 💬 Discord, 🎪 Carnival, 📱 iOS, 🍀 random chance) to avoid confusion with "locked/uneditable".
- List view rows now show acquisition note as readable text under crop name.
- Modal detail pills expanded to include weight range and grow time.
- App version `v0.6.1` now visible in nav sidebar.

## [0.6.0] — 2026-05-12

### Added
- **Conditions tab** — select any mutation (Wet, Chilled, Gold, etc.) and see all crops with Show All / Missing Only toggle.
- **Overall progress bar** — top of Plants page shows total `X% · disc / total` across all crops.
- **List view** — toggle between card grid and compact list with seed price, sell price, and progress bar.
- **Sort toggle** — Journal order (in-game) or A–Z; Price sort removed.
- **Missing only filter** — show only incomplete crops.
- **Search box** — filter by crop name.
- **Check All button** in variant modal.
- **Rarity badges** (○◉◈★✦✧✸) on cards using `RARITY_META` colour coding.
- `CROP_RARITY`, `RARITY_META`, `CROP_ACQUISITION`, `VARIANT_CATEGORIES` constants added to `aries.js`.
- Plants page split into four modules: `plants.js` (orchestrator), `plants-grid.js`, `plants-modal.js`, `plants-conditions.js`.

### Fixed
- CROP_ORDER now uses exact AriesMod API keys verified from live console output (OrangeTulip, FourLeafClover, DawnCelestial, MoonCelestial, etc.).

## [0.5.0] — 2026-05-12

### Added
- **Variant drill-down modal** — click any plant card to open modal showing all 12 variant tiles.
- Discovered variants: full colour sprite. Undiscovered: dimmed/greyscale + dashed border.
- Tap variant tile to toggle discovered state — writes to Supabase `journal_entries`.
- Optimistic UI with rollback on Supabase error.
- Esc key closes modal.

## [0.4.0] — 2026-05-12

### Added
- **Plants grid** — 54 crops from AriesMod API rendered as cards with sprites and progress bars.
- `CROP_VARIANTS` constant (12 variants) as game constant, not derived from API.
- `CROP_ORDER` for in-game journal sort order.
- Sort toggle: Journal / Price / A–Z.
- Nav sidebar (desktop) and bottom bar (mobile) with Plants and Pets links.
- Sign out button in nav.

## [0.3.0] — 2026-05-12

### Added
- `js/lib/cache.js` — localStorage TTL cache wrapper.
- `js/lib/aries.js` — AriesMod API client with 1-hour cache for plants, pets, mutations, eggs.

## [0.2.0] — 2026-05-12

### Added
- Supabase Auth wired — real `signInWithPassword`, `getSession`, `onAuthStateChange`.
- `/api/config.js` Vercel serverless function exposes `SUPABASE_URL` + `SUPABASE_ANON_KEY` to browser.
- Password show/hide toggle on login form.

### Fixed
- Login form was throwing stub error — updated `auth.js` and `supabase.js` from stubs to live implementations.

## [0.1.0] — 2026-05-11

### Added
- GitHub repo `magic-garden-journal` created.
- Full repo scaffold: `index.html`, `js/app.js`, `js/lib/` stubs, `js/pages/` stubs, all CSS files.
- `vercel.json` with SPA rewrites and security headers.
- `package.json` at `v0.1.0`.
- Five planning docs committed: `ARCHITECTURE_v0.1.0.md`, `ROADMAP_v0.1.0.md`, `README_v0.1.0.md`, `CHANGELOG_v0.1.0.md`, `AI_HANDOFF_v0.1.0.md`.
- Vercel project connected and deploying from GitHub main.
- Dark forest-themed auth gate with floating particle background.

---

[Unreleased]: https://github.com/kuiper3/magic-garden-journal/compare/v0.6.1...HEAD
[0.6.1]: https://github.com/kuiper3/magic-garden-journal/releases/tag/v0.6.1
[0.6.0]: https://github.com/kuiper3/magic-garden-journal/releases/tag/v0.6.0
[0.5.0]: https://github.com/kuiper3/magic-garden-journal/releases/tag/v0.5.0
[0.4.0]: https://github.com/kuiper3/magic-garden-journal/releases/tag/v0.4.0
[0.3.0]: https://github.com/kuiper3/magic-garden-journal/releases/tag/v0.3.0
[0.2.0]: https://github.com/kuiper3/magic-garden-journal/releases/tag/v0.2.0
[0.1.0]: https://github.com/kuiper3/magic-garden-journal/releases/tag/v0.1.0
