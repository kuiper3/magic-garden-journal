# Architecture — Magic Garden Journal

> **Document version:** `0.2.0`
> **Last updated:** 2026-05-12
> **Project version this reflects:** `0.6.1`
>
> **Version history (this doc):**
> - `0.1.0` — Initial architecture during planning phase
> - `0.2.0` — Updated to reflect actual shipped implementation

---

## 1. System overview

Three independent repos sharing one upstream data source:

| Component | Repo | Status | Purpose |
|---|---|---|---|
| **Journal** | `magic-garden-journal` | Active | Personal crop & pet variant tracker |
| **Stock** | `magic-garden-stock` | Not started | Live shop & weather viewer (Phase 2) |
| **Alexa Bridge** | `magic-garden-alexa-bridge` | Not started | Voice alerts for priority items (Phase 3) |

---

## 2. Tech stack (Journal)

| Layer | Choice |
|---|---|
| Hosting | Vercel (static) |
| Auth + DB | Supabase (email/password, Postgres, RLS) |
| Game data | AriesMod API `mg-api.ariedam.fr` |
| Frontend | Vanilla JS ES modules, plain CSS, no framework, no build step |

---

## 3. Data flow

```
Browser
  │── Vercel static (HTML/JS/CSS)
  │── Supabase
  │     ├─ auth.signInWithPassword
  │     └─ journal_entries (RLS: user_id = auth.uid())
  └── mg-api.ariedam.fr
        ├─ GET /data/plants    (1hr localStorage cache)
        ├─ GET /data/pets
        ├─ GET /data/mutations
        └─ GET /data/eggs
```

`/api/config.js` is a Vercel Function that exposes `SUPABASE_URL` and `SUPABASE_ANON_KEY`
from env vars to the browser (required because Vercel doesn't auto-inject env vars into
no-build static sites).

---

## 4. Module layout

```
index.html             Shell — auth gate div + app div
js/app.js              Router, nav render (with version), auth bootstrap
js/lib/
  aries.js             AriesMod client + all game constants
  auth.js              Supabase auth wrappers (signIn, signOut, getSession, initAuth)
  cache.js             localStorage TTL wrapper
  supabase.js          Supabase client factory (fetches config from /api/config)
js/pages/
  plants.js            Orchestrator — state, toolbar, tabs, overall progress
  plants-grid.js       buildCard(), buildRow(), filterPlants()
  plants-modal.js      openModal(), closeModal(), tile toggle (upsert), Check All
  plants-conditions.js Conditions tab — variant pills, show-all/missing-only
  pets.js              Stub — 0.7.0
css/
  main.css             Auth gate, reset, shared vars, app shell
  nav.css              Sidebar + bottom nav + version tag
  plants.css           Full plants page styles
  pets.css             Stub
api/
  config.js            Vercel Function — returns { supabaseUrl, supabaseAnon }
```

---

## 5. Supabase schema

```sql
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  item_type     text not null check (item_type in ('crop', 'pet')),
  item_key      text not null,
  variant_key   text not null,
  discovered_at timestamptz not null default now(),
  unique (user_id, item_type, item_key, variant_key)
);
-- RLS policies: select/insert/delete restricted to auth.uid() = user_id
```

Presence = discovered. Absence = undiscovered. Never store `discovered: false`.
Max ~648 crop rows + ~92 pet rows per user when fully complete.

---

## 6. Game constants (aries.js)

All variant lists and ordering are hardcoded game constants, never derived from the API.
The API is used for sprites, prices, weights, and grow times only.

- `CROP_VARIANTS` — 12 variants per crop
- `PET_VARIANTS` — 4 variants per pet
- `CROP_ORDER` — 54 crops in in-game journal order (exact API keys, verified from live console)
- `CROP_RARITY` — API key → rarity tier
- `RARITY_META` — rarity → { color hex, symbol char }
- `CROP_ACQUISITION` — API key → plain-text note for non-standard crops
- `VARIANT_CATEGORIES` — variant → category for Conditions tab

---

## 7. Known API quirks

- API keys are PascalCase, no spaces/apostrophes: `FourLeafClover`, `BurrosTail`, `OrangeTulip`
- Dawnbinder = `DawnCelestial`, Moonbinder = `MoonCelestial`
- 54 crops total (not 47 as originally estimated from wiki)
- Mutation sprite keys may differ in casing — use normalised match
- CORS is open — direct browser fetch works

---

## 8. Out of scope

- Profit Manager (deferred)
- Push notifications
- Multi-user invitations
- Offline mode beyond 1hr cache
