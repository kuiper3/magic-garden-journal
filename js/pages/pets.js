// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/pets.js
// v0.6.0 — orchestrator: grid, sort, modal, progress
// ═══════════════════════════════════════════════

import {
  getPetsSorted, fetchEggs, fetchPlants, fetchAbilities, PET_VARIANTS,
} from '../lib/aries.js';
import { getSupabase } from '../lib/supabase.js';
import { buildPetCard, buildPetRow, filterPets, petDisplayName } from './pets-grid.js';
import { openPetModal, closePetModal } from './pets-modal.js';

// ── State (persists across navigation, mirrors plants.js) ──
let _pets = [], _user = null;
let _eggLookup = {}, _cropLookup = {}, _abilityLookup = {};
let _discovered = new Map();
let _viewMode    = 'cards';   // 'cards' | 'list'
let _sortMode    = 'egg';     // 'egg'   | 'az'
let _missingOnly = false;
let _search      = '';

// ── Page interface ────────────────────────────

export function render(container) {
  container.innerHTML = `
    <link rel="stylesheet" href="css/plants.css">
    <link rel="stylesheet" href="css/pets.css">
    <div class="plants-toolbar">
      <div class="toolbar-row toolbar-top">
        <div class="pets-title">🐾 Pets</div>
        <div class="overall-progress-wrap">
          <div class="overall-bar-track"><div class="overall-bar-fill" id="pet-overall-bar"></div></div>
          <span class="overall-text" id="pet-overall-text">—</span>
        </div>
      </div>
      <div class="toolbar-row toolbar-controls">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="pet-search" placeholder="Search…" autocomplete="off" value="${_search}">
        </div>
        <div class="ctrl-group">
          <div class="sort-toggle">
            <button class="sort-btn${_sortMode === 'egg' ? ' active' : ''}" data-sort="egg">Egg</button>
            <button class="sort-btn${_sortMode === 'az' ? ' active' : ''}" data-sort="az">A–Z</button>
          </div>
          <div class="view-toggle">
            <button class="view-btn${_viewMode === 'cards' ? ' active' : ''}" data-view="cards" title="Card view">⊞</button>
            <button class="view-btn${_viewMode === 'list' ? ' active' : ''}" data-view="list" title="List view">☰</button>
          </div>
          <button class="filter-pill${_missingOnly ? ' active' : ''}" id="pet-missing-toggle">Missing only</button>
        </div>
      </div>
    </div>
    <div id="pets-content">
      <div class="state-loading"><div class="spinner"></div><span>Loading pets…</span></div>
    </div>`;
}

export async function init() {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    _user = user;

    const [pets, eggs, plants, abilities, entries] = await Promise.all([
      getPetsSorted(), fetchEggs(), fetchPlants(), fetchAbilities(),
      fetchPetEntries(supabase, user),
    ]);

    _pets          = pets;
    _eggLookup     = eggs ?? {};
    _cropLookup    = buildCropLookup(plants);
    _abilityLookup = abilities ?? {};
    _discovered    = buildDiscoveredMap(entries);

    applySort();
    updateOverallProgress();
    renderCurrentView();
    bindToolbar();
  } catch (err) {
    console.error('[pets]', err);
    const el = document.getElementById('pets-content');
    if (el) el.innerHTML = `<div class="state-error"><span>⚠️ ${err.message}</span></div>`;
  }
}

export function destroy() {
  closePetModal();
  _pets = []; _eggLookup = {}; _cropLookup = {}; _abilityLookup = {};
  _discovered = new Map(); _user = null;
}

// ── Sorting ───────────────────────────────────
// getPetsSorted() already returns cheapest-egg-price order (our "Egg" mode).
// A–Z re-sorts a copy by display name.

function applySort() {
  if (_sortMode === 'az') {
    _pets = [..._pets].sort((a, b) => petDisplayName(a).localeCompare(petDisplayName(b)));
  } else {
    _pets = [..._pets].sort((a, b) => (a.eggPrice - b.eggPrice) || a.key.localeCompare(b.key));
  }
}

// ── Toolbar binding ───────────────────────────

