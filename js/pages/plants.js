// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants.js
// v0.5.1 — sort toggle + variant modal
// ═══════════════════════════════════════════════

import {
  getPlantsSorted, fetchMutations,
  CROP_VARIANTS, PLANT_SORT_MODES,
} from '../lib/aries.js';
import { getSupabase } from '../lib/supabase.js';

// ── Module state ──────────────────────────────
let _container   = null;
let _plants      = [];
let _mutations   = {};
let _discovered  = new Map();
let _currentUser = null;
let _sortMode    = PLANT_SORT_MODES.JOURNAL;

// ── Page interface ────────────────────────────

export function render(container) {
  _container = container;
  container.innerHTML = `
    <link rel="stylesheet" href="css/plants.css">
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h2 class="page-title">Plants</h2>
          <p class="page-subtitle">${CROP_VARIANTS.length} variants per crop</p>
        </div>
        <div class="sort-toggle" id="sort-toggle">
          <button class="sort-btn active" data-sort="journal" title="In-game Journal order">Journal</button>
          <button class="sort-btn" data-sort="price"   title="Sort by seed price">Price</button>
          <button class="sort-btn" data-sort="az"      title="Sort A → Z">A–Z</button>
        </div>
      </div>
    </div>
    <div id="plants-content">
      <div class="state-loading"><div class="spinner"></div><span>Loading plants…</span></div>
    </div>`;
}

export async function init() {
  try {
    await loadPlants();
    document.getElementById('plants-content')?.addEventListener('click', onCardClick);
    document.getElementById('sort-toggle')?.addEventListener('click', onSortClick);
  } catch (err) {
    console.error('[plants]', err);
    showError(err.message);
  }
}

export function destroy() {
  closeModal();
  _container = null;
  _plants = []; _mutations = {}; _discovered = new Map(); _currentUser = null;
}

// ── Sort toggle ───────────────────────────────

async function onSortClick(e) {
  const btn = e.target.closest('.sort-btn');
  if (!btn) return;
  const mode = btn.dataset.sort;
  if (mode === _sortMode) return;

  _sortMode = mode;
  document.querySelectorAll('.sort-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.sort === mode));

  const content = document.getElementById('plants-content');
  if (content) content.innerHTML =
    `<div class="state-loading"><div class="spinner"></div><span>Sorting…</span></div>`;

  _plants = await getPlantsSorted(_sortMode);
  renderGrid();
}

// ── Data loading ──────────────────────────────

async function loadPlants() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  _currentUser = user;

  const [plants, mutations, entries] = await Promise.all([
    getPlantsSorted(_sortMode),
    fetchMutations(),
    fetchJournalEntries(supabase, user),
  ]);

  _plants    = plants;
  _mutations = mutations;
  _discovered = buildDiscoveredMap(entries);
  renderGrid();
}

