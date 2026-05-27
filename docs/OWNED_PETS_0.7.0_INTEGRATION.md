# Owned Pets — v0.7.1 update (strength model)

> **This supersedes the ability section of the 0.7.0 notes below.** The proc-weight model
> (editable `{ abilityKey: weight }` map, proc-share bars) is **replaced** by a strength model.

**The mechanic.** A pet's *strength* is one modifier on its ability's base formula:
`actual = base × (strength / 100)`. It applies to **every** numeric facet of an ability —
both the proc rate (e.g. 21%/min) and the effect magnitude (e.g. −7 min). Strength caps at
100, so the base values in `ABILITY_STATIC_DATA` are the strength-100 values. A pet spawns
with a fixed **max strength (80–100)** and levels from a **current strength (50–max)** up to
it. Cards show each value **current → max**.

**New file**
| File | Role |
|---|---|
| `js/pages/owned-pets-abilities.js` | Strength engine: `ABILITY_MAGNITUDE` table (the effect numbers that live in display text in aries.js, lifted out as real numbers), `abilityFacets()`, `facetValue()`, level clamps, `abilityKeys()`. **Does not touch `aries.js`** — the Pets discovery page keeps rendering the raw `effectTemplate`/`rate` exactly as before. |

**Changed files (vs 0.7.0)**
| File | Change |
|---|---|
| `migrations/0.7.1_owned_pets_strength.sql` | Adds `current_level` (50–max) + `max_level` (80–100); converts `abilities` from `{key:weight}` object → `[key,…]` array; range CHECKs. Idempotent. Run **after** 0.7.0. |
| `js/pages/owned-pets-card.js` | Drops `procShares`; renders strength chip (⚡ cur/max) + per-ability current→max values. |
| `js/pages/owned-pets-form.js` | Current + max strength steppers (clamped); abilities are **multi-select chips** from the species' innate pool; live computed preview; gold/rainbow at the bottom. |
| `css/owned-pets.css` | Proc-bar styles → ability-value + strength-chip + chip-pool + preview styles; added `.owned-form-grid3`. |

**Data model now:** `owned_pets(… current_level int, max_level int, abilities jsonb /* array of keys */)`.
The card/form tolerate the old object shape via `abilityKeys()`, and the migration converts stored rows, so pre-0.7.1 test rows still render.

**Deploy:** run `0.7.1_owned_pets_strength.sql` in Supabase → copy the 4 changed files + the new `owned-pets-abilities.js` → bump `package.json`/nav to `0.7.1`. Magnitudes in `ABILITY_MAGNITUDE` were seeded from the wiki numbers already in `ABILITY_STATIC_DATA`'s templates — eyeball them against the game if anything looks off.

---

# Owned Pets — v0.7.0 integration & handoff

Implements **AI_HANDOFF §12**: a standalone *Owned Pets* nav section (one record per
physical pet), plus the per-species owned-count badge on the Pets page.

> Built against the **live repo at commit time (package.json `0.6.4`)** — pulled from
> `raw.githubusercontent.com/kuiper3/magic-garden-journal/main`, not assumed. Note: the
> repo is *ahead* of `AI_HANDOFF.md` (which still says `0.6.2`); the feeding values in
> §11 already shipped in aries.js (`PET_FEED_BASE`, `feedHunger`, etc.).

---

## What you got

**New files**
| File | Role |
|---|---|
| `migrations/0.7.0_owned_pets.sql` | `owned_pets` table + RLS + indexes |
| `js/pages/owned-pets.js` | Page orchestrator: load, group-by-species, search, sort, add/edit/delete wiring |
| `js/pages/owned-pets-card.js` | `buildOwnedCard()` + `procShares()` + `ownedSpriteUrl()` (pure, mirrors pets-grid.js) |
| `js/pages/owned-pets-form.js` | Add/edit modal: species picker, mutation, weight, editable ability weights w/ live proc preview |
| `css/owned-pets.css` | Page + form styling (dark theme, shared tokens) |

**Modified files** (drop-in replacements)
| File | Change |
|---|---|
| `js/app.js` | Registered `/owned` route + nav link (📋 Owned); nav version → `v0.7.0` |
| `js/pages/pets.js` | Loads owned summary on init; owned-count badge → inline instance popover |
| `js/pages/pets-grid.js` | `buildPetCard`/`buildPetRow` take an `ownedCounts` map and render the badge |
| `css/pets.css` | Appended `.owned-badge` + `.owned-pop` styles |

