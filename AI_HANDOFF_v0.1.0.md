# AI Handoff — Magic Garden Journal

> **Document version:** `0.1.0`
> **Last updated:** 2026-05-11
> **Project version this reflects:** `0.1.0 — Unreleased`
>
> **Version history (this doc):**
> - `0.1.0` — Initial handoff written during planning phase

---

> **Purpose:** If a future AI session (Claude, ChatGPT, or otherwise) needs to pick up this project, read this file before touching anything else. It captures decisions, constraints, gotchas, and rationale. The goal is to not relearn expensive lessons.

---

## 1. Project snapshot

- **Name:** Magic Garden Journal
  *(Previously attempted as "Magic Garden Tracker" / "Magic Garden Progress" — those names are retired)*
- **Owner:** Shawn (GitHub: `kuiper3`)
- **Current phase:** Pre-implementation. Planning complete. Code not yet written.
- **Project version:** `0.1.0 — Unreleased`
- **Active repo:** `magic-garden-journal` *(replacing `mgclaude`, which is retired)*

---

## 2. Doc versioning convention

Each planning doc has its own semver track, independent of the project version. Filename format during development: `FILENAME_vX.Y.Z.md`.

| Doc | Current version |
|---|---|
| `ARCHITECTURE` | `0.1.0` |
| `ROADMAP` | `0.1.0` |
| `README` | `0.1.0` |
| `CHANGELOG` | `0.1.0` |
| `AI_HANDOFF` *(this file)* | `0.1.0` |

**Doc semver rules:**
- PATCH = typo fix, small clarification, no structural change
- MINOR = new section, updated decision, meaningful addition
- MAJOR = full restructure of the doc

When you update a doc, bump its version in both the filename and the header block. Update the table above in this handoff file at the same time.

---

## 3. The single most important thing to know

This is a rebuild after a previous attempt (`mgclaude` / "Magic Garden Tracker v29") collapsed under its own weight. The previous version was a single-file monolithic HTML+JS+CSS app that grew until it couldn't be loaded into an AI context window for further edits.

**Hard rules that exist because of that failure:**

1. No file exceeds ~250 lines. Split if it does.
2. No monolithic HTML. Logic lives in JS modules. `index.html` is a shell only.
3. Catalog data is never stored locally. Always fetch from AriesMod.
4. Each component (Journal, Stock, Alexa Bridge) lives in its own repo. Never merge them.

---

## 4. Architecture in 60 seconds

Three repos, all using the same upstream data source (AriesMod API):

- **`magic-garden-journal`** — static site on Vercel, Supabase for auth + user state. Personal, password-protected.
- **`magic-garden-stock`** — static site, AriesMod SSE for live shops/weather. No DB. *(Not started)*
- **`magic-garden-alexa-bridge`** — small Node script, subscribes to AriesMod SSE, fires Voice Monkey. Designed for others to fork. *(Not started)*

Full detail: `ARCHITECTURE_v0.1.0.md`. Milestones: `ROADMAP_v0.1.0.md`.

---

## 5. Key decisions and why

| Decision | Why |
|---|---|
| Vanilla JS, no framework | Smaller files, no build step, transparent to both humans and AI assistants |
| Supabase Auth + RLS | Free, multi-device session, multi-user-capable later at no cost |
| AriesMod as the only game data source | Future-proof, removes Discord scraping, eliminates Railway |
| Three separate repos | Alexa Bridge must be shareable with no personal data exposure |
| Variants derived dynamically from `/data/mutations` | New Dawn-era content appears automatically — no hardcoded lists |
| Semver starting at `0.1.0` | Signals initial development; `1.0.0` reserved for daily-stable |
| Versioned filenames during development | Prevents confusion when multiple doc revisions exist in a session or folder |

---

## 6. AriesMod API — practical notes