function bindToolbar() {
  document.querySelector('.sort-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('.sort-btn');
    if (!btn || btn.dataset.sort === _sortMode) return;
    _sortMode = btn.dataset.sort;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort === _sortMode));
    applySort();
    renderCurrentView();
  });

  document.querySelector('.view-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('.view-btn');
    if (!btn || btn.dataset.view === _viewMode) return;
    _viewMode = btn.dataset.view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === _viewMode));
    renderCurrentView();
  });

  document.getElementById('pet-missing-toggle')?.addEventListener('click', e => {
    _missingOnly = !_missingOnly;
    e.currentTarget.classList.toggle('active', _missingOnly);
    renderCurrentView();
  });

  document.getElementById('pet-search')?.addEventListener('input', e => {
    _search = e.target.value;
    renderCurrentView();
  });

  document.getElementById('pets-content')?.addEventListener('click', e => {
    const card = e.target.closest('[data-pet-key]');
    if (!card) return;
    const pet = _pets.find(p => p.key === card.dataset.petKey);
    if (pet) openPetModal(pet, ctx(), _discovered, _user, onModalToggle);
  });
}

function ctx() {
  return { eggLookup: _eggLookup, cropLookup: _cropLookup, abilityLookup: _abilityLookup };
}

// ── View rendering ────────────────────────────

function renderCurrentView() {
  const content = document.getElementById('pets-content');
  if (!content) return;
  const visible = filterPets(_pets, _discovered, { searchQuery: _search, missingOnly: _missingOnly });
  if (!visible.length) {
    content.innerHTML = `<div class="state-empty">No pets match your filters.</div>`;
    return;
  }
  if (_viewMode === 'list') {
    content.innerHTML = `<div class="plants-list">${visible.map(p => buildPetRow(p, _discovered, _eggLookup)).join('')}</div>`;
  } else {
    content.innerHTML = `<div class="plants-grid">${visible.map(p => buildPetCard(p, _discovered, _eggLookup)).join('')}</div>`;
  }
}

// ── Callbacks from modal ──────────────────────

function onModalToggle(petKey, variantKey, wasDiscovered) {
  if (!_discovered.has(petKey)) _discovered.set(petKey, new Set());
  const set = _discovered.get(petKey);
  if (variantKey) { wasDiscovered ? set.delete(variantKey) : set.add(variantKey); }
  updateOverallProgress();
  refreshCardInGrid(petKey);
}

function refreshCardInGrid(petKey) {
  const el = document.querySelector(`[data-pet-key="${petKey}"]`);
  if (!el) return;
  const pet = _pets.find(p => p.key === petKey);
  if (!pet) return;
  el.outerHTML = _viewMode === 'list'
    ? buildPetRow(pet, _discovered, _eggLookup)
    : buildPetCard(pet, _discovered, _eggLookup);
}

// ── Overall progress ──────────────────────────

function updateOverallProgress() {
  const total = _pets.length * PET_VARIANTS.length;
  let disc = 0;
  _discovered.forEach(set => { disc += set.size; });
  const pct = total > 0 ? Math.round((disc / total) * 100) : 0;
  const bar  = document.getElementById('pet-overall-bar');
  const text = document.getElementById('pet-overall-text');
  if (bar)  bar.style.width  = `${pct}%`;
  if (text) text.textContent = `${pct}% · ${disc.toLocaleString()} / ${total.toLocaleString()}`;
}

// ── Supabase ──────────────────────────────────

async function fetchPetEntries(supabase, user) {
  if (!user) return [];
  const { data, error } = await supabase.from('journal_entries')
    .select('item_key, variant_key').eq('user_id', user.id).eq('item_type', 'pet');
  if (error) { console.warn('[pets] journal fetch failed:', error.message); return []; }
  return data ?? [];
}

function buildDiscoveredMap(entries) {
  const map = new Map();
  for (const { item_key, variant_key } of entries) {
    if (!map.has(item_key)) map.set(item_key, new Set());
    map.get(item_key).add(variant_key);
  }
  return map;
}

// crop key → { name, sprite } for diet chips in the modal
function buildCropLookup(plants) {
  const map = {};
  if (!plants) return map;
  for (const [key, val] of Object.entries(plants)) {
    map[key] = { name: val.crop?.name ?? key, sprite: val.crop?.sprite ?? val.seed?.sprite ?? null };
  }
  return map;
}
