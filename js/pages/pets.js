// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/pets.js
// v0.6.1 — orchestrator: tabs (Pets/Mutations), sort, modal, progress
// ═══════════════════════════════════════════════

import {
  getPetsSorted, fetchEggs, fetchPlants, fetchAbilities, PET_VARIANTS,
} from '../lib/aries.js';
import { getSupabase } from '../lib/supabase.js';
import { buildPetCard, buildPetRow, filterPets, petDisplayName } from './pets-grid.js';
import { openPetModal, closePetModal } from './pets-modal.js';
import { renderPetConditions } from './pets-conditions.js';

// ── State (persists across navigation, mirrors plants.js) ──
let _pets = [], _user = null;
let _eggLookup = {}, _cropLookup = {}, _abilityLookup = {};
let _discovered = new Map();
let _ownedCounts = new Map(); // petKey → count of owned instances
let _ownedByKey  = new Map(); // petKey → [{ nickname, variant, weight_kg }]
let _activeTab   = 'pets';    // 'pets' | 'mutations'
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
        <div class="tab-group">
          <button class="tab-btn${_activeTab === 'pets' ? ' active' : ''}" data-tab="pets">🐾 Pets</button>
          <button class="tab-btn${_activeTab === 'mutations' ? ' active' : ''}" data-tab="mutations">✨ Mutations</button>
        </div>
        <div class="overall-progress-wrap">
          <div class="overall-bar-track"><div class="overall-bar-fill" id="pet-overall-bar"></div></div>
          <span class="overall-text" id="pet-overall-text">—</span>
        </div>
      </div>
      <div class="toolbar-row toolbar-controls" id="pet-controls"${_activeTab === 'mutations' ? ' style="display:none"' : ''}>
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

    const [pets, eggs, plants, abilities, entries, owned] = await Promise.all([
      getPetsSorted(), fetchEggs(), fetchPlants(), fetchAbilities(),
      fetchPetEntries(supabase, user),
      fetchOwnedSummary(supabase, user),
    ]);

    _pets          = pets;
    _eggLookup     = eggs ?? {};
    _cropLookup    = buildCropLookup(plants);
    _abilityLookup = abilities ?? {};
    _discovered    = buildDiscoveredMap(entries);
    _ownedCounts   = owned.counts;
    _ownedByKey    = owned.byKey;

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
  closeOwnedPops();
  _pets = []; _eggLookup = {}; _cropLookup = {}; _abilityLookup = {};
  _discovered = new Map(); _user = null;
  _ownedCounts = new Map(); _ownedByKey = new Map();
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
  document.querySelector('.tab-group')?.addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn || btn.dataset.tab === _activeTab) return;
    _activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === _activeTab));
    const controls = document.getElementById('pet-controls');
    if (controls) controls.style.display = _activeTab === 'pets' ? '' : 'none';
    renderCurrentView();
  });

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
    if (_activeTab !== 'pets') return;

    // Owned-count badge: toggle the inline instance popover; don't open the modal.
    const badge = e.target.closest('.owned-badge');
    if (badge) {
      e.stopPropagation();
      toggleOwnedPop(badge);
      return;
    }
    // A click anywhere else closes any open popover.
    closeOwnedPops();

    const card = e.target.closest('[data-pet-key]');
    if (!card) return;
    const pet = _pets.find(p => p.key === card.dataset.petKey);
    if (pet) openPetModal(pet, ctx(), _discovered, _user, onModalToggle);
  });
}

// ── Owned-instance popover (lightweight, built from preloaded data) ──

let _onPopDismiss = null;
let _onPopKey = null;

function closeOwnedPops() {
  document.querySelectorAll('.owned-pop').forEach(el => el.remove());
  document.querySelectorAll('.owned-badge.open').forEach(b => b.classList.remove('open'));
  if (_onPopDismiss) {
    window.removeEventListener('scroll', _onPopDismiss, true);
    window.removeEventListener('resize', _onPopDismiss, true);
    _onPopDismiss = null;
  }
  if (_onPopKey) {
    document.removeEventListener('keydown', _onPopKey, true);
    _onPopKey = null;
  }
}

