// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/owned-pets-import.js
// v0.7.2 — bulk JSON import (GardenPilot / Magic Bot exports)
// ═══════════════════════════════════════════════
// Accepts the raw pet objects GardenPilot reads off the game WebSocket:
//   { id, itemType:'Pet', petSpecies:'Squirrel', name:'Shawna', xp,
//     hunger, mutations:[...], targetScale, abilities:['CoinFinderIII',…],
//     sourceEggId, abilityCooldowns }
// Input may be a bare array, a single object, or { pets:[…] }.
// Mapping:
//   petSpecies → pet_key · name → nickname · mutations → variant
//   abilities → abilities (same PascalCase keys AriesMod uses)
//   strength fields (several aliases) → current_level / max_level, else 100/100
//   weight_kg/weightKg/weight → weight_kg (targetScale is NOT kg — ignored)
// Exact duplicates of existing rows (species + nickname + ability set) are
// skipped so re-importing the same export is safe.
// ═══════════════════════════════════════════════

import { getSupabase } from '../lib/supabase.js';
import { petDisplayName } from './pets-grid.js';
import { clampMaxLevel, clampCurLevel, abilityKeys } from './owned-pets-abilities.js';
import { computeGameStrength } from './owned-pets-strength.js';

let _imp = null;

// While the modal is open, the browser must NEVER navigate to a dropped file.
// preventDefault unconditionally; the modal-card handler (capture order: card
// fires first, then this) decides whether the drop actually loads. Outside the
// modal the cursor shows no-drop.
function _blockWindowDrop(e) {
  e.preventDefault();
  if (e.type === 'dragover' && e.dataTransfer && !e.target.closest?.('#owned-import')) {
    e.dataTransfer.dropEffect = 'none';
  }
}

export function openOwnedImport({ allPets = [], abilityLookup = {}, existingRows = [], onSaved } = {}) {
  closeOwnedImport();
  _imp = {
    byKey: Object.fromEntries(allPets.map(p => [p.key, p])),
    abilityLookup,
    existingSig: new Set(existingRows.map(rowSignature)),
    onSaved,
    parsed: [],
  };

  const overlay = document.createElement('div');
  overlay.id = 'owned-import';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card owned-form-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-crop-name">Import pets from JSON</h3>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>
      <div class="owned-form-body">
        <p class="owned-import-hint">Paste a GardenPilot export — a pet object, an array of them, or <code>{ "pets": […] }</code>.</p>
        <div class="owned-import-drop" id="oi-drop">
          <span>Drop a <strong>.json</strong> file here, or</span>
          <button type="button" class="owned-form-btn ghost" id="oi-choose">Choose file</button>
          <input type="file" id="oi-file" accept=".json,application/json,text/plain" hidden>
        </div>
        <textarea class="owned-input owned-import-ta" id="oi-text" rows="6"
                  placeholder='…or paste the JSON here'></textarea>
        <div class="owned-import-preview" id="oi-preview"></div>
      </div>
      <div class="owned-form-actions">
        <span class="owned-form-spacer"></span>
        <button type="button" class="owned-form-btn ghost" id="oi-cancel">Cancel</button>
        <button type="button" class="owned-form-btn" id="oi-parse">Preview</button>
        <button type="button" class="owned-form-btn primary" id="oi-save" disabled>Import</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  overlay.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) closeOwnedImport();
  });
  document.getElementById('oi-cancel')?.addEventListener('click', closeOwnedImport);
  document.getElementById('oi-parse')?.addEventListener('click', doParse);
  bindFileDrop();
  document.getElementById('oi-save')?.addEventListener('click', doImport);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('dragover', _blockWindowDrop);
  window.addEventListener('drop', _blockWindowDrop);
}

export function closeOwnedImport() {
  document.getElementById('owned-import')?.remove();
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('dragover', _blockWindowDrop);
  window.removeEventListener('drop', _blockWindowDrop);
  _imp = null;
}

function onKeydown(e) { if (e.key === 'Escape') closeOwnedImport(); }

