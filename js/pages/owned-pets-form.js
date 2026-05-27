// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/owned-pets-form.js
// v0.7.1 — add / edit modal for an owned pet instance
// ═══════════════════════════════════════════════
// Fields: species · nickname (optional) · current + max level (steppers) ·
// weight · abilities (multi-select from the species' innate pool) ·
// mutation (Normal / Gold / Rainbow).  Ability values preview live, scaled by
// strength (current → max).
// ═══════════════════════════════════════════════

import { getSupabase } from '../lib/supabase.js';
import { petDisplayName } from './pets-grid.js';
import { OWNED_VARIANTS, ownedSpriteUrl } from './owned-pets-card.js';
import {
  abilityFacets, facetValue, abilityKeys,
  clampMaxLevel, clampCurLevel, LEVEL,
} from './owned-pets-abilities.js';

function prettify(str) {
  return String(str ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

let _form = null;

/**
 * Open the owned-pet form.
 * @param {object}      opts
 * @param {object|null} opts.row            Existing row for edit mode, or null to add.
 * @param {Array}       opts.allPets        Species list from getPetsSorted().
 * @param {object}      opts.abilityLookup  abilityKey → { name, description }.
 * @param {Function}    opts.onSaved        Called after a successful save/delete.
 */
export function openOwnedForm({ row = null, allPets = [], abilityLookup = {}, onSaved } = {}) {
  closeOwnedForm();

  const isEdit = !!row;
  const byKey  = Object.fromEntries(allPets.map(p => [p.key, p]));
  const sorted = [...allPets].sort((a, b) => petDisplayName(a).localeCompare(petDisplayName(b)));

  const petKey   = row?.pet_key ?? sorted[0]?.key ?? '';
  const maxLevel = clampMaxLevel(row?.max_level ?? 100);

  _form = {
    isEdit,
    rowId:    row?.id ?? null,
    petKey,
    nickname: row?.nickname ?? '',
    variant:  OWNED_VARIANTS.includes(row?.variant) ? row.variant : 'Normal',
    weight:   row?.weight_kg ?? '',
    maxLevel,
    curLevel: clampCurLevel(row?.current_level ?? maxLevel, maxLevel),
    selected: new Set(abilityKeys(row?.abilities)),
    byKey,
    abilityLookup,
    onSaved,
  };

  const speciesOptions = sorted.map(p =>
    `<option value="${p.key}"${p.key === _form.petKey ? ' selected' : ''}>${petDisplayName(p)}</option>`
  ).join('');

  const overlay = document.createElement('div');
  overlay.id = 'owned-form';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card owned-form-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3 class="modal-crop-name">${isEdit ? 'Edit pet' : 'Add a pet'}</h3>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>

      <div class="owned-form-body">
        <div class="owned-form-row owned-form-preview">
          <div class="owned-form-sprite" id="ofp-sprite"></div>
          <div class="owned-form-fields">
            <label class="owned-field">
              <span class="owned-field-lbl">Species</span>
              <select class="owned-input" id="ofp-species"${isEdit ? ' disabled' : ''}>${speciesOptions}</select>
            </label>
            <label class="owned-field">
              <span class="owned-field-lbl">Nickname <span class="owned-field-opt">(optional)</span></span>
              <input class="owned-input" id="ofp-nick" type="text" maxlength="40"
                     placeholder="e.g. Buzz" value="${escapeAttr(_form.nickname)}">
            </label>
          </div>
        </div>

        <div class="owned-form-row owned-form-grid3">
          <label class="owned-field">
            <span class="owned-field-lbl">Current strength</span>
            <input class="owned-input" id="ofp-cur" type="number" inputmode="numeric"
                   min="${LEVEL.CUR_MIN}" max="${_form.maxLevel}" step="1" value="${_form.curLevel}">
          </label>
          <label class="owned-field">
            <span class="owned-field-lbl">Max strength</span>
            <input class="owned-input" id="ofp-max" type="number" inputmode="numeric"
                   min="${LEVEL.MAX_MIN}" max="${LEVEL.MAX_MAX}" step="1" value="${_form.maxLevel}">
          </label>
          <label class="owned-field">
            <span class="owned-field-lbl">Weight <span class="owned-field-opt">(kg)</span></span>
            <input class="owned-input" id="ofp-weight" type="number" min="0" step="0.001"
                   inputmode="decimal" placeholder="0.000" value="${escapeAttr(String(_form.weight))}">
          </label>
        </div>

        <div class="owned-form-row">
          <div class="owned-field-lbl">Abilities <span class="owned-field-opt">(tap the ones it rolled)</span></div>
          <div class="owned-ability-pool" id="ofp-pool"></div>
          <div class="owned-ability-preview" id="ofp-preview"></div>
        </div>

        <div class="owned-form-row">
          <span class="owned-field-lbl">Mutation</span>
          <div class="owned-seg" id="ofp-variant">
            ${OWNED_VARIANTS.map(v => `
              <button type="button" class="owned-seg-btn${v === _form.variant ? ' active' : ''}"
                      data-variant="${v}">${v === 'Normal' ? 'None' : v}</button>`).join('')}
          </div>
        </div>
      </div>

      <div class="owned-form-actions">
        ${isEdit ? `<button type="button" class="owned-form-btn danger" id="ofp-delete">Delete</button>` : ''}
        <span class="owned-form-spacer"></span>
        <button type="button" class="owned-form-btn ghost" id="ofp-cancel">Cancel</button>
        <button type="button" class="owned-form-btn primary" id="ofp-save">${isEdit ? 'Save' : 'Add pet'}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  renderSprite();
  renderPool();
  renderPreview();
  bindForm(overlay);
  document.addEventListener('keydown', onKeydown);
}

export function closeOwnedForm() {
  document.getElementById('owned-form')?.remove();
  document.removeEventListener('keydown', onKeydown);
  _form = null;
}

// ── Sub-renders ───────────────────────────────

// The pool of abilities a species can roll = keys of its innateAbilityWeights.
function speciesPool() {
  const sp = _form.byKey[_form.petKey];
  return Object.keys(sp?.innateAbilityWeights ?? {});
}

function renderSprite() {
  const el = document.getElementById('ofp-sprite');
  if (!el) return;
  const sp  = _form.byKey[_form.petKey];
  const url = ownedSpriteUrl(sp, _form.variant);
  el.innerHTML = url
    ? `<img src="${url}" alt="${sp ? petDisplayName(sp) : ''}" loading="lazy" onerror="this.style.opacity='0.2'">`
    : `<span class="owned-hero-missing">🐾</span>`;
  el.className = `owned-form-sprite${_form.variant !== 'Normal' ? ' ' + _form.variant.toLowerCase() : ''}`;
}

function renderPool() {
  const el = document.getElementById('ofp-pool');
  if (!el) return;
  const pool = speciesPool();
  if (!pool.length) {
    el.innerHTML = `<p class="owned-ab-empty">This species has no innate abilities on record.</p>`;
    return;
  }
  el.innerHTML = pool.map(key => {
    const name = _form.abilityLookup[key]?.name ?? prettify(key);
    const on   = _form.selected.has(key);
    return `<button type="button" class="owned-ab-chip${on ? ' on' : ''}" data-ability="${key}">${name}</button>`;
  }).join('');
}

// Live preview of selected abilities' scaled values (current → max).
function renderPreview() {
  const el = document.getElementById('ofp-preview');
  if (!el) return;
  const keys = [..._form.selected].filter(k => speciesPool().includes(k));
  if (!keys.length) { el.innerHTML = ''; return; }
  const cur = _form.curLevel, max = _form.maxLevel, same = cur === max;
  el.innerHTML = keys.map(key => {
    const info = abilityFacets(key, _form.abilityLookup);
    const rows = info.facets.map(f => {
      if (f.kind === 'text') return `<span class="owned-pv-facet">${f.text}</span>`;
      const lo = facetValue(f, cur), hi = facetValue(f, max);
      return `<span class="owned-pv-facet">${f.label}: ${same ? hi : `${lo} → ${hi}`}</span>`;
    }).join('');
    return `<div class="owned-pv-row"><span class="owned-pv-name">${info.name}</span>${rows}</div>`;
  }).join('');
}

// ── Bindings ──────────────────────────────────

function bindForm(overlay) {
  overlay.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
      closeOwnedForm();
    }
  });

  document.getElementById('ofp-species')?.addEventListener('change', e => {
    _form.petKey = e.target.value;
    // New species → different ability pool; drop selections that no longer apply.
    const pool = new Set(speciesPool());
    _form.selected = new Set([..._form.selected].filter(k => pool.has(k)));
    renderSprite();
    renderPool();
    renderPreview();
  });

  document.getElementById('ofp-nick')?.addEventListener('input', e => {
    _form.nickname = e.target.value;
  });

  document.getElementById('ofp-weight')?.addEventListener('input', e => {
    _form.weight = e.target.value;
  });

  document.getElementById('ofp-max')?.addEventListener('input', e => {
    _form.maxLevel = clampMaxLevel(e.target.value);
    // Keep current ≤ max and update the current field's ceiling.
    _form.curLevel = clampCurLevel(_form.curLevel, _form.maxLevel);
    const curEl = document.getElementById('ofp-cur');
    if (curEl) { curEl.max = String(_form.maxLevel); curEl.value = String(_form.curLevel); }
    renderPreview();
  });
  document.getElementById('ofp-max')?.addEventListener('blur', e => {
    e.target.value = String(_form.maxLevel);
  });

  document.getElementById('ofp-cur')?.addEventListener('input', e => {
    _form.curLevel = clampCurLevel(e.target.value, _form.maxLevel);
    renderPreview();
  });
  document.getElementById('ofp-cur')?.addEventListener('blur', e => {
    e.target.value = String(_form.curLevel);
  });

  document.getElementById('ofp-pool')?.addEventListener('click', e => {
    const chip = e.target.closest('.owned-ab-chip');
    if (!chip) return;
    const key = chip.dataset.ability;
    if (_form.selected.has(key)) _form.selected.delete(key);
    else _form.selected.add(key);
    chip.classList.toggle('on', _form.selected.has(key));
    renderPreview();
  });

  document.getElementById('ofp-variant')?.addEventListener('click', e => {
    const btn = e.target.closest('.owned-seg-btn');
    if (!btn) return;
    _form.variant = btn.dataset.variant;
    document.querySelectorAll('#ofp-variant .owned-seg-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.variant === _form.variant));
    renderSprite();
  });

  document.getElementById('ofp-cancel')?.addEventListener('click', closeOwnedForm);
  document.getElementById('ofp-save')?.addEventListener('click', onSave);
  document.getElementById('ofp-delete')?.addEventListener('click', onDelete);
}

