// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/owned-pets-abilities.js
// v0.7.1 — strength-scaling engine for owned pets
// ═══════════════════════════════════════════════
// A pet's strength is a single modifier applied to its ability's base formula:
//     actual = base × (strength / 100)
// Every numeric facet of an ability scales this way — both how often it fires
// (the proc rate) and how big the effect is (the magnitude).  Strength caps at
// 100, so the base values in ABILITY_STATIC_DATA are the strength-100 values.
//
// ABILITY_STATIC_DATA (in aries.js) already holds the proc `rate` for each
// ability, but most effect magnitudes live inside display text (e.g. the "7"
// in "−7 min hatch time").  This module supplies those magnitudes as real
// numbers WITHOUT touching aries.js, so the Pets discovery page keeps rendering
// the raw templates exactly as before.
// ═══════════════════════════════════════════════

import { ABILITY_STATIC_DATA } from '../lib/aries.js';

// abilityKey → { val, fmt, big? }
//   val : base magnitude at strength 100
//   fmt : display template, {v} = scaled value
//   big : format the number with thousands separators (XP, large counts)
// Abilities NOT listed here have no scalable magnitude (granters, finders,
// refunds, coin ranges, captures) — only their proc rate scales; their effect
// text is qualitative and shown unchanged.
export const ABILITY_MAGNITUDE = {
  'Crop Eater':               { val: 150, fmt: '+{v}% sell bonus on harvest' },
  'Crop Size Boost I':        { val: 6,   fmt: '{v}% crop size increase' },
  'Crop Size Boost II':       { val: 10,  fmt: '{v}% crop size increase' },
  'Snow Crop Size Boost':     { val: 12,  fmt: '{v}% crop size increase' },
  'Egg Growth Boost I':       { val: 7,   fmt: '−{v} min hatch time' },
  'Egg Growth Boost II':      { val: 9,   fmt: '−{v} min hatch time' },
  'Egg Growth Boost III':     { val: 11,  fmt: '−{v} min hatch time' },
  'Hatch XP Boost I':         { val: 8000,  fmt: '+{v} XP on hatch', big: true },
  'Hatch XP Boost II':        { val: 12000, fmt: '+{v} XP on hatch', big: true },
  'Hunger Boost I':           { val: 12,  fmt: '−{v}% hunger depletion' },
  'Hunger Boost II':          { val: 16,  fmt: '−{v}% hunger depletion' },
  'Snow Hunger Boost':        { val: 30,  fmt: '−{v}% hunger depletion' },
  'Hunger Restore I':         { val: 30,  fmt: 'Restores {v}% hunger' },
  'Hunger Restore II':        { val: 35,  fmt: 'Restores {v}% hunger' },
  'Max Strength Boost I':     { val: 2.4, fmt: '+{v}% max strength on hatch' },
  'Max Strength Boost II':    { val: 3.5, fmt: '+{v}% max strength on hatch' },
  'Pet Mutation Boost I':     { val: 7,   fmt: '+{v}% hatch mutation chance' },
  'Pet Mutation Boost II':    { val: 10,  fmt: '+{v}% hatch mutation chance' },
  'Plant Growth Boost I':     { val: 3,   fmt: '−{v} min growth time' },
  'Plant Growth Boost II':    { val: 5,   fmt: '−{v} min growth time' },
  'Snow Plant Growth Boost':  { val: 6,   fmt: '−{v} min growth time' },
  'Dawn Plant Growth Boost':  { val: 6,   fmt: '−{v} min growth time' },
  'Amber Plant Growth Boost': { val: 6,   fmt: '−{v} min growth time' },
  'Sell Boost I':             { val: 20,  fmt: '+{v}% sell price' },
  'Sell Boost II':            { val: 30,  fmt: '+{v}% sell price' },
  'Sell Boost III':           { val: 40,  fmt: '+{v}% sell price' },
  'Sell Boost IV':            { val: 50,  fmt: '+{v}% sell price' },
  'Weather Mutation Boost I':  { val: 15, fmt: '+{v}% weather mutation chance' },
  'Weather Mutation Boost II': { val: 20, fmt: '+{v}% weather mutation chance' },
  'Snow Boost':               { val: 32,  fmt: '+{v}% Chilled mutation chance' },
  'Dawn Boost':               { val: 36,  fmt: '+{v}% Dawnlit mutation chance' },
  'Amber Moon Boost':         { val: 40,  fmt: '+{v}% Amberlit mutation chance' },
  'Dawnbinder Boost':         { val: 40,  fmt: '+{v}% Dawnbinder proc chance' },
  'XP Boost I':               { val: 300, fmt: '+{v} XP to active pets', big: true },
  'XP Boost II':              { val: 400, fmt: '+{v} XP to active pets', big: true },
  'Snow XP Boost':            { val: 450, fmt: '+{v} XP to active pets', big: true },
  'Dawn XP Boost':            { val: 850, fmt: '+{v} XP to active pets', big: true },
};

