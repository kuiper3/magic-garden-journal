// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.1.0 — stub; implemented in 0.3.0
// ═══════════════════════════════════════════════
// Wraps all calls to https://mg-api.ariedam.fr
// Uses lib/cache.js for localStorage TTL caching.
// ═══════════════════════════════════════════════

const BASE = 'https://mg-api.ariedam.fr';

// Cache TTLs (ms)
const TTL_SHORT = 5 * 60 * 1000;       // 5 min  — in-memory
const TTL_LONG  = 60 * 60 * 1000;      // 1 hour — localStorage

// 0.3.0 TODO: wire up cache.js and implement each function below.

/**
 * Fetch all plants from AriesMod.
 * @returns {Promise<Object>} keyed by plant name
 */
export async function fetchPlants() {
  // 0.3.0: return cache.get('aries:plants', TTL_LONG, () => apiFetch('/data/plants'));
  throw new Error('fetchPlants not yet implemented (milestone 0.3.0)');
}

/**
 * Fetch all pets from AriesMod.
 * @returns {Promise<Object>} keyed by pet name
 */
export async function fetchPets() {
  // 0.3.0: return cache.get('aries:pets', TTL_LONG, () => apiFetch('/data/pets'));
  throw new Error('fetchPets not yet implemented (milestone 0.3.0)');
}

/**
 * Fetch mutation definitions — source of truth for variant lists.
 * @returns {Promise<Object>}
 */
export async function fetchMutations() {
  // 0.3.0: return cache.get('aries:mutations', TTL_LONG, () => apiFetch('/data/mutations'));
  throw new Error('fetchMutations not yet implemented (milestone 0.3.0)');
}

/**
 * Fetch egg definitions — used for pet sort order by rarity.
 * @returns {Promise<Object>}
 */
export async function fetchEggs() {
  // 0.3.0: return cache.get('aries:eggs', TTL_LONG, () => apiFetch('/data/eggs'));
  throw new Error('fetchEggs not yet implemented (milestone 0.3.0)');
}

/**
 * Clear all cached AriesMod data from localStorage.
 */
export function clearCache() {
  // 0.3.0: clear all 'aries:*' keys from localStorage
}

// ── Internal helpers (implemented in 0.3.0) ──

async function apiFetch(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`AriesMod ${path} → ${res.status}`);
  return res.json();
}
