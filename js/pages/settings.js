// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/settings.js
// v0.8.0 — settings hub: guide, backup, account, about
// ═══════════════════════════════════════════════

import { navigate } from '../app.js';
import { signOut } from '../lib/auth.js';
import { getSupabase } from '../lib/supabase.js';

const VERSION = '0.8.0';
const REPO    = 'https://github.com/kuiper3/magic-garden-journal';

export function render(container) {
  container.innerHTML = `
    <link rel="stylesheet" href="css/settings.css">
    <div class="set-wrap">
      <h2 class="set-title">⚙️ Settings</h2>

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
  });

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
}

export function destroy() {}
