// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/owned-pets-strength.js
// v0.8.2 — compute real strength from game export data
// ═══════════════════════════════════════════════
// The game's pet objects carry no strength field — strength is DERIVED, and
// the exact formula lives in MG-AriesMod's source (src/utils/petCalcul.ts):
//
//   maxStrength = floor( 20 × (targetScale − 1) / (maxScale − 1) + 80 )
//   xpComponent = min( floor( 30 × xp / (hoursToMature × 3600) ), 30 )
//   strength    = min( max(maxStrength − 30, 0) + xpComponent, maxStrength )
//
// maxScale and hoursToMature are per-species constants. We prefer the live
// AriesMod API values on the species entry when present, and fall back to the
// table below (extracted from MG-AriesMod hardcoded-data, 2026-06-06).
// ═══════════════════════════════════════════════

// species → [maxScale, hoursToMature]
export const SPECIES_GROWTH = {
  Worm: [2, 12],        Snail: [2, 12],        Bee: [2.5, 12],
  Chicken: [2, 24],     Bunny: [2, 24],        Dragonfly: [2.5, 24],
  Pig: [2.5, 72],       Cow: [2.5, 72],        Turkey: [2.5, 72],
  Pony: [2, 72],
  Squirrel: [2, 100],   Turtle: [2.5, 100],    Goat: [2, 100],
  SnowFox: [2, 100],    Stoat: [2, 100],       WhiteCaribou: [2.5, 100],
  Horse: [2.5, 100],
  FireHorse: [2.5, 144], Butterfly: [2.5, 144], Capybara: [2.5, 144],
  Peacock: [2.5, 144],
};

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Compute { current_level, max_level } for a raw game pet object, or null if
 * the inputs aren't there. `speciesEntry` is the journal's runtime species
 * object from the AriesMod API (used for maxScale/hoursToMature when it has
 * them; the static table covers the rest).
 */
export function computeGameStrength(raw, speciesEntry = null) {
  const species = raw?.petSpecies ?? raw?.species ?? raw?.pet_key ?? null;
  const xp = Math.max(0, num(raw?.xp) ?? 0);
  const targetScale = num(raw?.targetScale);
  if (!species || targetScale === null) return null;

  const table = SPECIES_GROWTH[species] ?? null;
  const maxScaleRaw = num(speciesEntry?.maxScale) ?? (table ? table[0] : null);
  const hoursRaw    = num(speciesEntry?.hoursToMature) ?? (table ? table[1] : null);
  if (maxScaleRaw === null || hoursRaw === null) return null;

  const maxScale = maxScaleRaw > 1 ? maxScaleRaw : 1;
  const hours    = hoursRaw > 0 ? hoursRaw : 1;

  const ratio = maxScale > 1 ? (targetScale - 1) / (maxScale - 1) : 0;
  const max_level = Math.max(Math.floor(ratio * 20 + 80), 0);
  if (max_level <= 0) return null;

  const xpComponent = Math.min(Math.floor((xp / (hours * 3600)) * 30), 30);
  const current_level = Math.min(Math.max(max_level - 30, 0) + xpComponent, max_level);

  return { current_level, max_level };
}
