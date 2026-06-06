// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/owned-pets.js
// v0.7.2 — orchestrator: owned-pet collection (own physical pets)
// ═══════════════════════════════════════════════
// Separate nav section (NOT a sub-tab of Pets). One row per physical pet the
// user owns. Discovery tracking lives on the Pets page; this tracks instances.
// ═══════════════════════════════════════════════

import { getPetsSorted, fetchAbilities } from '../lib/aries.js';
import { getSupabase } from '../lib/supabase.js';
import { petDisplayName } from './pets-grid.js';
import { buildOwnedCard } from './owned-pets-card.js';
import { openOwnedForm, closeOwnedForm } from './owned-pets-form.js';
import { openOwnedImport, closeOwnedImport } from './owned-pets-import.js';

// ── State (persists across navigation, mirrors pets.js) ──
let _allPets       = [];          // species list from getPetsSorted()
let _petsByKey     = {};          // key → species object
let _abilityLookup = {};          // abilityKey → { name, description }
let _rows          = [];          // owned_pets rows
let _user          = null;
let _search        = '';
let _sortMode      = 'species';   // 'species' | 'recent'

// ── Page interface ────────────────────────────

export function render(container) {
  container.innerHTML = `
    <link rel="stylesheet" href="css/plants.css">
    <link rel="stylesheet" href="css/pets.css">
    <link rel="stylesheet" href="css/owned-pets.css">
    <div class="plants-toolbar">
      <div class="toolbar-row toolbar-top">
        <h2 class="owned-page-title">Owned Pets <span class="owned-count-chip" id="owned-total">—</span></h2>
        <div class="owned-toolbar-btns">
          <button class="owned-add-btn ghost" id="owned-import">⇪ Import JSON</button>
          <button class="owned-add-btn" id="owned-add">＋ Add pet</button>
        </div>
      </div>
      <div class="toolbar-row toolbar-controls">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="owned-search" placeholder="Search nickname or species…" autocomplete="off" value="${_search}">
        </div>
        <div class="ctrl-group">
          <div class="sort-toggle">
            <button class="sort-btn${_sortMode === 'species' ? ' active' : ''}" data-sort="species">Species</button>
            <button class="sort-btn${_sortMode === 'recent' ? ' active' : ''}" data-sort="recent">Recent</button>
          </div>
        </div>
      </div>
    </div>
    <div id="owned-content">
      <div class="state-loading"><div class="spinner"></div><span>Loading your pets…</span></div>
    </div>`;
}

export async function init() {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    _user = user;

    const [pets, abilities, rows] = await Promise.all([
      getPetsSorted(), fetchAbilities(), fetchOwnedRows(supabase, user),
    ]);

    _allPets       = pets;
    _petsByKey     = Object.fromEntries(pets.map(p => [p.key, p]));
    _abilityLookup = abilities ?? {};
    _rows          = rows;

    renderContent();
    bindToolbar();
  } catch (err) {
    console.error('[owned-pets]', err);
    const el = document.getElementById('owned-content');
    if (el) el.innerHTML = `<div class="state-error"><span>⚠️ ${err.message}</span></div>`;
  }
}

export function destroy() {
  closeOwnedForm();
  closeOwnedImport();
  _allPets = []; _petsByKey = {}; _abilityLookup = {}; _rows = []; _user = null;
}

// ── Data ──────────────────────────────────────

async function fetchOwnedRows(supabase, user) {
  if (!user) return [];
  const { data, error } = await supabase.from('owned_pets')
    .select('id, pet_key, nickname, weight_kg, variant, current_level, max_level, abilities, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[owned-pets] fetch failed:', error.message); return []; }
  return data ?? [];
}

async function reload() {
  const supabase = await getSupabase();
  _rows = await fetchOwnedRows(supabase, _user);
  renderContent();
}

// ── Filter + sort ─────────────────────────────

function visibleRows() {
  const q = _search.trim().toLowerCase();
  let rows = _rows;
  if (q) {
    rows = rows.filter(r => {
      const sp   = _petsByKey[r.pet_key];
      const name = (sp ? petDisplayName(sp) : r.pet_key).toLowerCase();
      const nick = (r.nickname ?? '').toLowerCase();
      return name.includes(q) || nick.includes(q) || r.pet_key.toLowerCase().includes(q);
    });
  }
  return rows;
}

