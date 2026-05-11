// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/auth.js
// v0.1.0 — stub; Supabase wired in 0.2.0
// ═══════════════════════════════════════════════

// 0.2.0 TODO: replace stubs with supabase.auth calls.
// Import the supabase client from './supabase.js' once it's set up.

/**
 * Initialise auth state listener.
 * @param {{ onSignedIn: Function, onSignedOut: Function }} callbacks
 */
export async function initAuth({ onSignedIn, onSignedOut } = {}) {
  // 0.2.0: supabase.auth.onAuthStateChange((event, session) => { ... })
  // For now, no-op. showAuthGate() will fire via getSession() returning null.
  void onSignedIn;
  void onSignedOut;
}

/**
 * Returns the current session, or null if not signed in.
 */
export async function getSession() {
  // 0.2.0: const { data } = await supabase.auth.getSession(); return data.session;
  return null;
}

/**
 * Sign in with email + password.
 * Throws on failure.
 */
export async function signIn(email, password) {
  // 0.2.0: const { error } = await supabase.auth.signInWithPassword({ email, password });
  // if (error) throw error;
  throw new Error('Authentication not yet configured. (milestone 0.2.0)');
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  // 0.2.0: await supabase.auth.signOut();
}