---

## Deploy steps

1. **Run the migration** — paste `migrations/0.7.0_owned_pets.sql` into the Supabase SQL editor.
   Until this runs, the Pets-page badge query simply no-ops (guarded), and the Owned page
   shows an empty state — nothing crashes.
2. **Copy the files** into the repo at the matching paths above.
3. **Bump versions:** `package.json` → `0.7.0`, add the CHANGELOG entry below, update
   `AI_HANDOFF.md` §12 (snippet below).
4. Commit & push → Vercel redeploys.

---

## Data model

`owned_pets` row → one physical pet:

```
id · user_id · pet_key · nickname · weight_kg · variant(Normal|Gold|Rainbow) · abilities(jsonb) · created_at
```

`abilities` is `{ abilityKey: weight }` as rolled on that individual. **Proc share** =
`weight / Σ(weights) × 100` (the species `innateAbilityWeights` pre-fill the form so you
only tweak what differs). MaxWeight is intentionally *not* an owned-pet variant — it's a
journal discovery category; the actual weight is tracked numerically in `weight_kg`.

---

## Manual test checklist

- [ ] `/owned` loads; empty state shows "Add your first pet".
- [ ] Add a pet → species select, mutation segmented control, weight, ability weights.
- [ ] Editing an ability weight updates all proc %s live; "Defaults" resets to species weights.
- [ ] Save → card appears, grouped under its species (Species sort) and flat (Recent sort).
- [ ] Edit a pet → fields pre-filled, species locked; Save persists.
- [ ] Delete → trash icon opens the form; "Delete" → "Confirm delete" removes the row.
- [ ] Pets page: a 📋 badge shows on species you own; click → popover lists instances; it
      does **not** open the pet modal; Esc / scroll / outside-click dismisses it.
- [ ] Mobile: 3-item bottom nav fits; owned grid is single-column.

---

## Paste-ready: CHANGELOG entry

```md
## [0.7.0] — 2026-05-26 *(Owned Pets)*

### Added
- **Owned Pets section** (`/owned`) — track individual pets you own, separate from
  species discovery. Per-instance nickname, mutation (Normal/Gold/Rainbow), weight,
  and rolled ability weights. Ability **proc share** auto-computed (weight / Σweights).
  - `owned-pets.js` orchestrator (group-by-species + Recent sort, search).
  - `owned-pets-card.js` (`buildOwnedCard`, `procShares`, `ownedSpriteUrl`).
  - `owned-pets-form.js` add/edit modal — species picker pre-fills ability weights
    from the species `innateAbilityWeights`; live proc preview; confirm-step delete.
  - Supabase `owned_pets` table + RLS (`migrations/0.7.0_owned_pets.sql`).
- **Pets page owned-count badge** — 📋 badge per species you own; click for an inline
  popover of your instances (nickname · mutation · weight). Query is guarded, so it
  no-ops before the migration runs.
```

## Paste-ready: AI_HANDOFF §12 replacement

```md
## 12. Owned Pets (shipped — 0.7.0)

Separate nav section ("Owned"), not a Pets sub-tab. Table `owned_pets`
(id, user_id, pet_key, nickname, weight_kg, variant[Normal|Gold|Rainbow],
abilities jsonb {abilityKey:weight}, created_at) + RLS.
- `owned-pets.js` / `owned-pets-card.js` / `owned-pets-form.js`, `owned-pets.css`.
- Proc share = weight / Σ(weights). Form seeds weights from species
  `innateAbilityWeights`; user edits to match their rolled pet.
- Pets page badge: `fetchOwnedSummary()` builds count + instance maps on init;
  `buildPetCard/Row` render `.owned-badge`; click → body-anchored `.owned-pop`.
- MaxWeight is NOT an owned variant (weight is numeric); only Normal/Gold/Rainbow.

### Possible follow-ups
- STR-scaled ability effect values on the owned card (rates in ABILITY_STATIC_DATA
  already encode `rate × STR`; weight→STR mapping still unconfirmed).
- Total-owned summary stats / per-mutation counts on the Owned page header.
```
