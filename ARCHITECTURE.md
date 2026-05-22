// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-conditions.js
// v0.7.1 — grid layout, clickable, opens plant modal
// ═══════════════════════════════════════════════

import { CROP_VARIANTS, composedSpriteUrl, isTallPlant, CROP_RARITY } from '../lib/aries.js';
import { acquisitionBadge } from '../lib/icons.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';
function rarityIconName(r) { return r === 'Mythical' ? 'Mythic' : r; }
function rarityIcon(key) {
  const r = CROP_RARITY[key] ?? 'Common';
  return `<img class="card-rarity-icon" src="${ARIES_BASE}/assets/sprites/ui/Rarity${rarityIconName(r)}.png" alt="${r}" title="${r}">`;
}

// Condition variants — skip Normal/MaxWeight (they're not "conditions")
const CONDITION_VARIANTS = CROP_VARIANTS.filter(v => v !== 'Normal' && v !== 'MaxWeight');

let _activeVariant  = 'Wet';
let _missingOnly    = false;
let _plants         = [];
let _discovered     = new Map();
let _onCardClick    = null;   // callback when user clicks a card — opens plant modal

export function renderConditions(container, plants, discovered, onCardClick) {
  _plants      = plants;
  _discovered  = discovered;
  _onCardClick = onCardClick;

  container.innerHTML = `
    <link rel="stylesheet" href="css/plants.css">
    <div class="cond-toolbar">
      <div class="cond-variant-tabs" id="cond-tabs">${buildTabs()}</div>
      <div class="cond-filter-row">
        <button class="filter-pill${_missingOnly ? '' : ' active'}" id="cond-show-all">Show all</button>
        <button class="filter-pill${_missingOnly ? ' active' : ''}" id="cond-missing">Missing only</button>
        <span class="cond-progress-inline" id="cond-progress"></span>
      </div>
    </div>
    <div id="cond-grid"></div>`;

  document.getElementById('cond-tabs')?.addEventListener('click', onTabClick);
  document.getElementById('cond-show-all')?.addEventListener('click', () => setFilter(false));
  document.getElementById('cond-missing')?.addEventListener('click', () => setFilter(true));
  document.getElementById('cond-grid')?.addEventListener('click', onCardClickHandler);

  renderGrid();
}

function buildTabs() {
  return CONDITION_VARIANTS.map(v =>
    `<button class="cond-tab${v === _activeVariant ? ' active' : ''}" data-variant="${v}">${v}</button>`
  ).join('');
}

function onTabClick(e) {
  const btn = e.target.closest('.cond-tab');
  if (!btn) return;
  _activeVariant = btn.dataset.variant;
  document.querySelectorAll('.cond-tab').forEach(b => b.classList.toggle('active', b.dataset.variant === _activeVariant));
  renderGrid();
}

function setFilter(missingOnly) {
  _missingOnly = missingOnly;
  document.getElementById('cond-show-all')?.classList.toggle('active', !missingOnly);
  document.getElementById('cond-missing')?.classList.toggle('active', missingOnly);
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('cond-grid');
  if (!grid) return;

  // Filter plants by missing-only state for the current variant
  const filtered = _plants.filter(plant => {
    const disc = _discovered.get(plant.key) ?? new Set();
    if (_missingOnly && disc.has(_activeVariant)) return false;
    return true;
  });

  // Update inline progress text
  const totalForVariant     = _plants.length;
  const discoveredForVariant = _plants.filter(p => _discovered.get(p.key)?.has(_activeVariant)).length;
  const pct = totalForVariant > 0 ? Math.round((discoveredForVariant / totalForVariant) * 100) : 0;
  const progEl = document.getElementById('cond-progress');
  if (progEl) progEl.innerHTML = `${_activeVariant}: <strong>${discoveredForVariant}/${totalForVariant}</strong> <span class="dim">(${pct}%)</span>`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="state-empty">All ${_activeVariant} variants collected! 🎉</div>`;
    return;
  }

  grid.innerHTML = `<div class="cond-grid">${filtered.map(plant => buildCondCard(plant)).join('')}</div>`;
}

function buildCondCard(plant) {
  const key      = plant.key;
  const name     = plant.crop?.name ?? key;
  const disc     = _discovered.get(key) ?? new Set();
  const hasIt    = disc.has(_activeVariant);
  const tall     = isTallPlant(key);
  // Per-crop mutated sprite via composed endpoint
  const url      = composedSpriteUrl(key, _activeVariant, tall);
  const fallback = plant.crop?.sprite ?? plant.seed?.sprite ?? '';

  return `
    <div class="cond-card${hasIt ? ' has-variant' : ''}" data-plant-key="${key}">
      <div class="cond-card-rarity">${rarityIcon(key)}${acquisitionBadge(key)}</div>
      <div class="cond-card-img-wrap">
        <img class="cond-card-img${hasIt ? '' : ' dim'}" src="${url}" alt="${name} ${_activeVariant}" loading="lazy"
             data-fallback="${fallback}"
             onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}else{this.style.display='none';}">
        ${hasIt ? `<span class="cond-card-check">✓</span>` : ''}
      </div>
      <div class="cond-card-name">${name}</div>
    </div>`;
}

function onCardClickHandler(e) {
  const card = e.target.closest('[data-plant-key]');
  if (!card) return;
  const plant = _plants.find(p => p.key === card.dataset.plantKey);
  if (plant && _onCardClick) _onCardClick(plant);
}
