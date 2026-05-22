// ═══════════════════════════════════════════════
// Magic Garden Journal — js/app.js
// v0.4.1 — router + nav render (v0.6.2 nav string)
// ═══════════════════════════════════════════════

import { initAuth, getSession, signIn, signOut } from './lib/auth.js';

// ── Route map ────────────────────────────────
const ROUTES = {
  '/plants': () => import('./pages/plants.js'),
  '/pets':   () => import('./pages/pets.js'),
};

const DEFAULT_ROUTE = '/plants';

// ── State ─────────────────────────────────────
let currentPage = null;

// ── Nav ───────────────────────────────────────
function renderNav() {
  const navEl = document.getElementById('nav');
  if (!navEl) return;
  navEl.innerHTML = `
    <div class="nav-logo">Journal<span class="nav-version">v0.6.2</span></div>
    <a class="nav-link" data-route="/plants" href="/plants">
      <span class="nav-icon">🌱</span> Plants
    </a>
    <a class="nav-link" data-route="/pets" href="/pets">
      <span class="nav-icon">🐾</span> Pets
    </a>
    <div class="nav-spacer"></div>
    <button class="nav-signout" id="signout-btn">Sign out</button>
  `;

  document.getElementById('signout-btn')?.addEventListener('click', async () => {
    await signOut();
  });
}

function setActiveNav(path) {
  document.querySelectorAll('[data-route]').forEach(el => {
    el.classList.toggle('active', el.dataset.route === path);
  });
}

// ── Page lifecycle ─────────────────────────────
async function navigate(path) {
  const mainEl = document.getElementById('main');
  if (!mainEl) return;

  const route = ROUTES[path] ? path : DEFAULT_ROUTE;

  if (currentPage?.destroy) currentPage.destroy();
  currentPage = null;
  mainEl.innerHTML = '';

  try {
    const mod = await ROUTES[route]();
    currentPage = mod;
    mod.render(mainEl);
    if (mod.init) await mod.init();
  } catch (err) {
    console.error('[app] Failed to load page:', route, err);
    mainEl.innerHTML = '<p style="color:rgba(255,255,255,0.4);padding:2rem;">Failed to load page. Try refreshing.</p>';
  }

  setActiveNav(route);
  window.history.replaceState({}, '', route);
}

// ── Auth UI ───────────────────────────────────
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

// ── Sign-in form ──────────────────────────────
function bindSignInForm() {
  const form    = document.getElementById('signin-form');
  const btn     = document.getElementById('signin-btn');
  const errEl   = document.getElementById('auth-error');
  const label   = btn?.querySelector('.btn-label');
  const spinner = btn?.querySelector('.btn-spinner');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!btn || btn.disabled) return;

    const email    = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    if (!email || !password) return;

    btn.disabled = true;
    label?.classList.add('hidden');
    spinner?.classList.remove('hidden');
    errEl?.classList.add('hidden');

    try {
      await signIn(email, password);
    } catch (err) {
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

// ── Nav link clicks ───────────────────────────
function bindNav() {
  document.getElementById('nav')?.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route]');
    if (!link) return;
    e.preventDefault();
    navigate(link.dataset.route);
  });

  window.addEventListener('popstate', () => {
    navigate(window.location.pathname);
  });
}

// ── Bootstrap ─────────────────────────────────
async function boot() {
  bindSignInForm();

  await initAuth({
    onSignedIn: () => {
      renderNav();
      bindNav();
      showApp();
      navigate(window.location.pathname || DEFAULT_ROUTE);
    },
    onSignedOut: () => {
      showAuthGate();
    },
  });

  const session = await getSession();
  if (session) {
    renderNav();
    bindNav();
    showApp();
    navigate(window.location.pathname || DEFAULT_ROUTE);
  } else {
    showAuthGate();
  }
}

document.addEventListener('DOMContentLoaded', boot);
