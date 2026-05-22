// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/pets-conditions.js
// v0.6.1 — pet mutation grid (Gold / Rainbow), clickable
// Mirrors plants-conditions.js; reuses its .cond-* CSS.
// ═══════════════════════════════════════════════

import { composedPetSpriteUrl } from '../lib/aries.js';
import { petDisplayName } from './pets-grid.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';

// Pets only mutate into Gold / Rainbow (Normal = base, MaxWeight = a weight goal).
const PET_CONDITION_VARIANTS = ['Gold', 'Rainbow'];

function rarityIcon(pet) {
  const r = pet.rarity ?? 'Common';
  return `<img class="card-rarity-icon" src="${ARIES_BASE}/assets/sprites/ui/Rarity${r}.png" alt="${r}" title="${r}">`;
}

let _activeVariant = 'Gold';
let _missingOnly   = false;
let _pets          = [];
let _discovered    = new Map();
let _onCardClick   = null;

export function renderPetConditions(container, pets, discovered, onCardClick) {
  _pets        = pets;
  _discovered  = discovered;
  _onCardClick = onCardClick;

  container.innerHTML = `
    <div class="cond-toolbar">
      <div class="cond-variant-tabs" id="pet-cond-tabs">${buildTabs()}</div>
      <div class="cond-filter-row">
        <button class="filter-pill${_missingOnly ? '' : ' active'}" id="pet-cond-show-all">Show all</button>
        <button class="filter-pill${_missingOnly ? ' active' : ''}" id="pet-cond-missing">Missing only</button>
        <span class="cond-progress-inline" id="pet-cond-progress"></span>
      </div>
    </div>
    <div id="pet-cond-grid"></div>`;

  document.getElementById('pet-cond-tabs')?.addEventListener('click', onTabClick);
  document.getElementById('pet-cond-show-all')?.addEventListener('click', () => setFilter(false));
  document.getElementById('pet-cond-missing')?.addEventListener('click', () => setFilter(true));
  document.getElementById('pet-cond-grid')?.addEventListener('click', onCardClickHandler);

  renderGrid();
}

function buildTabs() {
  return PET_CONDITION_VARIANTS.map(v =>
    `<button class="cond-tab${v === _activeVariant ? ' active' : ''}" data-variant="${v}">${v}</button>`
  ).join('');
}

function onTabClick(e) {
  const btn = e.target.closest('.cond-tab');
  if (!btn) return;
  _activeVariant = btn.dataset.variant;
  document.querySelectorAll('#pet-cond-tabs .cond-tab')
    .forEach(b => b.classList.toggle('active', b.dataset.variant === _activeVariant));
  renderGrid();
}

function setFilter(missingOnly) {
  _missingOnly = missingOnly;
  document.getElementById('pet-cond-show-all')?.classList.toggle('active', !missingOnly);
  document.getElementById('pet-cond-missing')?.classList.toggle('active', missingOnly);
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('pet-cond-grid');
  if (!grid) return;

  const filtered = _pets.filter(pet => {
    const disc = _discovered.get(pet.key) ?? new Set();
    if (_missingOnly && disc.has(_activeVariant)) return false;
    return true;
  });

  const total = _pets.length;
  const have  = _pets.filter(p => _discovered.get(p.key)?.has(_activeVariant)).length;
  const pct   = total > 0 ? Math.round((have / total) * 100) : 0;
  const prog  = document.getElementById('pet-cond-progress');
  if (prog) prog.innerHTML = `${_activeVariant}: <strong>${have}/${total}</strong> <span class="dim">(${pct}%)</span>`;

  if (!filtered.length) {
    grid.innerHTML = `<div class="state-empty">All ${_activeVariant} pets collected! 🎉</div>`;
    return;
  }
  grid.innerHTML = `<div class="cond-grid">${filtered.map(buildCard).join('')}</div>`;
}

function buildCard(pet) {
  const name     = petDisplayName(pet);
  const disc     = _discovered.get(pet.key) ?? new Set();
  const hasIt    = disc.has(_activeVariant);
  const url      = composedPetSpriteUrl(pet, _activeVariant);
  const fallback = pet.sprite ?? '';

  return `
    <div class="cond-card${hasIt ? ' has-variant' : ''}" data-pet-key="${pet.key}">
      <div class="cond-card-rarity">${rarityIcon(pet)}</div>
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
  const card = e.target.closest('[data-pet-key]');
  if (!card) return;
  const pet = _pets.find(p => p.key === card.dataset.petKey);
  if (pet && _onCardClick) _onCardClick(pet);
}
