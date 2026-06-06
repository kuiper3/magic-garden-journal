# AI_HANDOFF.md — Magic Garden Journal

> **Doc version 1.0.0 · Project v0.9.0 · Updated 2026-06-06.**
> Read this first when resuming in a fresh chat. Companions: `ARCHITECTURE.md`
> (older, partially superseded by this file), `CHANGELOG.md` (authoritative
> release history), `ROADMAP.md`, `docs/OWNED_PETS_0.7.0_INTEGRATION.md`.

## What this is

Personal, password-protected tracker for crop & pet variants in **Magic Garden**
(magicgarden.gg — a web game, NOT Roblox). Owner: Shawn (kuiper3).

- **Repo:** github.com/kuiper3/magic-garden-journal · **Live:** magic-garden-journal.vercel.app
- The old `kuiper3/mgclaude` repo is DEAD — never reference it.
- **Stack:** vanilla JS ES modules, plain CSS, no build step. Supabase (auth + DB),
  Vercel (static hosting via GitHub integration), AriesMod API (`mg-api.ariedam.fr`)
  for all game data/sprites.
- Separate sibling projects (different repos/chats, do NOT mix in):
  **GardenPilot** (Tampermonkey bot for the game), **Stock Tracker + Alexa bridge**
  (planned next).

## Non-negotiable working rules (owner-stated, learned the hard way)

1. **Fetch the live repo before patching** — never assume codebase state.
   Use `https://raw.githubusercontent.com/kuiper3/magic-garden-journal/main/<path>`
   or `codeload.github.com/...zip/refs/heads/main` for the whole tree.
2. **Patch, don't rewrite** working files. Verify python/sed string replaces with
   grep afterward — silent no-op replaces have shipped real bugs twice.
3. **Deliverables are full zips** named `YYYY-MM-DD-HHMM_MagicGardenJournal-vX-Y-Z.zip`
   — timestamp MUST be **Eastern Time** (`TZ='America/New_York' date +%Y-%m-%d-%H%M`).
   Inner folder `magic-garden-journal/`; owner pushes contents to repo root.
4. **Bump `package.json` + nav version string + CHANGELOG entry every delivery.**
   Version strings live in: `package.json`, `js/app.js` (nav), `js/pages/settings.js`.
5. Keep files under ~250 lines; new pages mirror existing page architecture.
6. Verify game constants against AriesMod data, never from memory.
   (API uses `"Mythic"` not `"Mythical"`; FourLeafClover rarity is Legendary; etc.)
7. **Database changes are manual**: write `migrations/*.sql`, owner pastes into the
   Supabase SQL editor. Vercel only deploys static files. Make migrations idempotent.
8. Guard new Supabase queries so pages don't break if a migration hasn't run yet.

## Architecture map

- `index.html` — auth gate + app shell. Head: early-theme script (`mgj_theme`
  localStorage → `<html data-theme>` before paint), preconnects, ALL page CSS
  preloaded, modulepreloads. SPA rewrite via `vercel.json`.
- `js/app.js` — router (`ROUTES` map → dynamic import; pages export
  `render(el)` / optional `init()` / `destroy()`), sidebar render, `navigate()`
  (exported), auth gating. Sidebar: SVG logo + wordmark; colored line icons
  (`NAV_ICONS`/`NAV_ICON_COLORS`); collapsible desktop rail
  (localStorage `mgj_nav_collapsed`); mobile slide-over drawer (☰ button +
  backdrop, closes on navigate). Routes: /plants /pets /owned /settings /guide /backup.
- `js/lib/` — `aries.js` (game data fetch + `ABILITY_STATIC_DATA`,
  `CROP_STATIC_DATA`, `PET_FEED_BASE`, sprite helpers — **do not modify**, Pets
  discovery page depends on it; extend via separate modules), `supabase.js`
  (`getSupabase()`), `auth.js`, `cache.js`, `icons.js`.
- `js/pages/` — plants*(4 files), pets*(4), owned-pets.js (orchestrator),
  owned-pets-card.js, owned-pets-form.js, owned-pets-abilities.js (strength-scaling
  engine + `ABILITY_MAGNITUDE`), owned-pets-strength.js (game-formula computation),
  owned-pets-import.js (JSON import modal), settings.js (themes, guide/backup links,
  account/sign-out, danger zone), guide.js, backup.js.
- `css/` — main.css (tokens + **4 themes**), nav.css, plants.css (shared component
  classes: modal, toolbar, search, pills — pets/owned pages reuse it), pets.css,
  owned-pets.css, guide.css, backup.css, settings.css.