Base URL: `https://mg-api.ariedam.fr`
Source: [github.com/Ariedam64/Magic-Garden-API](https://github.com/Ariedam64/Magic-Garden-API)
OpenAPI spec: `https://mg-api.ariedam.fr/docs/openapi.json` *(returned 403 from some server-side clients during planning — use browser if needed)*

**Phase 1 endpoints (Journal):**

| Endpoint | Used for |
|---|---|
| `GET /data/plants` | Crop list, names, sprites |
| `GET /data/pets` | Pet list, names, sprites |
| `GET /data/mutations` | Variant definitions — the source of truth for the variant grid |
| `GET /data/eggs` | Pet rarity grouping, sort order |

**Phase 2 endpoints (Stock, later):**

| Endpoint | Used for |
|---|---|
| `GET /live/shops/stream` | SSE — shop inventory changes |
| `GET /live/weather/stream` | SSE — weather changes |
| `GET /live/stream` | SSE — both combined |

**Gotchas:**
- Unofficial API — may break briefly during major game patches. Always handle 5xx gracefully.
- CORS is open. Direct browser fetch works.
- Sprite URLs are absolute, hosted by AriesMod. Do not rehost.
- CSV/TSV variants of every endpoint exist. Journal uses JSON only.

---

## 7. Variant list — current understanding

Wiki documented: 12 crop variants (Normal, Wet, Chilled, Frozen, Dawnlit, Amberlit, Thunderstruck, Gold, Rainbow, Dawnbound, Amberbound, Max Weight) and 4 pet variants (Normal, Gold, Rainbow, Max Weight).

Dawn-era updates have expanded these. **Never hardcode the variant list.** Pull from `/data/mutations`, partition by item type, and compose the grid at render time. Always-applicable: `Normal`, `MaxWeight`.

---

## 8. Lessons from the previous build — do not relearn these

**Priority-string matching is fragile (Alexa Bridge, Phase 3):**
`"Mythic Egg"` silently matched neither `"Mythical Eggs"` (official server, plural) nor `"Mythical Egg"` (bot, singular). Use shortest-unique-partial matching (`"Mythical"` worked for both). Verify every string against real data from all sources before shipping.

**SSML timing for Alexa:**
- Lead break ≥ 1500ms — clears the Voice Monkey doorbell chime before speech starts
- Trail break ~500ms — prevents Alexa from clipping the last word
- Item name leads the message: *"Mythical Egg. In stock now. Weather is Dawn."*
- Periods between sentence parts produce natural Alexa pauses
- Wrap everything in `<speak>` tags

**Voice Monkey doorbell chime is unavoidable:**
Virtual Speaker devices present as doorbells. No clean programmatic fix found. The 1500ms lead break is the workaround. Do not waste time trying to suppress it further.

**File upload sequencing in AI chats:**
Uploading multiple JS files simultaneously has caused Claude session crashes. Upload one at a time when sharing code for review.

**GitHub raw URL format:**
Use `raw.githubusercontent.com` or `/raw/refs/heads/main/`. The `/blob/` path returns GitHub's HTML wrapper, not raw content. AI tools cannot fetch blob URLs.

---

## 9. Conventions

- **Commit messages:** Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- **Branching:** `main` is live. Short-lived `feat/*`, `fix/*` branches, squash-merge.
- **Project semver bumps:** update `package.json` and `CHANGELOG_vX.Y.Z.md` in the same commit.
- **Doc semver bumps:** rename the file, update the header, update the table in §2 of this handoff.
- **Module exports:** every page module exports `{ render(container), init(), destroy() }`.
- **Patching over rewrites:** Shawn prefers targeted patches. When a rewrite is unavoidable, flag it and explain why before proceeding.

---

## 10. What the owner expects from an AI session

- Brainstorm before code. Shawn prefers to fully plan before any files are written.
- Patch, don't re-architect unless something is genuinely broken at the root.
- No Python.
- Be honest about uncertainty. Fetch and verify; don't guess and bake it in.
- When updating docs, always bump the doc version and rename the file accordingly.

---

## 11. Open questions at time of writing

Unresolved when planning ended. Address before the relevant milestone:

1. **Env var injection on Vercel (no-build static site):** Vercel doesn't auto-expose env vars to browser-served files. Likely fix: a tiny `/api/config.js` Vercel Function returning public values. Decide at `0.1.0`.
2. **PWA manifest + icon:** needed for `0.8.0`. Design or source an icon before that milestone.
3. **Supabase backup strategy:** manual CSV export is the plan for `1.0.0`. Revisit if data becomes critical.
4. **Stock module location:** subdomain, subpath of Journal, or separate Vercel project? Defer to Phase 2.
5. **OpenAPI 403:** `https://mg-api.ariedam.fr/docs/openapi.json` returned 403 from some server-side clients. Re-check from browser; if persistent, ask Ariedam64 on GitHub.

---

## 12. How to bring a new AI session up to speed

1. Read this file end to end.
2. Read `ARCHITECTURE_v{latest}.md`.
3. Skim `ROADMAP_v{latest}.md` to find the current milestone.
4. Read `CHANGELOG_v{latest}.md` for what has already shipped.
5. Ask the owner: *"What milestone are we on, and what's blocking it?"*

Do not assume anything about the codebase that isn't in these docs or in the repo itself.