function toggleOwnedPop(badge) {
  const wasOpen = badge.classList.contains('open');
  closeOwnedPops();
  if (wasOpen) return;

  const key  = badge.dataset.ownedSpecies;
  const list = _ownedByKey.get(key) ?? [];
  if (!list.length) return;

  const rows = list.map(i => {
    const nick = (i.nickname && i.nickname.trim()) ? i.nickname.trim() : '(unnamed)';
    const mut  = i.variant && i.variant !== 'Normal' ? `<span class="owned-pop-mut">${i.variant}</span>` : '';
    const wt   = i.weight_kg != null ? `<span class="owned-pop-wt">${Number(i.weight_kg).toLocaleString(undefined, { maximumFractionDigits: 3 })} kg</span>` : '';
    return `<div class="owned-pop-row"><span class="owned-pop-nick">${nick}</span>${mut}${wt}</div>`;
  }).join('');

  const pop = document.createElement('div');
  pop.className = 'owned-pop';
  pop.innerHTML = `<div class="owned-pop-head">Owned · ${list.length}</div>${rows}`;
  document.body.appendChild(pop);
  badge.classList.add('open');

  // Anchor under the badge, clamped to the viewport.
  const r = badge.getBoundingClientRect();
  const w = pop.offsetWidth;
  let left = r.left;
  if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
  pop.style.left = `${Math.max(8, left)}px`;
  pop.style.top  = `${r.bottom + 6}px`;

  // Dismiss on escape / scroll / resize. Outside clicks within #pets-content are
  // handled by the content click listener (it calls closeOwnedPops).
  _onPopDismiss = () => closeOwnedPops();
  _onPopKey = (e) => { if (e.key === 'Escape') closeOwnedPops(); };
  document.addEventListener('keydown', _onPopKey, true);
  window.addEventListener('scroll', _onPopDismiss, true);
  window.addEventListener('resize', _onPopDismiss, true);
}

function ctx() {
  return { eggLookup: _eggLookup, cropLookup: _cropLookup, abilityLookup: _abilityLookup };
}

// ── View rendering ────────────────────────────

function renderCurrentView() {
  const content = document.getElementById('pets-content');
  if (!content) return;
  if (_activeTab === 'mutations') {
    renderPetConditions(content, _pets, _discovered, pet => openPetModal(pet, ctx(), _discovered, _user, onModalToggle));
    return;
  }
  const visible = filterPets(_pets, _discovered, { searchQuery: _search, missingOnly: _missingOnly });
  if (!visible.length) {
    content.innerHTML = `<div class="state-empty">No pets match your filters.</div>`;
    return;
  }
  if (_viewMode === 'list') {
    content.innerHTML = `<div class="plants-list">${visible.map(p => buildPetRow(p, _discovered, _eggLookup, _ownedCounts)).join('')}</div>`;
  } else {
    content.innerHTML = `<div class="plants-grid">${visible.map(p => buildPetCard(p, _discovered, _eggLookup, _ownedCounts)).join('')}</div>`;
  }
}

// ── Callbacks from modal ──────────────────────

function onModalToggle(petKey, variantKey, wasDiscovered) {
  if (!_discovered.has(petKey)) _discovered.set(petKey, new Set());
  const set = _discovered.get(petKey);
  if (variantKey) { wasDiscovered ? set.delete(variantKey) : set.add(variantKey); }
  updateOverallProgress();
  if (_activeTab === 'mutations') renderCurrentView();
  else refreshCardInGrid(petKey);
}

function refreshCardInGrid(petKey) {
  const el = document.querySelector(`[data-pet-key="${petKey}"]`);
  if (!el) return;
  const pet = _pets.find(p => p.key === petKey);
  if (!pet) return;
  el.outerHTML = _viewMode === 'list'
    ? buildPetRow(pet, _discovered, _eggLookup, _ownedCounts)
    : buildPetCard(pet, _discovered, _eggLookup, _ownedCounts);
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

// Owned-pet counts + instances for the per-species badge. Guarded: if the
// owned_pets table hasn't been migrated yet, this returns empty maps so the
// Pets page still works.
async function fetchOwnedSummary(supabase, user) {
  const empty = { counts: new Map(), byKey: new Map() };
  if (!user) return empty;
  const { data, error } = await supabase.from('owned_pets')
    .select('pet_key, nickname, weight_kg, variant')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) { console.warn('[pets] owned summary skipped:', error.message); return empty; }
  const counts = new Map(), byKey = new Map();
  for (const row of data ?? []) {
    counts.set(row.pet_key, (counts.get(row.pet_key) ?? 0) + 1);
    if (!byKey.has(row.pet_key)) byKey.set(row.pet_key, []);
    byKey.get(row.pet_key).push(row);
  }
  return { counts, byKey };
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
