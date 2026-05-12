// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.5.0 — variant constants, order, API client
// ═══════════════════════════════════════════════

import { get as cacheGet, clearAll as cacheClearAll } from './cache.js';

// ── Variant constants ─────────────────────────

/** 12 variants tracked per crop in the Garden Journal. */
export const CROP_VARIANTS = [
  'Normal',
  'Wet', 'Chilled', 'Frozen', 'Thunderstruck',
  'Dawnlit', 'Amberlit', 'Dawnbound', 'Amberbound',
  'Gold', 'Rainbow',
  'MaxWeight',
];

/** 4 variants tracked per pet in the Garden Journal. */
export const PET_VARIANTS = [
  'Normal',
  'Gold', 'Rainbow',
  'MaxWeight',
];

// ── Canonical crop order (matches in-game journal) ──

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

// Fast lookup: key → index position
const _cropOrderIndex = new Map(CROP_ORDER.map((k, i) => [k, i]));

// ── API config ────────────────────────────────

const BASE   = 'https://mg-api.ariedam.fr';
const TTL_1H = 60 * 60 * 1000;

async function apiFetch(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`AriesMod ${path} returned ${res.status}`);
  return res.json();
}

// ── Raw fetchers (cached) ─────────────────────

export function fetchPlants() {
  return cacheGet('aries:plants', TTL_1H, () => apiFetch('/data/plants'));
}

export function fetchPets() {
  return cacheGet('aries:pets', TTL_1H, () => apiFetch('/data/pets'));
}

/** Mutation definitions — mainly used for variant sprites. */
export function fetchMutations() {
  return cacheGet('aries:mutations', TTL_1H, () => apiFetch('/data/mutations'));
}

/** Egg definitions — faunaSpawnWeights used for pet sort order. */
export function fetchEggs() {
  return cacheGet('aries:eggs', TTL_1H, () => apiFetch('/data/eggs'));
}

export async function refreshAll() {
  cacheClearAll();
  await Promise.all([fetchPlants(), fetchPets(), fetchMutations(), fetchEggs()]);
}

// ── Sorted helpers ────────────────────────────

/**
 * Plants sorted in canonical in-game Garden Journal order.
 * Any API crop not in CROP_ORDER is appended alphabetically at the end.
 * Shape: [{ key, seed, plant, crop }, ...]
 */
export async function getPlantsSorted() {
  const data = await fetchPlants();
  return Object.entries(data)
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => {
      const ai = _cropOrderIndex.has(a.key) ? _cropOrderIndex.get(a.key) : 9999;
      const bi = _cropOrderIndex.has(b.key) ? _cropOrderIndex.get(b.key) : 9999;
      if (ai !== bi) return ai - bi;
      return a.key.localeCompare(b.key); // alphabetical tiebreak for unknowns
    });
}

/**
 * Pets sorted by cheapest source egg (most accessible first).
 * Shape: [{ key, sprite, eggName, eggPrice, ...rest }, ...]
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
