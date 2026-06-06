// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/backup.js
// v0.7.2 — export / import all journal data
// ═══════════════════════════════════════════════
// Export: downloads { app, schema, exportedAt, journal_entries:[…], owned_pets:[…] }
// (user_id / row ids stripped — the file is portable between accounts).
// Import: merges a backup file into the signed-in account. journal_entries are
// upserted on the table's natural key (no duplicates possible); owned_pets are
// inserted, skipping rows identical to ones already present.
// ═══════════════════════════════════════════════

import { getSupabase } from '../lib/supabase.js';
import { abilityKeys, clampMaxLevel, clampCurLevel } from './owned-pets-abilities.js';

const APP_TAG = 'magic-garden-journal';
let _parsed = null;

export function render(container) {
  container.innerHTML = `
    <link rel="stylesheet" href="css/owned-pets.css">
    <link rel="stylesheet" href="css/backup.css">
    <div class="bk-wrap">
      <h2 class="bk-title">💾 Backup</h2>
      <p class="bk-intro">Your progress lives in your account and syncs automatically — this page is
      for keeping an offline copy, or moving everything to another account.</p>

      <section class="bk-card">
        <h3 class="bk-card-title">Export</h3>
        <div class="bk-checks">
          <label class="bk-check"><input type="checkbox" id="bk-ex-plants" checked> Plant discoveries</label>
          <label class="bk-check"><input type="checkbox" id="bk-ex-pets" checked> Pet discoveries</label>
          <label class="bk-check"><input type="checkbox" id="bk-ex-owned" checked> Owned pets</label>
        </div>
        <button class="owned-form-btn primary" id="bk-export">Download backup (.json)</button>
        <div class="bk-status" id="bk-ex-status"></div>
      </section>

      <section class="bk-card">
        <h3 class="bk-card-title">Import</h3>
        <p class="bk-note">Merges a backup file into this account. Nothing is deleted; entries you
        already have are skipped.</p>
        <div class="owned-import-drop" id="bk-drop">
          <span>Drop a backup <strong>.json</strong> here, or</span>
          <button type="button" class="owned-form-btn ghost" id="bk-choose">Choose file</button>
          <input type="file" id="bk-file" accept=".json,application/json,text/plain" hidden>
        </div>
        <textarea class="owned-input owned-import-ta" id="bk-text" rows="5" placeholder="…or paste the backup JSON here"></textarea>
        <div class="bk-actions">
          <button class="owned-form-btn" id="bk-preview">Preview</button>
          <button class="owned-form-btn primary" id="bk-import" disabled>Import</button>
        </div>
        <div class="bk-status" id="bk-im-status"></div>
      </section>
    </div>`;
}

