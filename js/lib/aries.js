// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.3.0 — AriesMod API client with cache
// ═══════════════════════════════════════════════
// All game catalog data comes from mg-api.ariedam.fr.
// Responses are objects keyed by item name.
// Sprite fields are already resolved to absolute URLs by the API.
//
// Response shapes (from AriesMod source):
//   plants    → { [name]: { seed: { sprite, coinPrice, ... }, plant: { sprite }, crop: { sprite } } }
//   pets      → { [name]: { sprite, name, ... } }
//   mutations → { [name]: { sprite, coinMultiplier, baseChance, ... } }
//   eggs      → { [name]: { sprite, faunaSpawnWeights: { [petName]: weight }, coinPrice, ... } }
// ═══════════════════════════════════════════════

import { get as cacheGet, clearAll as cacheClearAll } from './cache.js';

const BASE    = 'https://mg-api.ariedam.fr';
const TTL_1H  = 60 * 60 * 1000;   // 1 hour — catalog data changes only on game patches

// ── Internal fetch ────────────────────────────

async function apiFetch(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`AriesMod ${path} returned ${res.status}`);
  return res.json();
}

// ── Public API ────────────────────────────────

/**
 * Fetch all plants.
 * Returns an object keyed by plant name.
 * Each plant has seed / plant / crop sub-objects with sprite URLs.
 */
export function fetchPlants() {
  return cacheGet('aries:plants', TTL_1H, () => apiFetch('/data/plants'));
}

/**
 * Fetch all pets.
 * Returns an object keyed by pet name.
 * Each pet has a sprite URL and game stats.
 */
export function fetchPets() {
  return cacheGet('aries:pets', TTL_1H, () => apiFetch('/data/pets'));
}

/**
 * Fetch all mutation definitions.
 * This is the source of truth for which variants exist in the game.
 * Returns an object keyed by mutation name (e.g. 'Gold', 'Wet', 'Dawnlit').
 */
export function fetchMutations() {
  return cacheGet('aries:mutations', TTL_1H, () => apiFetch('/data/mutations'));
}

/**
 * Fetch all egg definitions.
 * faunaSpawnWeights maps pet names to spawn probability weights —
 * used to derive pet rarity / sort order.
 * Returns an object keyed by egg name (e.g. 'Common Egg', 'Mythical Egg').
 */
export function fetchEggs() {
  return cacheGet('aries:eggs', TTL_1H, () => apiFetch('/data/eggs'));
}

/**
 * Force-refresh all cached AriesMod data and re-fetch everything.
 * Called by the refresh button in the nav.
 * Returns a promise that resolves when all four fetches complete.
 */
export async function refreshAll() {
  cacheClearAll();
  await Promise.all([fetchPlants(), fetchPets(), fetchMutations(), fetchEggs()]);
}

// ── Derived helpers ───────────────────────────
// These convert the keyed objects into sorted arrays for easier rendering.

/**
 * Returns plants as a sorted array, ordered by seed coinPrice ascending.
 * Shape: [{ key, seed, plant, crop }, ...]
 */
export async function getPlantsSorted() {
  const data = await fetchPlants();
  return Object.entries(data)
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => (a.seed?.coinPrice ?? 0) - (b.seed?.coinPrice ?? 0));
}

/**
 * Returns pets as an array, sorted by the rarity of their source egg
 * (cheapest egg first → most accessible pets first).
 * Shape: [{ key, sprite, eggName, eggPrice, ...rest }, ...]
 */
export async function getPetsSorted() {
  const [petsData, eggsData] = await Promise.all([fetchPets(), fetchEggs()]);

  // Build a map: petName → { eggName, eggCoinPrice }
  const petEggMap = {};
  for (const [eggName, egg] of Object.entries(eggsData)) {
    const weights = egg.faunaSpawnWeights ?? {};
    for (const petName of Object.keys(weights)) {
      // If a pet appears in multiple eggs, keep the cheapest
      if (!petEggMap[petName] || egg.coinPrice < petEggMap[petName].eggCoinPrice) {
        petEggMap[petName] = { eggName, eggCoinPrice: egg.coinPrice ?? 0 };
      }
    }
  }

  return Object.entries(petsData)
    .map(([key, val]) => ({
      key,
      ...val,
      eggName:   petEggMap[key]?.eggName   ?? 'Unknown',
      eggPrice:  petEggMap[key]?.eggCoinPrice ?? 9999,
    }))
    .sort((a, b) => a.eggPrice - b.eggPrice || a.key.localeCompare(b.key));
}

/**
 * Returns mutations as a sorted array.
 * Shape: [{ key, sprite, coinMultiplier, ... }, ...]
 */
export async function getMutationsSorted() {
  const data = await fetchMutations();
  return Object.entries(data)
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => (a.coinMultiplier ?? 1) - (b.coinMultiplier ?? 1));
}
