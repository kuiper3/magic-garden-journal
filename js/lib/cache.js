// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/cache.js
// v0.1.0 — stub; implemented in 0.3.0
// ═══════════════════════════════════════════════
// Simple localStorage cache with TTL.
// Keys prefixed to avoid collisions.
// ═══════════════════════════════════════════════

/**
 * Get a cached value, or fetch + store it if stale/missing.
 * @param {string}   key      Cache key (e.g. 'aries:plants')
 * @param {number}   ttl      Max age in ms
 * @param {Function} fetcher  Async function returning fresh data
 * @returns {Promise<any>}
 */
export async function get(key, ttl, fetcher) {
  // 0.3.0 TODO:
  //   const raw = localStorage.getItem('mgj:' + key);
  //   if (raw) {
  //     const { ts, data } = JSON.parse(raw);
  //     if (Date.now() - ts < ttl) return data;
  //   }
  //   const data = await fetcher();
  //   localStorage.setItem('mgj:' + key, JSON.stringify({ ts: Date.now(), data }));
  //   return data;
  throw new Error('cache.get not yet implemented (milestone 0.3.0)');
}

/**
 * Invalidate a specific cache key.
 * @param {string} key
 */
export function invalidate(key) {
  localStorage.removeItem('mgj:' + key);
}

/**
 * Clear all cache keys for this app.
 */
export function clearAll() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('mgj:'))
    .forEach(k => localStorage.removeItem(k));
}