async function fetchJournalEntries(supabase, user) {
  if (!user) return [];
  const { data, error } = await supabase
    .from('journal_entries').select('item_key, variant_key')
    .eq('user_id', user.id).eq('item_type', 'crop');
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

// ── Grid ──────────────────────────────────────

function renderGrid() {
  const content = document.getElementById('plants-content');
  if (!content) return;
  if (!_plants.length) {
    content.innerHTML = `<div class="state-error"><span class="error-icon">🌱</span><span>No plant data. Try refreshing.</span></div>`;
    return;
  }
  content.innerHTML = `<div class="plants-grid">${_plants.map(buildCard).join('')}</div>`;
}

function buildCard(plant) {
  const { key } = plant;
  const name   = plant.crop?.name ?? key;
  const sprite = plant.crop?.sprite ?? plant.seed?.sprite ?? null;
  const disc   = _discovered.get(key)?.size ?? 0;
  const total  = CROP_VARIANTS.length;
  const pct    = Math.round((disc / total) * 100);
  const done   = disc >= total;
  const buy    = plant.seed?.purchasable === true;

  const img = sprite
    ? `<img class="plant-sprite" src="${sprite}" alt="${name}" loading="lazy"
           onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'plant-sprite-missing',textContent:'🌿'}))">`
    : `<div class="plant-sprite-missing">🌿</div>`;

  return `
    <div class="plant-card${buy ? ' purchasable' : ''}" data-plant-key="${key}">
      ${img}
      <span class="plant-name">${name}</span>
      <div class="plant-progress">
        <span class="progress-label">${disc} / ${total}</span>
        <div class="progress-bar-track">
          <div class="progress-bar-fill${done ? ' complete' : ''}" style="width:${pct}%"></div>
        </div>
      </div>
    </div>`;
}

function refreshCard(plantKey) {
  const card = document.querySelector(`[data-plant-key="${plantKey}"]`);
  if (!card) return;
  const plant = _plants.find(p => p.key === plantKey);
  if (plant) card.outerHTML = buildCard(plant);
}

// ── Modal ─────────────────────────────────────

function onCardClick(e) {
  const card = e.target.closest('[data-plant-key]');
  if (!card) return;
  const plant = _plants.find(p => p.key === card.dataset.plantKey);
  if (plant) openModal(plant);
}

function openModal(plant) {
  closeModal();
  const key    = plant.key;
  const name   = plant.crop?.name ?? key;
  const sprite = plant.crop?.sprite ?? plant.seed?.sprite ?? null;
  const disc   = _discovered.get(key) ?? new Set();

  const tiles = CROP_VARIANTS.map(variant => {
    const isDisc    = disc.has(variant);
    const varSprite = getVariantSprite(variant, sprite);
    return `
      <div class="variant-tile${isDisc ? ' discovered' : ''}"
           data-variant="${variant}" data-plant-key="${key}">
        <div class="variant-img-wrap">
          ${varSprite
            ? `<img src="${varSprite}" alt="${variant}" loading="lazy"
                   onerror="this.style.display='none'">`
            : `<span class="variant-emoji">${variantEmoji(variant)}</span>`}
          ${isDisc ? `<span class="variant-check">✓</span>` : ''}
        </div>
        <span class="variant-name">${variant}</span>
      </div>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'plant-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        ${sprite ? `<img class="modal-crop-sprite" src="${sprite}" alt="${name}">` : ''}
        <div class="modal-crop-info">
          <h3 class="modal-crop-name">${name}</h3>
          <p class="modal-crop-progress" id="modal-progress-text">
            ${disc.size} / ${CROP_VARIANTS.length} variants discovered
          </p>
        </div>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>
      <div class="modal-variants-grid">${tiles}</div>
    </div>`;

  overlay.addEventListener('click', onModalClick);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.addEventListener('keydown', onModalKeydown);
}

function closeModal() {
  document.getElementById('plant-modal')?.remove();
  document.removeEventListener('keydown', onModalKeydown);
}

function onModalKeydown(e) { if (e.key === 'Escape') closeModal(); }

async function onModalClick(e) {
  if (e.target.classList.contains('modal-overlay') ||
      e.target.classList.contains('modal-close')) { closeModal(); return; }

  const tile = e.target.closest('.variant-tile');
  if (!tile) return;

  const plantKey   = tile.dataset.plantKey;
  const variantKey = tile.dataset.variant;
  const wasDisc    = tile.classList.contains('discovered');

  // Optimistic update
  tile.classList.toggle('discovered', !wasDisc);
  if (!wasDisc) {
    tile.querySelector('.variant-img-wrap')
        .insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
  } else {
    tile.querySelector('.variant-check')?.remove();
  }

  if (!_discovered.has(plantKey)) _discovered.set(plantKey, new Set());
  const set = _discovered.get(plantKey);
  wasDisc ? set.delete(variantKey) : set.add(variantKey);

  const prog = document.getElementById('modal-progress-text');
  if (prog) prog.textContent = `${set.size} / ${CROP_VARIANTS.length} variants discovered`;
  refreshCard(plantKey);

  try {
    await persistToggle(plantKey, variantKey, wasDisc);
  } catch (err) {
    console.error('[plants] toggle failed, reverting:', err);
    tile.classList.toggle('discovered', wasDisc);
    if (wasDisc) {
      tile.querySelector('.variant-img-wrap')
          .insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
    } else {
      tile.querySelector('.variant-check')?.remove();
    }
    wasDisc ? set.add(variantKey) : set.delete(variantKey);
    refreshCard(plantKey);
  }
}

async function persistToggle(plantKey, variantKey, wasDiscovered) {
  const supabase = await getSupabase();
  if (wasDiscovered) {
    const { error } = await supabase.from('journal_entries').delete()
      .eq('user_id', _currentUser.id).eq('item_type', 'crop')
      .eq('item_key', plantKey).eq('variant_key', variantKey);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('journal_entries').insert({
      user_id: _currentUser.id, item_type: 'crop',
      item_key: plantKey, variant_key: variantKey,
    });
    if (error) throw error;
  }
}

// ── Helpers ───────────────────────────────────

function getVariantSprite(variant, cropSprite) {
  if (variant === 'Normal' || variant === 'MaxWeight') return cropSprite;
  return _mutations[variant]?.sprite ?? null;
}

function variantEmoji(variant) {
  const map = {
    Normal:'🌿', Wet:'💧', Chilled:'❄️', Frozen:'🧊', Thunderstruck:'⚡',
    Dawnlit:'🌸', Amberlit:'🌕', Dawnbound:'💜', Amberbound:'🟠',
    Gold:'✨', Rainbow:'🌈', MaxWeight:'⚖️',
  };
  return map[variant] ?? '🌿';
}

function showError(msg) {
  const content = document.getElementById('plants-content');
  if (content) content.innerHTML =
    `<div class="state-error"><span class="error-icon">⚠️</span><span>${msg}</span></div>`;
}
