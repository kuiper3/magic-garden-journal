// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.4.0 — variant constants + API client
// ═══════════════════════════════════════════════
// All game catalog data comes from mg-api.ariedam.fr.
// Responses are objects keyed by item name.
// Sprite fields are already resolved to absolute URLs by the API.
//
// Response shapes:
//   plants    → { [name]: { seed: { sprite, coinPrice, ... }, plant: { sprite }, crop: { sprite } } }
//   pets      → { [name]: { sprite, name, ... } }
//   mutations → { [name]: { sprite, coinMultiplier, baseChance, ... } }
//   eggs      → { [name]: { sprite, faunaSpawnWeights: { [petName]: weight }, coinPrice, ... } }
//
// Variant lists are game constants (from wiki), NOT derived from the API.
// MaxWeight is not a mutation but IS tracked in the Garden Journal.
// Weather/lunar mutations are crop-only.
// Gold and Rainbow apply to both crops AND pets.
// ═══════════════════════════════════════════════

import { get as cacheGet, clearAll as cacheClearAll } from './cache.js';

// ── Game constants ────────────────────────────

/**
 * All 12 variants tracked per crop in the Garden Journal.
 * Source: https://magicgarden.wiki/Mutations + Garden Journal mechanics
 */
export const CROP_VARIANTS = [
  'Normal',
  // Weather mutations (crop-only, additive with lunar)
  'Wet', 'Chilled', 'Frozen', 'Thunderstruck',
  // Lunar mutations (crop-only, additive with weather)
  'Dawnlit', 'Amberlit', 'Dawnbound', 'Amberbound',
  // Colour mutations (multiplicative; crops + pets both get these)
  'Gold', 'Rainbow',
  // Not a mutation but tracked in the journal
  'MaxWeight',
];

/**
 * All 4 variants tracked per pet in the Garden Journal.
 * Source: https://magicgarden.wiki/Pets — "Max weight, along with gold and
 * rainbow mutations of each pet are required to complete the Garden Journal."
 */
export const PET_VARIANTS = [
  'Normal',
  'Gold', 'Rainbow',  // only colour mutations apply to pets
  'MaxWeight',
];

// ── API base + TTL ────────────────────────────

const BASE   = 'https://mg-api.ariedam.fr';
const TTL_1H = 60 * 60 * 1000;

// ── Internal fetch ────────────────────────────

async function apiFetch(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`AriesMod ${path} returned ${res.status}`);
  return res.json();
}

// ── Public API ────────────────────────────────

/**
 * Fetch all plants. Returns object keyed by plant name.
 * Each plant: { seed: { sprite, coinPrice, ... }, plant: { sprite }, crop: { sprite } }
 */
export function fetchPlants() {
  return cacheGet('aries:plants', TTL_1H, () => apiFetch('/data/plants'));
}

/**
 * Fetch all pets. Returns object keyed by pet name.
 */
export function fetchPets() {
  return cacheGet('aries:pets', TTL_1H, () => apiFetch('/data/pets'));
}

/**
 * Fetch mutation definitions. Useful for sprites per mutation.
 * Note: variant lists are defined as constants above, not derived from this.
 */
export function fetchMutations() {
  return cacheGet('aries:mutations', TTL_1H, () => apiFetch('/data/mutations'));
}

/**
 * Fetch egg definitions.
 * faunaSpawnWeights maps pet names to spawn weights — used for pet sort order.
 */
export function fetchEggs() {
  return cacheGet('aries:eggs', TTL_1H, () => apiFetch('/data/eggs'));
}

/**
 * Force-clear cache and re-fetch all catalog data.
 */
export async function refreshAll() {
  cacheClearAll();
  await Promise.all([fetchPlants(), fetchPets(), fetchMutations(), fetchEggs()]);
}

// ── Derived helpers ───────────────────────────

/**
 * Plants as a sorted array, ordered by seed coinPrice ascending (cheapest first).
 * Shape: [{ key, seed, plant, crop }, ...]
 */
export async function getPlantsSorted() {
  const data = await fetchPlants();
  return Object.entries(data)
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => (a.seed?.coinPrice ?? 0) - (b.seed?.coinPrice ?? 0));
}

/**
 * Pets as an array sorted by cheapest source egg (most accessible first).
 * Shape: [{ key, sprite, eggName, eggPrice, ...rest }, ...]
 */
export async function getPetsSorted() {
  const [petsData, eggsData] = await Promise.all([fetchPets(), fetchEggs()]);

  // Map: petName → { eggName, eggCoinPrice } — prefer cheapest egg if multiple
  const petEggMap = {};
  for (const [eggName, egg] of Object.entries(eggsData)) {
    const weights = egg.faunaSpawnWeights ?? {};
    for (const petName of Object.keys(weights)) {
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
