// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.5.1 — normalized key matching + sort helpers
// ═══════════════════════════════════════════════

import { get as cacheGet, clearAll as cacheClearAll } from './cache.js';

// ── Variant constants ─────────────────────────

export const CROP_VARIANTS = [
  'Normal',
  'Wet', 'Chilled', 'Frozen', 'Thunderstruck',
  'Dawnlit', 'Amberlit', 'Dawnbound', 'Amberbound',
  'Gold', 'Rainbow',
  'MaxWeight',
];

export const PET_VARIANTS = [
  'Normal',
  'Gold', 'Rainbow',
  'MaxWeight',
];

// ── Canonical in-game journal order ──────────

export const CROP_ORDER = [
  'Carrot', 'Cabbage', 'Strawberry', 'Aloe',
  'Clover', 'Four-Leaf Clover', 'Beet', 'Rose',
  'Fava Bean', 'Delphinium', 'Blueberry', 'Apple',
  'Tulip', 'Tomato', 'Daisy', 'Purple Daisy',
  'Daffodil', 'Corn', 'Watermelon', 'Pumpkin',
  'Echeveria', 'Pear', 'Gentian', 'Lavender',
  'Coconut', 'Pine Tree', 'Banana', 'Lily',
  'Camellia', 'Squash', 'Peach', "Burro's Tail",
  'Saffron', 'Mushroom', 'Cactus', 'Bamboo',
  'Poinsettia', 'Violet Cort', 'Chrysanthemum', 'Date',
  'Grape', 'Eggplant', 'Pepper', 'Lemon',
  'Passion Fruit', 'Dragon Fruit', 'Cacao', 'Lychee',
  'Ube', 'Sunflower', 'Dawnbreaker', 'Starweaver',
  'Dawnbinder', 'Moonbinder',
];

/**
 * Normalise a crop key for fuzzy matching.
 * Strips spaces, hyphens, apostrophes, lowercases everything.
 * "Four-Leaf Clover" → "fourleafclover"
 * "Burro's Tail"    → "burrostail"
 */
export function normKey(k) {
  return k.toLowerCase().replace(/[\s\-']/g, '');
}

// Precompute normalised → position map
const _normOrderIndex = new Map(CROP_ORDER.map((k, i) => [normKey(k), i]));

// ── API config ────────────────────────────────

const BASE   = 'https://mg-api.ariedam.fr';
const TTL_1H = 60 * 60 * 1000;

async function apiFetch(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`AriesMod ${path} returned ${res.status}`);
  return res.json();
}

// ── Raw fetchers ──────────────────────────────

export function fetchPlants() {
  return cacheGet('aries:plants', TTL_1H, () => apiFetch('/data/plants'));
}
export function fetchPets() {
  return cacheGet('aries:pets', TTL_1H, () => apiFetch('/data/pets'));
}
export function fetchMutations() {
  return cacheGet('aries:mutations', TTL_1H, () => apiFetch('/data/mutations'));
}
export function fetchEggs() {
  return cacheGet('aries:eggs', TTL_1H, () => apiFetch('/data/eggs'));
}
export async function refreshAll() {
  cacheClearAll();
  await Promise.all([fetchPlants(), fetchPets(), fetchMutations(), fetchEggs()]);
}

// ── Sort modes ────────────────────────────────

export const PLANT_SORT_MODES = {
  JOURNAL:  'journal',   // in-game Garden Journal order (default)
  PRICE:    'price',     // seed coin price ascending
  AZ:       'az',        // alphabetical A→Z
};

/**
 * Plants as a sorted array.
 * @param {string} mode — one of PLANT_SORT_MODES values
 */
export async function getPlantsSorted(mode = PLANT_SORT_MODES.JOURNAL) {
  const data = await fetchPlants();
  const plants = Object.entries(data).map(([key, val]) => ({ key, ...val }));

  if (mode === PLANT_SORT_MODES.PRICE) {
    return plants.sort((a, b) =>
      (a.seed?.coinPrice ?? 0) - (b.seed?.coinPrice ?? 0));
  }

  if (mode === PLANT_SORT_MODES.AZ) {
    return plants.sort((a, b) => a.key.localeCompare(b.key));
  }

  // Default: journal order — use normalised key so API casing/punctuation
  // differences don't break the ordering.
  return plants.sort((a, b) => {
    const ai = _normOrderIndex.get(normKey(a.key)) ?? 9999;
    const bi = _normOrderIndex.get(normKey(b.key)) ?? 9999;
    if (ai !== bi) return ai - bi;
    return a.key.localeCompare(b.key);
  });
}

/**
 * Pets sorted by cheapest source egg.
 */
export async function getPetsSorted() {
  const [petsData, eggsData] = await Promise.all([fetchPets(), fetchEggs()]);
  const petEggMap = {};
  for (const [eggName, egg] of Object.entries(eggsData)) {
    for (const petName of Object.keys(egg.faunaSpawnWeights ?? {})) {
      if (!petEggMap[petName] || egg.coinPrice < petEggMap[petName].eggCoinPrice) {
        petEggMap[petName] = { eggName, eggCoinPrice: egg.coinPrice ?? 0 };
      }
    }
  }
  return Object.entries(petsData)
    .map(([key, val]) => ({
      key, ...val,
      eggName:  petEggMap[key]?.eggName      ?? 'Unknown',
      eggPrice: petEggMap[key]?.eggCoinPrice ?? 9999,
    }))
    .sort((a, b) => a.eggPrice - b.eggPrice || a.key.localeCompare(b.key));
}
