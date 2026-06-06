// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/settings.js
// v0.8.0 — settings hub: guide, backup, account, about
// ═══════════════════════════════════════════════

import { navigate } from '../app.js';
import { signOut } from '../lib/auth.js';
import { getSupabase } from '../lib/supabase.js';

const VERSION = '0.9.0';
const REPO    = 'https://github.com/kuiper3/magic-garden-journal';

export function render(container) {
  container.innerHTML = `
    <link rel="stylesheet" href="css/settings.css">
    <div class="set-wrap">
      <h2 class="set-title">⚙️ Settings</h2>

      <section class="set-card">
        <h3 class="set-card-title">Appearance</h3>
        <div class="set-themes" id="set-themes">
          <button class="set-theme" data-theme="forest" style="--sw-bg:#0c1a0e;--sw-card:#13261a;--sw-ac:#5a9a6e">
            <span class="set-sw"><span class="set-sw-dot"></span></span><span class="set-theme-name">Forest</span><span class="set-theme-kind">dark</span>
          </button>
          <button class="set-theme" data-theme="midnight" style="--sw-bg:#0d1320;--sw-card:#151d2f;--sw-ac:#7fa3d8">
            <span class="set-sw"><span class="set-sw-dot"></span></span><span class="set-theme-name">Midnight</span><span class="set-theme-kind">dark</span>
          </button>
          <button class="set-theme" data-theme="parchment" style="--sw-bg:#efe9d9;--sw-card:#f9f5ea;--sw-ac:#3d6e4f">
            <span class="set-sw"><span class="set-sw-dot"></span></span><span class="set-theme-name">Parchment</span><span class="set-theme-kind">light</span>
          </button>
          <button class="set-theme" data-theme="meadow" style="--sw-bg:#e9f2ea;--sw-card:#ffffff;--sw-ac:#2f7a4d">
            <span class="set-sw"><span class="set-sw-dot"></span></span><span class="set-theme-name">Meadow</span><span class="set-theme-kind">light</span>
          </button>
        </div>
      </section>

      <section class="set-card">
        <h3 class="set-card-title">Resources</h3>
        <button class="set-row" data-go="/guide">
          <span class="set-row-icon">📖</span>
          <span class="set-row-text">
            <span class="set-row-name">Guide</span>
            <span class="set-row-sub">How every section works, including importing pets from the game</span>
          </span>
          <span class="set-row-arrow">›</span>
        </button>
        <button class="set-row" data-go="/backup">
          <span class="set-row-icon">💾</span>
          <span class="set-row-text">
            <span class="set-row-name">Backup &amp; Import</span>
            <span class="set-row-sub">Export your progress to a file, or merge a backup into this account</span>
          </span>
          <span class="set-row-arrow">›</span>
        </button>
      </section>

      <section class="set-card">
        <h3 class="set-card-title">Account</h3>
        <div class="set-account">
          <span class="set-email" id="set-email">…</span>
          <button class="set-signout" id="set-signout">Sign out</button>
        </div>
      </section>

      <section class="set-card set-card--danger">
        <h3 class="set-card-title">Danger zone</h3>
        <p class="set-danger-note">Permanently deletes <strong>every pet in your Owned Pets
        list</strong> — useful when testing imports. Plant and pet <em>discoveries</em> are not
        touched. There is no undo.</p>
        <button class="set-del-owned" id="set-del-owned" disabled>Delete all owned pets…</button>
        <div class="set-status" id="set-del-status"></div>
      </section>

      <section class="set-card">
        <h3 class="set-card-title">About</h3>
        <p class="set-about">Magic Garden Journal <strong>v${VERSION}</strong> — personal crop &amp;
        pet variant tracker. Your data syncs to your account automatically.
        <a href="${REPO}" target="_blank" rel="noopener">Source on GitHub ↗</a></p>
      </section>
    </div>`;
}

export async function init() {
  document.querySelector('.set-wrap')?.addEventListener('click', e => {
    const row = e.target.closest('[data-go]');
    if (row) { navigate(row.dataset.go); return; }
    const themeBtn = e.target.closest('.set-theme');
    if (themeBtn) applyTheme(themeBtn.dataset.theme);
  });
  markActiveTheme();

  document.getElementById('set-signout')?.addEventListener('click', async e => {
    const btn = e.currentTarget;
    btn.disabled = true;
    btn.textContent = 'Signing out…';
    try { await signOut(); }
    catch (err) {
      console.error('[settings] sign-out failed:', err);
      btn.disabled = false;
      btn.textContent = 'Sign out';
    }
  });

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const el = document.getElementById('set-email');
    if (el) el.textContent = user?.email ?? 'Signed in';
  } catch (_) {
    const el = document.getElementById('set-email');
    if (el) el.textContent = 'Signed in';
  }

  initDangerZone();
}

// ── Themes ────────────────────────────────────
function applyTheme(id) {
  document.documentElement.dataset.theme = id;
  try { localStorage.setItem('mgj_theme', id); } catch (_) { /* private mode */ }
  markActiveTheme();
}

function markActiveTheme() {
  const current = document.documentElement.dataset.theme || 'forest';
  document.querySelectorAll('.set-theme').forEach(b =>
    b.classList.toggle('active', b.dataset.theme === current));
}

// ── Danger zone: delete all owned pets ────────
// Two-step confirm: first click arms the button (auto-disarms after 6s),
// second click deletes. Shows the live row count so it's clear what's at stake.
async function initDangerZone() {
  const btn = document.getElementById('set-del-owned');
  const status = document.getElementById('set-del-status');
  if (!btn) return;
  let count = 0;
  let disarmTimer = null;

  const baseLabel = () => `Delete all owned pets (${count})`;

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');
    const { count: c, error } = await supabase.from('owned_pets')
      .select('id', { count: 'exact', head: true }).eq('user_id', user.id);
    if (error) throw error;
    count = c ?? 0;
    btn.textContent = baseLabel();
    btn.disabled = count === 0;
    if (count === 0 && status) status.textContent = 'Nothing to delete — your Owned Pets list is empty.';
  } catch (err) {
    console.error('[settings] count failed:', err);
    if (status) status.textContent = 'Could not load your owned-pet count.';
    return;
  }

  btn.addEventListener('click', async () => {
    if (btn.dataset.arm !== '1') {
      btn.dataset.arm = '1';
      btn.classList.add('armed');
      btn.textContent = `⚠ Click again to permanently delete ${count} pet${count === 1 ? '' : 's'}`;
      disarmTimer = setTimeout(() => {
        btn.dataset.arm = '';
        btn.classList.remove('armed');
        btn.textContent = baseLabel();
      }, 6000);
      return;
    }
    clearTimeout(disarmTimer);
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    try {
      const supabase = await getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('owned_pets').delete().eq('user_id', user.id);
      if (error) throw error;
      if (status) status.textContent = `Deleted ${count} pet${count === 1 ? '' : 's'} ✓`;
      count = 0;
      btn.dataset.arm = '';
      btn.classList.remove('armed');
      btn.textContent = baseLabel();
    } catch (err) {
      console.error('[settings] delete-all failed:', err);
      if (status) status.textContent = `Delete failed: ${err.message}`;
      btn.disabled = false;
      btn.dataset.arm = '';
      btn.classList.remove('armed');
      btn.textContent = baseLabel();
    }
  });
}

export function destroy() {}