// File drop / picker → fill the textarea, then auto-preview.
// The ENTIRE modal card accepts drops (zone, textarea, anywhere) — a file
// dropped a few pixels off the dashed box must still load, never navigate.
function bindFileDrop() {
  const card = document.querySelector('#owned-import .owned-form-card');
  const drop = document.getElementById('oi-drop');
  const file = document.getElementById('oi-file');
  if (!card || !file) return;
  document.getElementById('oi-choose')?.addEventListener('click', () => file.click());
  file.addEventListener('change', () => loadFile(file.files?.[0]));
  card.addEventListener('dragover', e => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    drop?.classList.add('over');
  });
  card.addEventListener('dragleave', e => {
    if (!card.contains(e.relatedTarget)) drop?.classList.remove('over');
  });
  card.addEventListener('drop', e => {
    e.preventDefault();
    drop?.classList.remove('over');
    loadFile(e.dataTransfer?.files?.[0]);
  });
}

async function loadFile(f) {
  if (!f) return;
  const ta = document.getElementById('oi-text');
  if (!ta) return;
  try {
    ta.value = await f.text();
    doParse();
  } catch (err) {
    const el = document.getElementById('oi-preview');
    if (el) el.innerHTML = `<div class="owned-form-error">Could not read file: ${err.message}</div>`;
  }
}

// ── Parsing + mapping ─────────────────────────

function firstNum(...vals) {
  for (const v of vals) { const n = Number(v); if (v != null && Number.isFinite(n)) return n; }
  return null;
}

function rowSignature(row) {
  const ab = abilityKeys(row.abilities).slice().sort().join(',');
  return `${row.pet_key}|${(row.nickname ?? '').trim().toLowerCase()}|${ab}`;
}

// Game pet object → owned_pets payload + status notes.
function mapPet(raw) {
  const petKey = raw.pet_key ?? raw.petSpecies ?? raw.species ?? raw.key ?? null;
  if (!petKey || typeof petKey !== 'string') return { error: 'No species field (petSpecies)' };

  const muts = Array.isArray(raw.mutations) ? raw.mutations : [];
  const variant = muts.includes('Rainbow') ? 'Rainbow'
    : (muts.includes('Gold') || muts.includes('Golden')) ? 'Gold' : 'Normal';
  const droppedMuts = muts.filter(m => !['Gold', 'Golden', 'Rainbow'].includes(m));

  const abilities = (Array.isArray(raw.abilities) ? raw.abilities : []).filter(a => typeof a === 'string');
  const maxRaw = firstNum(raw.max_level, raw.maxLevel, raw.maxStrength, raw.max_strength, raw.potential);
  const curRaw = firstNum(raw.current_level, raw.currentLevel, raw.strength, raw.currentStrength, raw.level);
  // No explicit strength fields (game exports never have them) → compute the
  // real values from xp + targetScale via the game's own formula.
  const computed = (maxRaw == null && curRaw == null)
    ? computeGameStrength(raw, _imp.byKey[petKey])
    : null;
  const max_level = clampMaxLevel(maxRaw ?? computed?.max_level ?? 100);
  const current_level = clampCurLevel(curRaw ?? computed?.current_level ?? max_level, max_level);
  const weight = firstNum(raw.weight_kg, raw.weightKg, raw.weight);

  const payload = {
    pet_key: petKey,
    nickname: (typeof raw.name === 'string' && raw.name.trim()) ? raw.name.trim()
            : (typeof raw.nickname === 'string' && raw.nickname.trim()) ? raw.nickname.trim() : null,
    weight_kg: weight,
    variant,
    current_level,
    max_level,
    abilities,
  };

  const notes = [];
  if (!_imp.byKey[petKey]) notes.push('unknown species');
  const unknownAb = abilities.filter(a => !_imp.abilityLookup[a]);
  if (unknownAb.length) notes.push(`unrecognized: ${unknownAb.join(', ')}`);
  if (droppedMuts.length) notes.push(`mutations ignored: ${droppedMuts.join(', ')}`);
  if (maxRaw == null && curRaw == null) {
    notes.push(computed ? `strength ${computed.current_level}/${computed.max_level} computed from XP & size`
                        : 'no strength data — defaulted 100/100');
  }
  const dup = _imp.existingSig.has(rowSignature(payload));
  return { payload, notes, dup };
}

