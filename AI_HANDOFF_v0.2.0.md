# AI Handoff — Magic Garden Journal

> **Document version:** `0.2.0`
> **Last updated:** 2026-05-12
> **Project version this reflects:** `0.6.1`
>
> **Version history (this doc):**
> - `0.1.0` — Initial handoff during planning phase
> - `0.2.0` — Updated to reflect all shipped code through v0.6.1

---

## 1. Project snapshot

- **Name:** Magic Garden Journal
- **Owner:** Shawn (GitHub: `kuiper3`)
- **Repo:** https://github.com/kuiper3/magic-garden-journal
- **Live URL:** https://magic-garden-journal.vercel.app
- **Current project version:** `0.6.1`
- **Status:** Plants page functional. Pets page is a stub. Auth works.

---

## 2. Doc version table

| Doc | Current version |
|---|---|
| `ARCHITECTURE` | `0.2.0` |
| `ROADMAP` | `0.2.0` |
| `README` | `0.2.0` |
| `CHANGELOG` | `0.2.0` |
| `AI_HANDOFF` *(this file)* | `0.2.0` |

Doc semver: PATCH = clarification, MINOR = new content, MAJOR = restructure.
When updating a doc: rename the file, bump the header, update this table.

---

## 3. The one thing not to repeat

Previous attempt (`mgclaude`) was a monolithic single-file app that outgrew the AI context window. Hard rules:
1. No file > ~250 lines. Split if it does.
2. `index.html` is a shell only — all logic in JS modules.
3. Game catalog data never stored locally — always fetch from AriesMod API.
4. Three separate repos — Journal, Stock, Alexa Bridge never share code.

---

## 4. Architecture in 60 seconds

Static site on Vercel. Supabase for auth + user data. AriesMod API for all game catalog data.

```
Browser → Vercel (static HTML/JS/CSS)
        → Supabase (auth session, journal_entries table)
        → mg-api.ariedam.fr (plants, pets, mutations, eggs — cached 1hr)
```

Full details: `ARCHITECTURE_v0.2.0.md`.

---

## 5. Repo file layout (current)

```
magic-garden-journal/
├── api/config.js              Vercel function — exposes SUPABASE_URL + SUPABASE_ANON_KEY
├── css/
│   ├── main.css               Auth gate, app shell, shared vars
│   ├── nav.css                Sidebar (desktop) + bottom bar (mobile)
│   ├── plants.css             Full plants page: toolbar, grid, list, modal, conditions
│   └── pets.css               Stub
├── js/
│   ├── app.js                 Router, nav render, auth bootstrap, version string
│   └── lib/
│   │   ├── aries.js           AriesMod API client + constants (CROP_VARIANTS, CROP_ORDER, RARITY_META, etc.)
│   │   ├── auth.js            Supabase auth wrappers
│   │   ├── cache.js           localStorage TTL cache
│   │   └── supabase.js        Supabase client (fetches config from /api/config)
│   └── pages/
│       ├── plants.js          Plants page orchestrator (tabs, toolbar, state)
│       ├── plants-grid.js     Card + list view builders, filter helper
│       ├── plants-modal.js    Variant modal, Check All, upsert toggle
│       ├── plants-conditions.js  Conditions tab
│       └── pets.js            Stub
└── index.html                 Shell — auth gate + app container
```

---

## 6. Key constants in aries.js

- **`CROP_VARIANTS`** — 12 variants: Normal, Wet, Chilled, Frozen, Thunderstruck, Dawnlit, Amberlit, Dawnbound, Amberbound, Gold, Rainbow, MaxWeight
- **`PET_VARIANTS`** — 4 variants: Normal, Gold, Rainbow, MaxWeight
- **`CROP_ORDER`** — 54 exact AriesMod API keys in in-game journal order (verified via browser console)
- **`CROP_RARITY`** — maps API key → rarity string
- **`RARITY_META`** — maps rarity → { color, symbol } for badges
- **`CROP_ACQUISITION`** — maps API key → acquisition note for crops not in standard seed shop
- **`VARIANT_CATEGORIES`** — groups variants into Weather / Lunar / Colour / Special for Conditions tab

---

## 7. AriesMod API — verified details

Base: `https://mg-api.ariedam.fr`
- Plants keyed by PascalCase names with no spaces (e.g. `FourLeafClover`, `OrangeTulip`, `DawnCelestial`, `MoonCelestial`)
- Dawnbinder = `DawnCelestial`, Moonbinder = `MoonCelestial` in the API
- Tulip = `OrangeTulip` in the API
- Mutation sprite lookup: use case-insensitive normalised match, not exact key, since API casing may differ from variant names

---

## 8. Supabase schema

```sql
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  item_type     text not null check (item_type in ('crop', 'pet')),
  item_key      text not null,    -- AriesMod API key, e.g. 'FourLeafClover'
  variant_key   text not null,    -- e.g. 'Gold', 'Dawnlit', 'MaxWeight'
  discovered_at timestamptz not null default now(),
  unique (user_id, item_type, item_key, variant_key)
);
```

RLS: users can only select/insert/delete their own rows. Sign-ups disabled at project level.

---

## 9. Known issues and lessons

**Upsert, not insert:** Supabase `insert` throws unique constraint error if row exists → causes optimistic UI to revert. Always use `upsert` with `ignoreDuplicates: true` for toggle operations.

**Mutation sprite keys:** AriesMod `/data/mutations` may return keys with different casing than our CROP_VARIANTS names. Use normalised matching (`k.toLowerCase().replace(/\s+/g,'')`) when looking up sprites.

**AriesMod key mismatches verified:**
- `Tulip` → `OrangeTulip`
- `Four-Leaf Clover` → `FourLeafClover`
- `Fava Bean` → `FavaBean`
- `Pine Tree` → `PineTree`
- `Burro's Tail` → `BurrosTail`
- `Dawnbinder` → `DawnCelestial`
- `Moonbinder` → `MoonCelestial`
- 54 total crops in API (not 47 as originally estimated)

**Acquisition icon semantics:** 🔒 was confusing — users thought it meant the variant was uneditable. Now uses type-specific icons: 🗓️ events, 🌅 Dawn Shop, 💬 Discord, 🎪 Carnival, 📱 iOS, 🍀 random chance.

**From previous build (still relevant for Phase 3 Alexa Bridge):**
- Priority string matching: use shortest unique partial match
- SSML timing: ≥1500ms lead break, ~500ms trail, item name first
- Voice Monkey doorbell is unavoidable — 1500ms break is the workaround

---

## 10. What's next

**0.7.0** — Pets page (mirrors Plants: grid, modal, Conditions tab, owned-pets tracking sub-tab)
**0.8.0** — Mobile polish, PWA manifest
**0.9.0** — Bug bash, Lighthouse ≥90
**1.0.0** — Production stable, manual Supabase CSV backup documented

Phase 2 (Stock) and Phase 3 (Alexa Bridge) start after Journal 1.0.0. See `ROADMAP_v0.2.0.md`.

---

## 11. How to bring a new AI session up to speed

1. Read this file.
2. Read `ARCHITECTURE_v0.2.0.md`.
3. Check `CHANGELOG_v0.2.0.md` for latest shipped changes.
4. Ask: "What milestone are we on, and what's blocking it?"
5. Never assume codebase state — check GitHub or ask to paste file contents.
