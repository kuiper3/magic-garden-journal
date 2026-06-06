# Magic Garden Journal

> **Internal doc version:** `0.4.0` · **Project:** `v0.9.0` · **Updated:** 2026-06-06

Personal, password-protected tracker for crop and pet variants in [Magic Garden](https://magicgarden.gg).

**Live:** https://magic-garden-journal.vercel.app

---

## Features (v0.9.0)

- **54 crops** in Garden Journal order with Seed → Plant → Crop stage display
- **Card + List views** — real rarity icon PNGs, coin icon, stage sprites from AriesMod
- **Variant modal** — 12 per crop with composed per-crop mutated sprites (wet carrot, gold tulip…)
- **Conditions tab** — grid of mutated crop sprites, clickable to open full modal
- **Overall progress bar** · **Search** · **Missing only** · **A-Z sort**
- **Check All / Clear All** per crop in modal
- **Full stats**: seed price, sell price, grow time, regrow time, weight range, harvest type
- **Acquisition notes** with real game sprites: Dawn Shop, events, Discord, Carnival, iOS
- **Seed Finder** ability tier shown per crop
- Tab + toolbar state persists when navigating away and back
- Syncs across devices via Supabase
- **Owned Pets** — track your actual pets with strength-scaled ability values (current → max)
- **Import pets** from the game as JSON (GardenPilot export or the standalone `tools/mg-pet-exporter.user.js`)
- **Guide** page with full instructions · **Backup** page to export/import all progress

---

## Stack

Vanilla JS ES modules · Plain CSS · No build step · Vercel · Supabase · [AriesMod API](https://mg-api.ariedam.fr)

---

## Local dev

```bash
git clone https://github.com/kuiper3/magic-garden-journal.git
cd magic-garden-journal
npx serve . --cors   # → http://localhost:3000
```

Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` in Vercel env vars.

---

## Docs

| File | Purpose |
|---|---|
| `ARCHITECTURE.md` | System design, schema, module map |
| `ROADMAP.md` | Milestones |
| `CHANGELOG.md` | Full release history |
| `AI_HANDOFF.md` | Context for AI assistants resuming work |

Not affiliated with Magic Garden developers or Ariedam64.
