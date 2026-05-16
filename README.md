# Magic Garden Journal

> **Doc version:** `0.3.0` · **Project:** `v0.7.1` · **Updated:** 2026-05-16

Personal, password-protected tracker for crop and pet variants in [Magic Garden](https://magicgarden.gg).

**Live:** https://magic-garden-journal.vercel.app

---

## Features (v0.7.1)

- **54 crops** in Garden Journal order, Seed→Plant→Crop stage display
- **Card + List views** with real rarity icons, coin icons, stage sprites
- **Variant modal** — 12 per crop, composed per-crop mutated sprites (wet carrot, gold tulip, etc.)
- **Conditions tab** — grid of mutated crop sprites, clickable, opens full modal
- **Overall progress bar** · **Search** · **Missing only filter** · **A-Z sort**
- **Check All / Clear All** in modal
- **Full stats**: seed price, sell price, grow time, regrow time, weight range, harvest type
- **Acquisition notes**: Dawn Shop, events, Discord, Carnival, iOS — with real game sprites as icons
- **Seed Finder ability** note per crop (which tier finds it)
- Syncs across phone + PC via Supabase

---

## Stack

Vanilla JS (ES modules) · Plain CSS · No build step · Vercel · Supabase · [AriesMod API](https://mg-api.ariedam.fr)

---

## Local dev

```bash
git clone https://github.com/kuiper3/magic-garden-journal.git
cd magic-garden-journal
npx serve .   # → http://localhost:3000
```

Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` in Vercel env vars.

---

## Docs

| File | Purpose |
|---|---|
| `ARCHITECTURE_v0.3.0.md` | System design, schema, module map |
| `ROADMAP_v0.3.0.md` | Milestones |
| `CHANGELOG_v0.3.0.md` | Release history |
| `AI_HANDOFF_v0.3.0.md` | Full context for AI assistants |

Not affiliated with Magic Garden developers or Ariedam64.
