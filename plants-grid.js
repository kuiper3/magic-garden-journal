// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/auth.js
// v0.2.0 — live Supabase auth
// ═══════════════════════════════════════════════

import { getSupabase } from './supabase.js';

/**
 * Initialise auth state listener.
 * Calls onSignedIn or onSignedOut whenever the session changes.
 * @param {{ onSignedIn: Function, onSignedOut: Function }} callbacks
 */
export async function initAuth({ onSignedIn, onSignedOut } = {}) {
  const supabase = await getSupabase();
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      onSignedIn?.();
    } else {
      onSignedOut?.();
    }
  });
}

/**
 * Returns the current session, or null if not signed in.
 */
export async function getSession() {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/**
 * Sign in with email + password.
 * Throws on failure with Supabase's error message.
 */
export async function signIn(email, password) {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
}
