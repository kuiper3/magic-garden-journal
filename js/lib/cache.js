// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/cache.js
// v0.3.0 — localStorage TTL cache
// ═══════════════════════════════════════════════
// All keys are prefixed with 'mgj:' to avoid
// collisions with anything else in localStorage.
// ═══════════════════════════════════════════════

const PREFIX = 'mgj:';

/**
 * Get a cached value, or fetch + store it if stale/missing.
 * @param {string}   key      Short cache key, e.g. 'aries:plants'
 * @param {number}   ttl      Max age in milliseconds
 * @param {Function} fetcher  Async fn that returns fresh data
 * @returns {Promise<any>}
 */
export async function get(key, ttl, fetcher) {
  const storageKey = PREFIX + key;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const { ts, data } = JSON.parse(raw);
      if (Date.now() - ts < ttl) return data;
    }
  } catch {
    // Corrupt entry — fall through to fresh fetch
    localStorage.removeItem(PREFIX + key);
  }

  const data = await fetcher();

  try {
    localStorage.setItem(storageKey, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage full or unavailable — just return the data without caching
  }

  return data;
}

/**
 * Invalidate a specific cache key.
 * @param {string} key
 */
export function invalidate(key) {
  localStorage.removeItem(PREFIX + key);
}

/**
 * Clear ALL Magic Garden Journal cache entries from localStorage.
 */
export function clearAll() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k));
}
