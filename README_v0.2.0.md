# Magic Garden Journal

> **Document version:** `0.2.0` · **Project version:** `0.6.1`
> **Last updated:** 2026-05-12

A personal, password-protected web app for tracking discovered crop and pet variants in [Magic Garden](https://magicgarden.gg). Game data pulled live from the [Magic Garden API](https://mg-api.ariedam.fr) by Ariedam64.

**Live:** https://magic-garden-journal.vercel.app

---

## Features (v0.6.1)

- **Plants page** — 54 crops in in-game journal order
- **Card view** — sprites, rarity badge, seed price, progress bar + %
- **List view** — compact rows with seed price, sell price, acquisition note
- **Variant modal** — 12 variants per crop, Check All, % progress, seed/sell/weight/grow-time detail pills
- **Conditions tab** — browse all crops by mutation type (Wet, Gold, etc.) with Missing Only filter
- **Overall progress bar** — journal-wide completion %
- **Search, A–Z sort, Missing Only filter**
- **Syncs across phone + PC** via Supabase

---

## Stack

- Vanilla JS (ES modules), plain CSS, no build step
- [Vercel](https://vercel.com) static hosting
- [Supabase](https://supabase.com) auth + Postgres
- [AriesMod Magic Garden API](https://mg-api.ariedam.fr)

---

## Local dev

```bash
git clone https://github.com/kuiper3/magic-garden-journal.git
cd magic-garden-journal
npx serve .   # open http://localhost:3000
```

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel env vars. The `/api/config` route exposes them to the browser.

---

## Docs

| File | Purpose |
|---|---|
| `ARCHITECTURE_v0.2.0.md` | System design, schema, module map |
| `ROADMAP_v0.2.0.md` | Milestones |
| `CHANGELOG_v0.2.0.md` | Release history |
| `AI_HANDOFF_v0.2.0.md` | Context for AI assistants |

---

Unofficial project. Not affiliated with Magic Garden developers or Ariedam64.
