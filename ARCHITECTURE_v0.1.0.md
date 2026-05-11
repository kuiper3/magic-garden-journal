# Architecture — Magic Garden Journal

> **Document version:** `0.1.0`
> **Last updated:** 2026-05-11
> **Project version this reflects:** `0.1.0 — Unreleased`
>
> **Version history (this doc):**
> - `0.1.0` — Initial architecture written during planning phase

---

> **Status:** Pre-implementation. This document describes the intended architecture for the rebuild. Bracketed items (`[…]`) are placeholders to fill in once provisioned.

---

## 1. System overview

The Magic Garden ecosystem is split across **three independent components**, each in its own GitHub repository:

| Component | Repo (planned) | Purpose | Audience |
|---|---|---|---|
| **Journal** | `magic-garden-journal` | Personal, password-protected web app that tracks discovered crop & pet variants | Owner only (you) |
| **Stock** | `magic-garden-stock` | Live shop & weather viewer | Owner only (initially); shareable later |
| **Alexa Bridge** | `magic-garden-alexa-bridge` | Subscribes to AriesMod SSE, fires Voice Monkey announcements for priority items | Shareable — designed for others to fork |

The three components share no code and no runtime dependencies on each other. Each subscribes independently to the upstream AriesMod API. This isolation is intentional: the Bridge must remain easy for other users to clone and configure without inheriting your Supabase keys, your password, or your data.

---

## 2. Why this is different from the previous build

| Previous | New |
|---|---|
| `mgclaude` self-hosted Discord bot + Railway server scraping shop messages | Subscribes to AriesMod public API; no scraping, no Railway |
| Game catalog (crops, pets, mutations) hardcoded in a monolithic HTML file | Catalog fetched live from `/data/*` AriesMod endpoints; no local catalog data |
| Single-file v29-style monolith → context-window problems | Modular per-page JS + CSS files; no file exceeds ~250 lines |
| Stock + Journal + Profit Manager in one app | Three separate apps with their own release cycles |
| Hardcoded variant lists | Variants derived dynamically from `/data/mutations` so new game content appears automatically |

---

## 3. Phase 1: Journal — tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Hosting | Vercel (static) | Matches PomoCube pattern; free tier sufficient; HTTPS + CDN included |
| Auth | Supabase Auth (email/password) | Single sign-in works across phone + PC via session cookies; free; supports future multi-user expansion at no cost |
| User-state DB | Supabase Postgres | Same project as Auth; RLS ties data to `auth.uid()` |
| Game catalog | AriesMod API (`https://mg-api.ariedam.fr`) | No local copy; auto-updates with game patches |
| Frontend | Vanilla JS + ES modules, no framework | Keeps file sizes tiny; avoids build-step complexity |
| CSS | Plain CSS per page, one shared `main.css` | No Tailwind, no preprocessor |

No backend server. No Railway. Everything is either static (Vercel) or managed (Supabase, AriesMod).

---

## 4. Data flow

```
┌──────────────┐        ┌─────────────────────┐
│   Browser    │◀──────▶│  Vercel (static)    │
│ (phone/PC)   │        │  HTML + JS + CSS    │
└──────┬───────┘        └─────────────────────┘
       │
       │ 1. Auth (email/password)
       ▼
┌──────────────────────────────────┐
│  Supabase                        │
│  • auth.users (Shawn only)       │
│  • public.journal_entries (RLS)  │
└──────────────────────────────────┘
       ▲
       │ 2. Read/write journal state
       │
┌──────┴───────┐
│   Browser    │
└──────┬───────┘
       │ 3. Fetch catalog (cached 5min)
       ▼
┌──────────────────────────────────┐
│  AriesMod API                    │
│  /data/plants  /data/pets        │
│  /data/mutations  /data/eggs     │
│  + sprite URLs                   │
└──────────────────────────────────┘
```

No data flows between Supabase and AriesMod. The browser is the only orchestrator.

---

## 5. Journal — repo layout

```
magic-garden-journal/
├── README_v0.1.0.md
├── CHANGELOG_v0.1.0.md
├── ARCHITECTURE_v0.1.0.md       (this file)
├── ROADMAP_v0.1.0.md
├── AI_HANDOFF_v0.1.0.md
├── package.json
├── vercel.json
├── index.html
├── css/
│   ├── main.css
│   ├── nav.css
│   ├── plants.css
│   └── pets.css
├── js/
│   ├── app.js
│   ├── lib/
│   │   ├── aries.js
│   │   ├── supabase.js
│   │   ├── auth.js
│   │   └── cache.js
│   └── pages/
│       ├── plants.js
│       └── pets.js
└── .env.example
```

**Hard rules:**
- No JS file exceeds 250 lines. Split if it does.
- Every page module exports `{ render(container), init(), destroy() }`.
- No code in `index.html` beyond the shell — all logic in JS modules.

---

## 6. Supabase schema

```sql
create table public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  item_type     text not null check (item_type in ('crop', 'pet')),
  item_key      text not null,        -- e.g. 'Carrot', 'Capybara'
  variant_key   text not null,        -- e.g. 'Normal', 'Gold', 'Dawnlit'
  discovered_at timestamptz not null default now(),

  unique (user_id, item_type, item_key, variant_key)
);

alter table public.journal_entries enable row level security;

create policy "users see own entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "users insert own entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "users delete own entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);
```

Entry presence = discovered. Absence = undiscovered. No "discovered: false" rows. Max ~648 rows per user when fully complete.

---

## 7. AriesMod integration

### Endpoints used (Phase 1)

| Endpoint | Used for | Cache TTL |
|---|---|---|
| `GET /data/plants` | Crop list, names, sprites | 5 min in-memory, 1 hr localStorage |
| `GET /data/pets` | Pet list, names, sprites | 5 min in-memory, 1 hr localStorage |
| `GET /data/mutations` | Variant definitions (source of truth) | 5 min in-memory, 1 hr localStorage |
| `GET /data/eggs` | Pet rarity grouping for sort order | 5 min in-memory, 1 hr localStorage |

### Variant derivation

Do not hardcode the variant list. The Journal reads `/data/mutations` and partitions by item type. `Normal` and `MaxWeight` are always-applicable. New Dawn-era variants appear automatically.

### Known behaviors

- API is unofficial; may briefly break during game patches. Show graceful fallback, not a blank page.
- CORS is open — direct browser fetch works fine.
- Sprite URLs are absolute and point to AriesMod's host. Use them directly.

---

## 8. Auth & access control

- Sign-up is disabled in Supabase after owner account is created.
- Auth gate in `index.html` shows login form until a Supabase session exists.
- Session persists via Supabase's default localStorage strategy.
- RLS enforces data isolation regardless of client-side auth state.

---

## 9. Phase 2 preview: Stock module

SSE client to `https://mg-api.ariedam.fr/live/stream`. Two panels: current shop inventory and current weather. No backend, no DB. Separate Vercel project.

## 10. Phase 3 preview: Alexa Bridge

Node.js script subscribing to AriesMod SSE. Checks against `PRIORITY_ITEMS` config. Fires Voice Monkey with SSML-wrapped TTS. Deduplicates by cycle key. Designed for forking — no personal data in repo.

---

## 11. Out of scope (for now)

- Profit Manager
- Push notifications
- Multi-user invitations
- Offline mode beyond cache TTL
- AI-generated content inside the app