- `tools/mg-pet-exporter.user.js` — standalone Tampermonkey exporter (read-only WS
  tap, deep-scans Welcome for the user's pets, 🐾 button → JSON). LIVE-VERIFIED.
- `api/config.js` — Vercel serverless: serves SUPABASE_URL/ANON_KEY env to client.

## Theming (v0.9.0)

All CSS uses tokens; **no hardcoded white-alpha text remains** (mechanically
refactored: `rgba(255,255,255,a)` → `rgba(var(--fg-rgb),a)`,
`rgba(90,154,110,a)` → `rgba(var(--accent-rgb),a)`, pale-green/red inks →
`var(--accent-ink[-strong])`/`var(--danger-ink)`/`var(--warn-ink)`).
Themes = `[data-theme]` blocks at the END of main.css: **forest** (default dark
green), **midnight** (dark blue), **parchment** (warm light), **meadow** (cool
light). Selected in Settings; persisted `mgj_theme`; applied pre-paint by the
index.html head script. When adding CSS: use the tokens, never raw white-alpha.
The auth gate uses its own `--surface/--text` family — leave it alone.

## Data model (Supabase, RLS on user_id everywhere)

- `journal_entries (user_id, item_type 'crop'|'pet', item_key, variant_key)` —
  one row per discovered variant. Upsert with
  `onConflict:'user_id,item_type,item_key,variant_key', ignoreDuplicates:true`.
- `owned_pets (id, user_id, pet_key, nickname, weight_kg, variant
  Normal|Gold|Rainbow, current_level 50–100, max_level 80–100 ≥ current,
  abilities jsonb = array of PascalCase ability keys, created_at)`.
  Migrations: `0.7.0_owned_pets.sql` then `0.7.1_owned_pets_strength.sql` (both applied).

## The strength model (CRITICAL domain knowledge)

Every ability stat scales `actual = base × (strength/100)` — both proc rate AND
effect magnitude. Engine: `owned-pets-abilities.js` (`abilityFacets`/`facetValue`;
keys arrive PascalCase like `CoinFinderIII`, static tables are keyed by display
name — always resolve the name first).

Strength is NOT stored by the game; it's **derived** (source: GitHub
`Ariedam64/MG-AriesMod`, `src/utils/petCalcul.ts`):

```
maxStrength = floor( 20 × (targetScale−1)/(maxScale−1) + 80 )        // 80–100
xpComponent = min( floor( 30 × xp/(hoursToMature×3600) ), 30 )
strength    = min( maxStrength−30 + xpComponent, maxStrength )        // starts max−30
```

`owned-pets-strength.js` implements this with a per-species
`[maxScale, hoursToMature]` table (21 species, extracted from MG-AriesMod
hardcoded data 2026-06-06); live API species fields preferred when present.
Verified vs owner's pets: Butterfly(xp 727313, scale 2.4136) → 98/98;
Squirrel(xp 57307, scale 1.6497) → 66/92.

## Import / export flows

- **Pet import** (Owned Pets → ⇪ Import JSON): paste, file-pick, or drop ANYWHERE
  on the modal (window-level guards stop browser navigation; never re-introduce a
  textarea exemption — files dropped on textareas navigate). Accepts raw game pet
  arrays, `{pets:[…]}`, single objects, and GardenPilot's `{item,…}` wrapper.
  Strength auto-computed when absent. Duplicates (species+nickname+ability set)
  auto-skipped.
- **Game-side export**: GardenPilot console
  `copy(JSON.stringify(GardenPilot.inventory.getPets(), null, 2))`, or the
  standalone userscript for non-GardenPilot users.
- **Backup page**: exports/merges `{app:'magic-garden-journal', schema:1,
  journal_entries, owned_pets}`; portable (ids/user_id stripped).
- **Settings → Danger zone**: delete-all owned pets (count + two-step confirm) —
  built for wipe-and-reimport testing loops.

## Deploy & ops

Push to main → Vercel auto-deploys. `vercel.json`: SPA rewrite + security headers +
`Cache-Control: max-age=0, must-revalidate` on js/css (was 1h — caused repeated
"my deploy isn't showing" incidents; do not raise it). Supabase migrations are
manual (see rule 7). Game pets carry NO weight-kg field; `targetScale` is not kg —
weight stays manual/optional.

## Known deferred / next

- **Google sign-in**: Supabase Dashboard → Auth → Providers → Google (needs Google
  Cloud OAuth client). Code side is small (`signInWithOAuth`) + a button on the
  auth gate. Owner wants this eventually.
- Line icons beyond the nav (cards still use emojis); more theme polish if owner
  requests after trying the four.
- **Next project: Stock Tracker** (separate repo/chat — community-facing,
  three-tier: self-hosted API fork → relay → user bridge, VoiceMonkey/Alexa).
  Keep it OUT of this repo.

## Verification habits

`node --check` every edited JS file; grep-verify every scripted string replace;
all route targets must exist; test the strength math against known pets when
touching it. After deploy: hard-refresh once, nav badge should show the new
version.
