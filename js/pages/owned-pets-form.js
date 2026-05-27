// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/owned-pets-form.js
// v0.7.0 — add / edit modal for an owned pet instance
// ═══════════════════════════════════════════════

import { getSupabase } from '../lib/supabase.js';
import { petDisplayName } from './pets-grid.js';
import { OWNED_VARIANTS, ownedSpriteUrl, procShares } from './owned-pets-card.js';

function prettify(str) {
  return String(str ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// Module-scoped handles for the live form session.
let _form = null;

/**
 * Open the owned-pet form.
 * @param {object}   opts
 * @param {object|null} opts.row          Existing row for edit mode, or null to add.
 * @param {Array}    opts.allPets         Species list from getPetsSorted().
 * @param {object}   opts.abilityLookup   abilityKey → { name, description }.
 * @param {Function} opts.onSaved         Called after a successful save/delete.
 */
export function openOwnedForm({ row = null, allPets = [], abilityLookup = {}, onSaved } = {}) {
  closeOwnedForm();

  const isEdit  = !!row;
  const byKey   = Object.fromEntries(allPets.map(p => [p.key, p]));
  const sorted  = [...allPets].sort((a, b) => petDisplayName(a).localeCompare(petDisplayName(b)));

  _form = {
    isEdit,
    rowId:    row?.id ?? null,
    petKey:   row?.pet_key ?? sorted[0]?.key ?? '',
    nickname: row?.nickname ?? '',
    variant:  OWNED_VARIANTS.includes(row?.variant) ? row.variant : 'Normal',
    weight:   row?.weight_kg ?? '',
    // Editable ability-weight map. Seeded below from the row or species defaults.
    abilities: { ...(row?.abilities ?? {}) },
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

        <div class="owned-form-row owned-form-grid2">
          <label class="owned-field">
            <span class="owned-field-lbl">Mutation</span>
            <div class="owned-seg" id="ofp-variant">
              ${OWNED_VARIANTS.map(v => `
                <button type="button" class="owned-seg-btn${v === _form.variant ? ' active' : ''}"
                        data-variant="${v}">${v}</button>`).join('')}
            </div>
          </label>
          <label class="owned-field">
            <span class="owned-field-lbl">Weight <span class="owned-field-opt">(kg)</span></span>
            <input class="owned-input" id="ofp-weight" type="number" min="0" step="0.001"
                   inputmode="decimal" placeholder="0.000" value="${escapeAttr(String(_form.weight))}">
          </label>
        </div>

        <div class="owned-form-row">
          <div class="owned-field-lbl owned-ability-head">
            <span>Ability weights</span>
            <button type="button" class="owned-mini-btn" id="ofp-reset-ab" title="Reset to species defaults">Defaults</button>
          </div>
          <p class="owned-ability-note">Enter the weight of each ability as rolled on this pet. Proc share updates live.</p>
          <div class="owned-ability-list" id="ofp-abilities"></div>
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

  // Seed abilities for add-mode (or rows with none) from the species defaults.
  if (!Object.keys(_form.abilities).length) seedAbilitiesFromSpecies();
  renderSprite();
  renderAbilities();
  bindForm(overlay);
  document.addEventListener('keydown', onKeydown);
}

export function closeOwnedForm() {
  document.getElementById('owned-form')?.remove();
  document.removeEventListener('keydown', onKeydown);
  _form = null;
}

// ── Dynamic sub-renders ───────────────────────

function seedAbilitiesFromSpecies() {
  const sp = _form.byKey[_form.petKey];
  const weights = sp?.innateAbilityWeights ?? {};
  _form.abilities = { ...weights };
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

function renderAbilities() {
  const el = document.getElementById('ofp-abilities');
  if (!el) return;
  const keys = Object.keys(_form.abilities);
  if (!keys.length) {
    el.innerHTML = `<p class="owned-proc-empty">This species has no innate abilities on record.</p>`;
    return;
  }
  const shares = procShares(_form.abilities);
  const pctByKey = Object.fromEntries(shares.map(s => [s.key, s.pct]));
  el.innerHTML = keys.map(key => {
    const ab   = _form.abilityLookup[key] ?? {};
    const name = ab.name ?? prettify(key);
    const w    = _form.abilities[key];
    const pct  = Math.round(pctByKey[key] ?? 0);
    return `
      <div class="owned-ability-edit">
        <span class="owned-ability-name">${name}</span>
        <input class="owned-input owned-ability-weight" type="number" min="0" step="1"
               inputmode="numeric" data-ability="${key}" value="${escapeAttr(String(w))}">
        <span class="owned-ability-pct" data-pct-for="${key}">${pct}%</span>
      </div>`;
  }).join('');
}

function refreshPcts() {
  const shares = procShares(_form.abilities);
  const pctByKey = Object.fromEntries(shares.map(s => [s.key, Math.round(s.pct)]));
  document.querySelectorAll('[data-pct-for]').forEach(el => {
    el.textContent = `${pctByKey[el.dataset.pctFor] ?? 0}%`;
  });
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
    seedAbilitiesFromSpecies();
    renderSprite();
    renderAbilities();
  });

  document.getElementById('ofp-nick')?.addEventListener('input', e => {
    _form.nickname = e.target.value;
  });

  document.getElementById('ofp-weight')?.addEventListener('input', e => {
    _form.weight = e.target.value;
  });

  document.getElementById('ofp-variant')?.addEventListener('click', e => {
    const btn = e.target.closest('.owned-seg-btn');
    if (!btn) return;
    _form.variant = btn.dataset.variant;
    document.querySelectorAll('#ofp-variant .owned-seg-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.variant === _form.variant));
    renderSprite();
  });

  document.getElementById('ofp-abilities')?.addEventListener('input', e => {
    const inp = e.target.closest('.owned-ability-weight');
    if (!inp) return;
    const key = inp.dataset.ability;
    const v   = Number(inp.value);
    _form.abilities[key] = Number.isFinite(v) && v >= 0 ? v : 0;
    refreshPcts();
  });

  document.getElementById('ofp-reset-ab')?.addEventListener('click', () => {
    seedAbilitiesFromSpecies();
    renderAbilities();
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

  // Drop zero-weight abilities so the stored map stays clean.
  const abilities = Object.fromEntries(
    Object.entries(_form.abilities).filter(([, w]) => Number(w) > 0)
  );
  const weightNum = _form.weight === '' || _form.weight == null ? null : Number(_form.weight);

  const payload = {
    pet_key:   _form.petKey,
    nickname:  _form.nickname.trim() || null,
    weight_kg: Number.isFinite(weightNum) ? weightNum : null,
    variant:   _form.variant,
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