function onKeydown(e) { if (e.key === 'Escape') closeOwnedForm(); }

// ── Persistence ───────────────────────────────

async function onSave() {
  const btn = document.getElementById('ofp-save');
  if (!btn || btn.disabled) return;
  if (!_form.petKey) return;

  btn.disabled = true;
  btn.textContent = 'Saving…';

  const pool = new Set(speciesPool());
  const abilities = [..._form.selected].filter(k => pool.has(k));
  const weightNum = _form.weight === '' || _form.weight == null ? null : Number(_form.weight);

  const payload = {
    pet_key:       _form.petKey,
    nickname:      _form.nickname.trim() || null,
    weight_kg:     Number.isFinite(weightNum) ? weightNum : null,
    variant:       _form.variant,
    current_level: _form.curLevel,
    max_level:     _form.maxLevel,
    abilities,
  };

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not signed in.');

    if (_form.isEdit) {
      const { error } = await supabase.from('owned_pets')
        .update(payload).eq('id', _form.rowId).eq('user_id', user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('owned_pets')
        .insert({ ...payload, user_id: user.id });
      if (error) throw error;
    }
    const cb = _form.onSaved;
    closeOwnedForm();
    cb?.();
  } catch (err) {
    console.error('[owned-form] save failed:', err);
    btn.disabled = false;
    btn.textContent = _form.isEdit ? 'Save' : 'Add pet';
    flashError(err.message || 'Save failed.');
  }
}

async function onDelete() {
  if (!_form?.isEdit) return;
  const btn = document.getElementById('ofp-delete');
  if (btn?.dataset.confirm !== '1') {
    if (btn) { btn.dataset.confirm = '1'; btn.textContent = 'Confirm delete'; }
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting…'; }

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('owned_pets')
      .delete().eq('id', _form.rowId).eq('user_id', user.id);
    if (error) throw error;
    const cb = _form.onSaved;
    closeOwnedForm();
    cb?.();
  } catch (err) {
    console.error('[owned-form] delete failed:', err);
    if (btn) { btn.disabled = false; btn.textContent = 'Delete'; delete btn.dataset.confirm; }
    flashError(err.message || 'Delete failed.');
  }
}

function flashError(msg) {
  const card = document.querySelector('#owned-form .owned-form-card');
  if (!card) return;
  let el = card.querySelector('.owned-form-error');
  if (!el) {
    el = document.createElement('div');
    el.className = 'owned-form-error';
    card.querySelector('.owned-form-actions')?.before(el);
  }
  el.textContent = msg;
}

// Escape a string for safe use inside a double-quoted HTML attribute.
function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
