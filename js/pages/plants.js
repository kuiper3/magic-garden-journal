// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants.js
// v0.7.0 — orchestrator: tabs, toolbar, state
// ═══════════════════════════════════════════════

import { getPlantsSorted, fetchMutations, CROP_VARIANTS, PLANT_SORT_MODES } from '../lib/aries.js';
import { getSupabase } from '../lib/supabase.js';
import { buildCard, buildRow, filterPlants } from './plants-grid.js';
import { openModal, closeModal } from './plants-modal.js';
import { renderConditions } from './plants-conditions.js';

// ── State ─────────────────────────────────────
let _plants = [], _mutations = {}, _discovered = new Map(), _user = null;
let _activeTab    = 'plants';   // 'plants' | 'conditions'
let _viewMode     = 'cards';    // 'cards'  | 'list'
let _sortMode     = PLANT_SORT_MODES.JOURNAL;
let _missingOnly  = false;
let _search       = '';

// ── Page interface ────────────────────────────

export function render(container) {
  container.innerHTML = `
    <link rel="stylesheet" href="css/plants.css">
    <div class="plants-toolbar">
      <div class="toolbar-row toolbar-top">
        <div class="tab-group">
          <button class="tab-btn active" data-tab="plants">🌱 Plants</button>
          <button class="tab-btn" data-tab="conditions">⛅ Conditions</button>
        </div>
        <div class="overall-progress-wrap">
          <div class="overall-bar-track"><div class="overall-bar-fill" id="overall-bar"></div></div>
          <span class="overall-text" id="overall-text">—</span>
        </div>
      </div>
      <div class="toolbar-row toolbar-controls" id="plants-controls">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="plant-search" placeholder="Search…" autocomplete="off">
        </div>
        <div class="ctrl-group">
          <div class="sort-toggle">
            <button class="sort-btn active" data-sort="journal">Journal</button>
            <button class="sort-btn" data-sort="az">A–Z</button>
          </div>
          <div class="view-toggle">
            <button class="view-btn active" data-view="cards" title="Card view">⊞</button>
            <button class="view-btn" data-view="list" title="List view">☰</button>
          </div>
          <button class="filter-pill${_missingOnly ? ' active' : ''}" id="missing-toggle">Missing only</button>
        </div>
      </div>
    </div>
    <div id="plants-content">
      <div class="state-loading"><div class="spinner"></div><span>Loading plants…</span></div>
    </div>`;
}

export async function init() {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    _user = user;

    const [plants, mutations, entries] = await Promise.all([
      getPlantsSorted(_sortMode), fetchMutations(), fetchJournalEntries(supabase, user),
    ]);
    _plants    = plants;
    _mutations = mutations;
    _discovered = buildDiscoveredMap(entries);

    updateOverallProgress();
    renderCurrentView();
    bindToolbar();
  } catch (err) {
    console.error('[plants]', err);
    document.getElementById('plants-content').innerHTML =
      `<div class="state-error"><span>⚠️ ${err.message}</span></div>`;
  }
}

export function destroy() {
  closeModal();
  _plants = []; _mutations = {}; _discovered = new Map(); _user = null;
}

// ── Toolbar binding ───────────────────────────

function bindToolbar() {
  document.querySelector('.tab-group')?.addEventListener('click', async e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn || btn.dataset.tab === _activeTab) return;
    _activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === _activeTab));
    document.getElementById('plants-controls').style.display = _activeTab === 'plants' ? '' : 'none';
    renderCurrentView();
  });

  document.querySelector('.sort-toggle')?.addEventListener('click', async e => {
    const btn = e.target.closest('.sort-btn');
    if (!btn || btn.dataset.sort === _sortMode) return;
    _sortMode = btn.dataset.sort;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.toggle('active', b.dataset.sort === _sortMode));
    _plants = await getPlantsSorted(_sortMode);
    renderCurrentView();
  });

  document.querySelector('.view-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('.view-btn');
    if (!btn || btn.dataset.view === _viewMode) return;
    _viewMode = btn.dataset.view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === _viewMode));
    renderCurrentView();
  });

  document.getElementById('missing-toggle')?.addEventListener('click', e => {
    _missingOnly = !_missingOnly;
    e.currentTarget.classList.toggle('active', _missingOnly);
    renderCurrentView();
  });

  document.getElementById('plant-search')?.addEventListener('input', e => {
    _search = e.target.value;
    renderCurrentView();
  });

  document.getElementById('plants-content')?.addEventListener('click', e => {
    if (_activeTab !== 'plants') return;
    const card = e.target.closest('[data-plant-key]');
    if (!card) return;
    const plant = _plants.find(p => p.key === card.dataset.plantKey);
    if (plant) openModal(plant, _mutations, _discovered, _user, onModalToggle);
  });
}

// ── View rendering ────────────────────────────

function renderCurrentView() {
  const content = document.getElementById('plants-content');
  if (!content) return;
  if (_activeTab === 'conditions') {
    renderConditions(content, _plants, _discovered, onConditionToggle);
    return;
  }
  const visible = filterPlants(_plants, _discovered, { searchQuery: _search, missingOnly: _missingOnly });
  if (!visible.length) {
    content.innerHTML = `<div class="state-empty">No plants match your filters.</div>`;
    return;
  }
  if (_viewMode === 'list') {
    content.innerHTML = `<div class="plants-list">${visible.map(p => buildRow(p, _discovered)).join('')}</div>`;
  } else {
    content.innerHTML = `<div class="plants-grid">${visible.map(p => buildCard(p, _discovered)).join('')}</div>`;
  }
}

// ── Callbacks from modal / conditions ────────

function onModalToggle(plantKey, variantKey, wasDiscovered) {
  if (!_discovered.has(plantKey)) _discovered.set(plantKey, new Set());
  const set = _discovered.get(plantKey);
  if (variantKey) { wasDiscovered ? set.delete(variantKey) : set.add(variantKey); }
  updateOverallProgress();
  refreshCardInGrid(plantKey);
}

function onConditionToggle(plantKey) {
  updateOverallProgress();
  refreshCardInGrid(plantKey);
}

function refreshCardInGrid(plantKey) {
  const el = document.querySelector(`[data-plant-key="${plantKey}"]`);
  if (!el) return;
  const plant = _plants.find(p => p.key === plantKey);
  if (!plant) return;
  const html = _viewMode === 'list' ? buildRow(plant, _discovered) : buildCard(plant, _discovered);
  el.outerHTML = html;
}

// ── Overall progress ──────────────────────────

function updateOverallProgress() {
  const total = _plants.length * CROP_VARIANTS.length;
  let disc = 0;
  _discovered.forEach(set => { disc += set.size; });
  const pct = total > 0 ? Math.round((disc / total) * 100) : 0;
  const bar  = document.getElementById('overall-bar');
  const text = document.getElementById('overall-text');
  if (bar)  bar.style.width  = `${pct}%`;
  if (text) text.textContent = `${pct}% · ${disc.toLocaleString()} / ${total.toLocaleString()}`;
}

// ── Supabase ──────────────────────────────────

async function fetchJournalEntries(supabase, user) {
  if (!user) return [];
  const { data, error } = await supabase.from('journal_entries')
    .select('item_key, variant_key').eq('user_id', user.id).eq('item_type', 'crop');
  if (error) { console.warn('[plants] journal fetch failed:', error.message); return []; }
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
