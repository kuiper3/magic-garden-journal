// ═══════════════════════════════════════════════
// Magic Garden Journal — js/app.js
// v0.1.0 — router skeleton; auth wired in 0.2.0
// ═══════════════════════════════════════════════

import { initAuth, getSession, signIn, signOut } from './lib/auth.js';

// ── Route map ────────────────────────────────
// Each value is a dynamic import returning { render, init, destroy }
const ROUTES = {
  '/plants': () => import('./pages/plants.js'),
  '/pets':   () => import('./pages/pets.js'),
};

const DEFAULT_ROUTE = '/plants';

// ── State ────────────────────────────────────
let currentPage = null;

// ── Page lifecycle ───────────────────────────
async function navigate(path) {
  const mainEl = document.getElementById('main');
  if (!mainEl) return;

  // Normalise path
  const route = ROUTES[path] ? path : DEFAULT_ROUTE;

  // Tear down current page
  if (currentPage?.destroy) currentPage.destroy();
  currentPage = null;
  mainEl.innerHTML = '';

  // Load + mount new page
  try {
    const mod = await ROUTES[route]();
    currentPage = mod;
    mod.render(mainEl);
    if (mod.init) mod.init();
  } catch (err) {
    console.error('[app] Failed to load page:', route, err);
    mainEl.innerHTML = '<p class="page-error">Failed to load page. Try refreshing.</p>';
  }

  // Update active nav link
  document.querySelectorAll('[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

// ── Auth UI helpers ──────────────────────────
function showAuthGate() {
  document.getElementById('auth-gate')?.classList.remove('hidden');
  document.getElementById('app')?.classList.add('hidden');
  document.body.classList.remove('app-active');
}

function showApp() {
  document.getElementById('auth-gate')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  document.body.classList.add('app-active');
}

// ── Sign-in form ─────────────────────────────
function bindSignInForm() {
  const form   = document.getElementById('signin-form');
  const btn    = document.getElementById('signin-btn');
  const errEl  = document.getElementById('auth-error');
  const label  = btn?.querySelector('.btn-label');
  const spinner = btn?.querySelector('.btn-spinner');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!btn || btn.disabled) return;

    const email    = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    if (!email || !password) return;

    // Loading state
    btn.disabled = true;
    label?.classList.add('hidden');
    spinner?.classList.remove('hidden');
    errEl?.classList.add('hidden');

    try {
      // 0.2.0: signIn() will call supabase.auth.signInWithPassword
      await signIn(email, password);
      // On success, the auth state listener in initAuth() will call showApp()
    } catch (err) {
      console.error('[app] Sign-in error:', err);
      if (errEl) {
        errEl.textContent = err.message || 'Sign-in failed. Check your credentials.';
        errEl.classList.remove('hidden');
      }
    } finally {
      btn.disabled = false;
      label?.classList.remove('hidden');
      spinner?.classList.add('hidden');
    }
  });
}

// ── Nav links ────────────────────────────────
function bindNav() {
  document.getElementById('nav')?.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route]');
    if (!link) return;
    e.preventDefault();
    const path = link.dataset.route;
    window.history.pushState({}, '', path);
    navigate(path);
  });

  window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
  });
}

// ── Bootstrap ────────────────────────────────
async function boot() {
  bindSignInForm();
  bindNav();

  // 0.2.0: initAuth() sets up supabase.auth.onAuthStateChange
  // and resolves to the current session (or null).
  // For 0.1.0 it's a stub that always returns null.
  await initAuth({
    onSignedIn: () => {
      showApp();
      navigate(window.location.pathname || DEFAULT_ROUTE);
    },
    onSignedOut: () => {
      showAuthGate();
    },
  });

  // 0.1.0: no session exists → always show auth gate
  const session = await getSession();
  if (session) {
    showApp();
    navigate(window.location.pathname || DEFAULT_ROUTE);
  } else {
    showAuthGate();
  }
}

document.addEventListener('DOMContentLoaded', boot);