export function init() {
  document.getElementById('bk-export')?.addEventListener('click', doExport);
  document.getElementById('bk-preview')?.addEventListener('click', doPreview);
  document.getElementById('bk-import')?.addEventListener('click', doImport);
  const drop = document.getElementById('bk-drop');
  const file = document.getElementById('bk-file');
  document.getElementById('bk-choose')?.addEventListener('click', () => file?.click());
  file?.addEventListener('change', () => loadFile(file.files?.[0]));
  ['dragover', 'dragenter'].forEach(ev => drop?.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop?.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
  drop?.addEventListener('drop', e => loadFile(e.dataTransfer?.files?.[0]));
}

export function destroy() { _parsed = null; }

function setStatus(id, html, isErr = false) {
  const el = document.getElementById(id);
  if (el) { el.innerHTML = html; el.classList.toggle('err', isErr); }
}

// ── Export ────────────────────────────────────

async function doExport() {
  const btn = document.getElementById('bk-export');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  setStatus('bk-ex-status', 'Gathering data…');
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    const wantPlants = document.getElementById('bk-ex-plants')?.checked;
    const wantPets   = document.getElementById('bk-ex-pets')?.checked;
    const wantOwned  = document.getElementById('bk-ex-owned')?.checked;

    const types = [wantPlants && 'crop', wantPets && 'pet'].filter(Boolean);
    let entries = [];
    if (types.length) {
      const { data, error } = await supabase.from('journal_entries')
        .select('item_type, item_key, variant_key').eq('user_id', user.id).in('item_type', types);
      if (error) throw error;
      entries = data ?? [];
    }
    let owned = [];
    if (wantOwned) {
      const { data, error } = await supabase.from('owned_pets')
        .select('pet_key, nickname, weight_kg, variant, current_level, max_level, abilities, created_at')
        .eq('user_id', user.id);
      if (error) throw error;
      owned = data ?? [];
    }

    const blob = new Blob([JSON.stringify({
      app: APP_TAG, schema: 1, exportedAt: new Date().toISOString(),
      journal_entries: entries, owned_pets: owned,
    }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mgj-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus('bk-ex-status', `Exported ${entries.length} discoveries · ${owned.length} owned pets ✓`);
  } catch (err) {
    console.error('[backup] export failed:', err);
    setStatus('bk-ex-status', `Export failed: ${err.message}`, true);
  } finally {
    btn.disabled = false;
  }
}

// ── Import ────────────────────────────────────

async function loadFile(f) {
  if (!f) return;
  const ta = document.getElementById('bk-text');
  if (!ta) return;
  try { ta.value = await f.text(); doPreview(); }
  catch (err) { setStatus('bk-im-status', `Could not read file: ${err.message}`, true); }
}

function doPreview() {
  _parsed = null;
  const ta = document.getElementById('bk-text');
  const btn = document.getElementById('bk-import');
  if (!ta) return;
  let data;
  try { data = JSON.parse(ta.value); }
  catch (e) { setStatus('bk-im-status', `Not valid JSON: ${e.message}`, true); if (btn) btn.disabled = true; return; }

  if (data?.app !== APP_TAG) {
    setStatus('bk-im-status', 'This doesn\'t look like a journal backup (missing app tag). For game pet exports, use Owned Pets → Import JSON.', true);
    if (btn) btn.disabled = true;
    return;
  }
  const entries = (Array.isArray(data.journal_entries) ? data.journal_entries : [])
    .filter(e => e && (e.item_type === 'crop' || e.item_type === 'pet') && e.item_key && e.variant_key);
  const owned = (Array.isArray(data.owned_pets) ? data.owned_pets : [])
    .filter(o => o && typeof o.pet_key === 'string');
  _parsed = { entries, owned };
  const crops = entries.filter(e => e.item_type === 'crop').length;
  const pets  = entries.filter(e => e.item_type === 'pet').length;
  setStatus('bk-im-status', `Ready: ${crops} plant + ${pets} pet discoveries · ${owned.length} owned pets. Existing entries will be skipped.`);
  if (btn) btn.disabled = !(entries.length || owned.length);
}

function ownedSig(o) {
  return `${o.pet_key}|${(o.nickname ?? '').trim().toLowerCase()}|${abilityKeys(o.abilities).slice().sort().join(',')}`;
}

async function doImport() {
  const btn = document.getElementById('bk-import');
  if (!btn || btn.disabled || !_parsed) return;
  btn.disabled = true;
  setStatus('bk-im-status', 'Importing…');
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    // Discoveries: chunked upsert on the natural key — duplicates are ignored.
    let entryCount = 0;
    for (let i = 0; i < _parsed.entries.length; i += 500) {
      const rows = _parsed.entries.slice(i, i + 500)
        .map(e => ({ user_id: user.id, item_type: e.item_type, item_key: e.item_key, variant_key: e.variant_key }));
      const { error } = await supabase.from('journal_entries')
        .upsert(rows, { onConflict: 'user_id,item_type,item_key,variant_key', ignoreDuplicates: true });
      if (error) throw error;
      entryCount += rows.length;
    }

    // Owned pets: skip rows identical to ones already in the account.
    let added = 0, skipped = 0;
    if (_parsed.owned.length) {
      const { data: existing, error: exErr } = await supabase.from('owned_pets')
        .select('pet_key, nickname, abilities').eq('user_id', user.id);
      if (exErr) throw exErr;
      const sigs = new Set((existing ?? []).map(ownedSig));
      const fresh = _parsed.owned.filter(o => !sigs.has(ownedSig(o)));
      skipped = _parsed.owned.length - fresh.length;
      if (fresh.length) {
        const rows = fresh.map(o => {
          const max = clampMaxLevel(o.max_level ?? 100);
          return {
            user_id: user.id, pet_key: o.pet_key,
            nickname: (typeof o.nickname === 'string' && o.nickname.trim()) ? o.nickname.trim() : null,
            weight_kg: Number.isFinite(Number(o.weight_kg)) ? Number(o.weight_kg) : null,
            variant: ['Normal', 'Gold', 'Rainbow'].includes(o.variant) ? o.variant : 'Normal',
            current_level: clampCurLevel(o.current_level ?? max, max),
            max_level: max,
            abilities: abilityKeys(o.abilities),
          };
        });
        const { error } = await supabase.from('owned_pets').insert(rows);
        if (error) throw error;
        added = rows.length;
      }
    }
    setStatus('bk-im-status', `Done ✓ — ${entryCount} discoveries merged · ${added} owned pets added${skipped ? ` · ${skipped} duplicates skipped` : ''}. Visit the pages to see them.`);
    _parsed = null;
  } catch (err) {
    console.error('[backup] import failed:', err);
    setStatus('bk-im-status', `Import failed: ${err.message}`, true);
    btn.disabled = false;
  }
}