// ── Render ────────────────────────────────────

function renderContent() {
  const el = document.getElementById('owned-content');
  if (!el) return;

  const totalChip = document.getElementById('owned-total');
  if (totalChip) {
    const species = new Set(_rows.map(r => r.pet_key)).size;
    totalChip.textContent = `${_rows.length} pet${_rows.length === 1 ? '' : 's'} · ${species} species`;
  }

  if (!_rows.length) {
    el.innerHTML = `
      <div class="owned-empty">
        <div class="owned-empty-emblem">🐾</div>
        <p class="owned-empty-title">No pets yet</p>
        <p class="owned-empty-sub">Add the pets you own to track their mutation, weight, and ability proc rates.</p>
        <button class="owned-add-btn" id="owned-add-empty">＋ Add your first pet</button>
      </div>`;
    document.getElementById('owned-add-empty')?.addEventListener('click', openAdd);
    return;
  }

  const rows = visibleRows();
  if (!rows.length) {
    el.innerHTML = `<div class="state-empty">No pets match your search.</div>`;
    return;
  }

  if (_sortMode === 'recent') {
    el.innerHTML = `<div class="owned-grid">${rows.map(cardFor).join('')}</div>`;
    return;
  }

  // Species mode — group rows under a species header (egg-price order from API).
  const groups = new Map();
  for (const r of rows) {
    if (!groups.has(r.pet_key)) groups.set(r.pet_key, []);
    groups.get(r.pet_key).push(r);
  }
  const order = _allPets.map(p => p.key).filter(k => groups.has(k));
  for (const k of groups.keys()) if (!order.includes(k)) order.push(k);

  el.innerHTML = order.map(key => {
    const sp    = _petsByKey[key];
    const list  = groups.get(key);
    const name  = sp ? petDisplayName(sp) : key;
    const sprite = sp?.sprite
      ? `<img class="owned-group-sprite" src="${sp.sprite}" alt="${name}" loading="lazy" onerror="this.style.display='none'">`
      : `<span class="owned-group-sprite missing">🐾</span>`;
    return `
      <section class="owned-group">
        <header class="owned-group-head">
          ${sprite}
          <span class="owned-group-name">${name}</span>
          <span class="owned-group-count">×${list.length}</span>
        </header>
        <div class="owned-grid">${list.map(cardFor).join('')}</div>
      </section>`;
  }).join('');
}

function cardFor(row) {
  return buildOwnedCard(row, _petsByKey[row.pet_key], _abilityLookup);
}

// ── Toolbar + actions ─────────────────────────

function bindToolbar() {
  document.getElementById('owned-add')?.addEventListener('click', openAdd);
  document.getElementById('owned-import')?.addEventListener('click', openImport);

  document.getElementById('owned-search')?.addEventListener('input', e => {
    _search = e.target.value;
    renderContent();
  });

  document.querySelector('.sort-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('.sort-btn');
    if (!btn || btn.dataset.sort === _sortMode) return;
    _sortMode = btn.dataset.sort;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort === _sortMode));
    renderContent();
  });

  document.getElementById('owned-content')?.addEventListener('click', e => {
    const editId = e.target.closest('[data-owned-edit]')?.dataset.ownedEdit;
    const delId  = e.target.closest('[data-owned-del]')?.dataset.ownedDel;
    if (editId) { openEdit(editId); return; }
    if (delId)  { openEditForDelete(delId); return; }
  });
}

function openImport() {
  openOwnedImport({
    allPets: _allPets,
    abilityLookup: _abilityLookup,
    existingRows: _rows,
    onSaved: reload,
  });
}

function openAdd() {
  openOwnedForm({ row: null, allPets: _allPets, abilityLookup: _abilityLookup, onSaved: reload });
}

function openEdit(id) {
  const row = _rows.find(r => String(r.id) === String(id));
  if (!row) return;
  openOwnedForm({ row, allPets: _allPets, abilityLookup: _abilityLookup, onSaved: reload });
}

// Delete is handled inside the edit form (with a confirm step), so the trash
// icon opens the same form where the user can confirm removal.
function openEditForDelete(id) {
  openEdit(id);
}
