// ═══════════════════════════════════════════════
// Magic Garden Journal — js/app.js
// v0.5.0 — router + sidebar (v0.8.2 nav string)
// ═══════════════════════════════════════════════
// Sidebar: collapsible icon rail on desktop (chevron, persisted), slide-over
// drawer on mobile (☰ button + backdrop, closes on navigate/tap-off).
// Guide/Backup/Sign-out live under Settings.
// ═══════════════════════════════════════════════

import { initAuth, getSession, signIn, signOut } from './lib/auth.js';

// ── Route map ────────────────────────────────
const ROUTES = {
  '/plants':   () => import('./pages/plants.js'),
  '/pets':     () => import('./pages/pets.js'),
  '/owned':    () => import('./pages/owned-pets.js'),
  '/settings': () => import('./pages/settings.js'),
  '/guide':    () => import('./pages/guide.js'),
  '/backup':   () => import('./pages/backup.js'),
};

const DEFAULT_ROUTE = '/plants';
const COLLAPSE_KEY  = 'mgj_nav_collapsed';

// ── State ─────────────────────────────────────
let currentPage = null;

// ── Nav ───────────────────────────────────────
const LOGO_SVG = `
  <svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
    <rect x="1.5" y="1.5" width="29" height="29" rx="8.5"
          fill="rgba(90,154,110,0.16)" stroke="rgba(122,186,143,0.55)" stroke-width="1.5"/>
    <path d="M16 24.5V14.8" stroke="#7fbf93" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M16 16.4C16 11.7 12.5 8.9 8.1 8.7c-.2 4.6 3.3 7.9 7.9 7.7Z" fill="#5a9a6e"/>
    <path d="M16 13.5c0-3.8 2.8-6.1 6.7-6.2.2 3.9-2.8 6.5-6.7 6.2Z" fill="#8fd0a4"/>
    <path d="M10.5 24.5h11" stroke="rgba(255,255,255,0.28)" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;

function navLink(route, icon, label) {
  return `
    <a class="nav-link" data-route="${route}" href="${route}" title="${label}">
      <span class="nav-icon">${icon}</span><span class="nav-label">${label}</span>
    </a>`;
}

function renderNav() {
  const navEl = document.getElementById('nav');
  if (!navEl) return;
  navEl.innerHTML = `
    <div class="nav-head">
      <a class="nav-brand" data-route="/plants" href="/plants" title="Magic Garden Journal">
        ${LOGO_SVG}
        <span class="brand-text">
          <span class="brand-eyebrow">Magic Garden</span>
          <span class="brand-name">Journal <span class="nav-version">v0.8.2</span></span>
        </span>
      </a>
      <button class="nav-collapse" id="nav-collapse" title="Collapse sidebar" aria-label="Toggle sidebar">‹</button>
    </div>
    ${navLink('/plants', '🌱', 'Plants')}
    ${navLink('/pets', '🐾', 'Pets')}
    ${navLink('/owned', '📋', 'Owned')}
    <div class="nav-spacer"></div>
    ${navLink('/settings', '⚙️', 'Settings')}
  `;

  if (localStorage.getItem(COLLAPSE_KEY) === '1') navEl.classList.add('nav--collapsed');
  document.getElementById('nav-collapse')?.addEventListener('click', () => {
    const on = navEl.classList.toggle('nav--collapsed');
    try { localStorage.setItem(COLLAPSE_KEY, on ? '1' : '0'); } catch (_) { /* private mode */ }
  });

  ensureNavChrome();
}

// Mobile-only chrome: floating ☰ button + backdrop, created once on <body>.
function ensureNavChrome() {
  if (!document.getElementById('nav-burger')) {
    const burger = document.createElement('button');
    burger.id = 'nav-burger';
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label', 'Open menu');
    burger.innerHTML = '☰';
    burger.addEventListener('click', () => setDrawer(true));
    document.body.appendChild(burger);
  }
  if (!document.getElementById('nav-backdrop')) {
    const bd = document.createElement('div');
    bd.id = 'nav-backdrop';
    bd.className = 'nav-backdrop';
    bd.addEventListener('click', () => setDrawer(false));
    document.body.appendChild(bd);
  }
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) setDrawer(false);
  });
}

function setDrawer(open) {
  document.getElementById('nav')?.classList.toggle('nav--open', open);
  document.getElementById('nav-backdrop')?.classList.toggle('show', open);
  document.getElementById('nav-burger')?.classList.toggle('hidden', open);
}

function setActiveNav(path) {
  // Guide and Backup live under Settings, so the gear stays lit for them.
  const settingsFamily = ['/settings', '/guide', '/backup'];
  document.querySelectorAll('#nav [data-route]').forEach(el => {
    const r = el.dataset.route;
    const active = r === path || (r === '/settings' && settingsFamily.includes(path));
    el.classList.toggle('active', active && el.classList.contains('nav-link'));
  });
}

// ── Page lifecycle ─────────────────────────────
export async function navigate(path) {
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
  setDrawer(false);
  window.history.replaceState({}, '', route);
}

// ── Auth UI ───────────────────────────────────
function showAuthGate() {
  document.getElementById('auth-gate')?.classList.remove('hidden');
  document.getElementById('app')?.classList.add('hidden');
  document.body.classList.remove('app-active');
  document.getElementById('nav-burger')?.classList.add('hidden');
}

function showApp() {
  document.getElementById('auth-gate')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  document.body.classList.add('app-active');
  document.getElementById('nav-burger')?.classList.remove('hidden');
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
