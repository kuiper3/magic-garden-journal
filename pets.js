// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/supabase.js
// v0.2.0 — live Supabase client
// ═══════════════════════════════════════════════

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

let _supabase = null;

/**
 * Returns the initialised Supabase client.
 * Fetches public config from /api/config on first call, then caches.
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export async function getSupabase() {
  if (_supabase) return _supabase;

  const res = await fetch('/api/config');
  if (!res.ok) throw new Error('Failed to load app config.');

  const { supabaseUrl, supabaseAnon } = await res.json();
  if (!supabaseUrl || !supabaseAnon) throw new Error('Supabase config missing from server.');

  _supabase = createClient(supabaseUrl, supabaseAnon);
  return _supabase;
}
