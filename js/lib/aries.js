// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.5.2 — exact API keys in CROP_ORDER
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

// ── Canonical crop order ──────────────────────
// Keys are exact AriesMod API object keys (verified from live API).
// Display names come from crop.name in the API response, not these keys.

export const CROP_ORDER = [
  'Carrot', 'Cabbage', 'Strawberry', 'Aloe',
  'Clover', 'FourLeafClover', 'Beet', 'Rose',
  'FavaBean', 'Delphinium', 'Blueberry', 'Apple',
  'OrangeTulip', 'Tomato', 'Daisy', 'PurpleDaisy',
  'Daffodil', 'Corn', 'Watermelon', 'Pumpkin',
  'Echeveria', 'Pear', 'Gentian', 'Lavender',
  'Coconut', 'PineTree', 'Banana', 'Lily',
  'Camellia', 'Squash', 'Peach', 'BurrosTail',
  'Saffron', 'Mushroom', 'Cactus', 'Bamboo',
  'Poinsettia', 'VioletCort', 'Chrysanthemum', 'Date',
  'Grape', 'Eggplant', 'Pepper', 'Lemon',
  'PassionFruit', 'DragonFruit', 'Cacao', 'Lychee',
  'Ube', 'Sunflower', 'Dawnbreaker', 'Starweaver',
  'DawnCelestial', 'MoonCelestial',
];

const _cropOrderIndex = new Map(CROP_ORDER.map((k, i) => [k, i]));

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
  JOURNAL: 'journal',
  PRICE:   'price',
  AZ:      'az',
};

/**
 * Plants sorted by the chosen mode.
 * JOURNAL uses CROP_ORDER (exact API keys). Unknown crops append at end.
 */
export async function getPlantsSorted(mode = PLANT_SORT_MODES.JOURNAL) {
  const data   = await fetchPlants();
  const plants = Object.entries(data).map(([key, val]) => ({ key, ...val }));

  if (mode === PLANT_SORT_MODES.PRICE) {
    return plants.sort((a, b) =>
      (a.seed?.coinPrice ?? 0) - (b.seed?.coinPrice ?? 0));
  }
  if (mode === PLANT_SORT_MODES.AZ) {
    return plants.sort((a, b) =>
      (a.crop?.name ?? a.key).localeCompare(b.crop?.name ?? b.key));
  }

  // Journal order — exact key match
  return plants.sort((a, b) => {
    const ai = _cropOrderIndex.has(a.key) ? _cropOrderIndex.get(a.key) : 9999;
    const bi = _cropOrderIndex.has(b.key) ? _cropOrderIndex.get(b.key) : 9999;
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