function doParse() {
  const el = document.getElementById('oi-preview');
  const ta = document.getElementById('oi-text');
  if (!el || !ta) return;
  let data;
  try {
    data = JSON.parse(ta.value);
  } catch (e) {
    el.innerHTML = `<div class="owned-form-error">Not valid JSON: ${e.message}</div>`;
    setSaveEnabled(false);
    return;
  }
  let list = Array.isArray(data) ? data : Array.isArray(data?.pets) ? data.pets : [data];
  // GardenPilot's inventory.getPets() wraps each pet: { item:{…}, location, storageDecorId }.
  list = list.filter(x => x && typeof x === 'object')
             .map(x => (x.item && typeof x.item === 'object' && (x.item.itemType === 'Pet' || x.item.petSpecies)) ? x.item : x)
             .filter(x => x.itemType == null || x.itemType === 'Pet');

  _imp.parsed = list.map(mapPet);
  const importable = _imp.parsed.filter(p => p.payload && !p.dup);
  const dups = _imp.parsed.filter(p => p.dup).length;
  const errs = _imp.parsed.filter(p => p.error).length;

  const rows = _imp.parsed.map(p => {
    if (p.error) return `<div class="owned-imp-row err">⚠ ${p.error}</div>`;
    const sp = _imp.byKey[p.payload.pet_key];
    const species = sp ? petDisplayName(sp) : p.payload.pet_key;
    const label = p.payload.nickname ? `${p.payload.nickname} <span class="muted">(${species})</span>` : species;
    const meta = [
      p.payload.variant !== 'Normal' ? p.payload.variant : '',
      `⚡ ${p.payload.current_level}/${p.payload.max_level}`,
      `${p.payload.abilities.length} abilit${p.payload.abilities.length === 1 ? 'y' : 'ies'}`,
    ].filter(Boolean).join(' · ');
    const note = p.dup ? 'duplicate — will skip' : p.notes.join('; ');
    return `<div class="owned-imp-row${p.dup ? ' dup' : ''}${p.notes.length ? ' warn' : ''}">
      <span class="owned-imp-name">${label}</span>
      <span class="owned-imp-meta">${meta}</span>
      ${note ? `<span class="owned-imp-note">${note}</span>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="owned-imp-summary">${importable.length} to import${dups ? ` · ${dups} duplicate${dups === 1 ? '' : 's'} skipped` : ''}${errs ? ` · ${errs} invalid` : ''}</div>
    ${rows}`;
  setSaveEnabled(importable.length > 0, importable.length);
}

function setSaveEnabled(on, n = 0) {
  const btn = document.getElementById('oi-save');
  if (!btn) return;
  btn.disabled = !on;
  btn.textContent = on ? `Import ${n}` : 'Import';
}

// ── Persistence ───────────────────────────────

async function doImport() {
  const btn = document.getElementById('oi-save');
  if (!btn || btn.disabled) return;
  const payloads = _imp.parsed.filter(p => p.payload && !p.dup).map(p => p.payload);
  if (!payloads.length) return;
  btn.disabled = true;
  btn.textContent = 'Importing…';

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');
    const { error } = await supabase.from('owned_pets')
      .insert(payloads.map(p => ({ ...p, user_id: user.id })));
    if (error) throw error;
    const cb = _imp.onSaved;
    closeOwnedImport();
    cb?.();
  } catch (err) {
    console.error('[owned-import] failed:', err);
    btn.disabled = false;
    btn.textContent = `Import ${payloads.length}`;
    const el = document.getElementById('oi-preview');
    if (el) el.insertAdjacentHTML('afterbegin', `<div class="owned-form-error">${err.message || 'Import failed.'}</div>`);
  }
}