// Clamp helpers — mirror the game's spawn ranges.
export const LEVEL = { CUR_MIN: 50, MAX_MIN: 80, MAX_MAX: 100 };

export function clampMaxLevel(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return LEVEL.MAX_MAX;
  return Math.min(LEVEL.MAX_MAX, Math.max(LEVEL.MAX_MIN, v));
}

export function clampCurLevel(n, maxLevel) {
  const cap = clampMaxLevel(maxLevel);
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return cap;
  return Math.min(cap, Math.max(LEVEL.CUR_MIN, v));
}

// ── Facet model ───────────────────────────────
// A facet is one scalable line of an ability. kind:
//   'mul'  → value = base × strength/100         (proc rate, most magnitudes)
//   'div'  → value = base × 100/strength          (charge time: faster = higher str)
//   'text' → static descriptor, no scaling
function fmtNum(n, big) {
  if (big) return Math.round(n).toLocaleString();
  // Trim to at most 2 decimals, drop trailing zeros: 21 → "21", 16.8 → "16.8"
  return String(Number(n.toFixed(2)));
}

// Build the (strength-independent) facet list for an ability.
// Returns { name, weather, facets:[{ label, kind, base, unit, fmt, big }] }.
export function abilityFacets(key, abilityLookup = {}) {
  const stat = ABILITY_STATIC_DATA[key] ?? {};
  const name = abilityLookup[key]?.name ?? key;
  const facets = [];

  // Proc-rate facet (omitted for passive abilities, which are always-on).
  if (stat.type === 'perMin' && stat.rate != null) {
    facets.push({ label: 'Chance', kind: 'mul', base: stat.rate, unit: '%/min' });
  } else if (stat.type === 'prob' && stat.rate != null) {
    facets.push({ label: 'Chance', kind: 'mul', base: stat.rate, unit: '%' });
  } else if (stat.type === 'charge' && stat.rate != null) {
    facets.push({ label: 'Charge', kind: 'div', base: stat.rate, unit: 's' });
  }

  // Effect-magnitude facet.
  const mag = ABILITY_MAGNITUDE[key];
  if (mag) {
    facets.push({ label: 'Effect', kind: 'mul', base: mag.val, fmt: mag.fmt, big: mag.big });
  } else if (stat.effectTemplate && !stat.effectBase) {
    facets.push({ label: 'Effect', kind: 'text', text: stat.effectTemplate });
  }

  return { name, weather: stat.weather ?? null, facets };
}

// Compute a facet's display string at a given strength.
export function facetValue(facet, strength) {
  if (facet.kind === 'text') return facet.text;
  const str = Math.max(1, Number(strength) || 0);
  const num = facet.kind === 'div'
    ? facet.base * 100 / str
    : facet.base * str / 100;
  const shown = fmtNum(num, facet.big);
  if (facet.fmt) return facet.fmt.replace('{v}', shown);
  return `${shown}${facet.unit ?? ''}`;
}

// Normalize the stored `abilities` value into an array of ability keys.
// Tolerates the old 0.7.0 shape ({ key: weight }) so pre-migration rows still
// render after the model change.
export function abilityKeys(abilities) {
  if (Array.isArray(abilities)) return abilities.filter(Boolean);
  if (abilities && typeof abilities === 'object') return Object.keys(abilities);
  return [];
}
