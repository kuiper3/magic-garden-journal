// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/pets-conditions.js
// v0.6.2 — all 4 variants; egg multi-select filter
// Mirrors plants-conditions.js; reuses .cond-* CSS.
// ═══════════════════════════════════════════════

import { composedPetSpriteUrl } from '../lib/aries.js';
import { petDisplayName } from './pets-grid.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';

// All 4 pet variants (Normal & MaxWeight use the base sprite; Gold/Rainbow use composed).
const PET_CONDITION_VARIANTS = ['Normal', 'Gold', 'Rainbow', 'MaxWeight'];

function rarityIcon(pet) {
  const r = pet.rarity ?? 'Common';
  return `<img class="card-rarity-icon" src="${ARIES_BASE}/assets/sprites/ui/Rarity${r}.png" alt="${r}" title="${r}">`;
}

// Prettify "SnowEgg" → "Snow", "CommonEgg" → "Common" etc.
function eggLabel(eggName) {
  return String(eggName ?? 'Unknown').replace(/Egg$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

let _activeVariant  = 'Normal';
let _missingOnly    = false;
let _selectedEggs   = new Set();   // empty = show all egg types
let _pets           = [];
let _discovered     = new Map();
let _onCardClick    = null;

export function renderPetConditions(container, pets, discovered, onCardClick) {
  _pets        = pets;
  _discovered  = discovered;
  _onCardClick = onCardClick;

  // Derive sorted unique egg types from the pets list
  const allEggs = [...new Set(pets.map(p => p.eggName).filter(Boolean).filter(e => e !== 'Unknown'))];

  container.innerHTML = `
    <link rel="stylesheet" href="css/pets.css">
    <div class="cond-toolbar">
      <div class="cond-variant-tabs" id="pet-cond-tabs">${buildTabs()}</div>
      <div class="cond-filter-row" style="flex-wrap:wrap;gap:0.35rem;">
        <button class="filter-pill${_missingOnly ? '' : ' active'}" id="pet-cond-show-all">Show all</button>
        <button class="filter-pill${_missingOnly ? ' active' : ''}" id="pet-cond-missing">Missing only</button>
        <span class="pet-cond-egg-sep">|</span>
        ${allEggs.map(e => `<button class="filter-pill pet-egg-filter${_selectedEggs.has(e) ? ' active' : ''}" data-egg="${e}">${eggLabel(e)}</button>`).join('')}
        <span class="cond-progress-inline" id="pet-cond-progress"></span>
      </div>
    </div>
    <div id="pet-cond-grid"></div>`;

  document.getElementById('pet-cond-tabs')?.addEventListener('click', onTabClick);
  document.getElementById('pet-cond-show-all')?.addEventListener('click', () => setMissingFilter(false));
  document.getElementById('pet-cond-missing')?.addEventListener('click', () => setMissingFilter(true));
  // Egg filter pills (multi-select, event delegation on the whole filter row)
  container.querySelector('.cond-filter-row')?.addEventListener('click', e => {
    const btn = e.target.closest('.pet-egg-filter');
    if (!btn) return;
    const egg = btn.dataset.egg;
    if (_selectedEggs.has(egg)) _selectedEggs.delete(egg);
    else _selectedEggs.add(egg);
    container.querySelectorAll('.pet-egg-filter').forEach(b => {
      b.classList.toggle('active', _selectedEggs.has(b.dataset.egg));
    });
    renderGrid();
  });
  document.getElementById('pet-cond-grid')?.addEventListener('click', onCardClickHandler);

  renderGrid();
}

function buildTabs() {
  return PET_CONDITION_VARIANTS.map(v => {
    const label = v === 'MaxWeight' ? 'Max Weight' : v;
    return `<button class="cond-tab${v === _activeVariant ? ' active' : ''}" data-variant="${v}">${label}</button>`;
  }).join('');
}

function onTabClick(e) {
  const btn = e.target.closest('.cond-tab');
  if (!btn) return;
  _activeVariant = btn.dataset.variant;
  document.querySelectorAll('#pet-cond-tabs .cond-tab')
    .forEach(b => b.classList.toggle('active', b.dataset.variant === _activeVariant));
  renderGrid();
}

function setMissingFilter(missingOnly) {
  _missingOnly = missingOnly;
  document.getElementById('pet-cond-show-all')?.classList.toggle('active', !missingOnly);
  document.getElementById('pet-cond-missing')?.classList.toggle('active', missingOnly);
  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('pet-cond-grid');
  if (!grid) return;

  // Egg filter (empty Set = all)
  const eggFiltered = _selectedEggs.size === 0
    ? _pets
    : _pets.filter(p => _selectedEggs.has(p.eggName));

  const filtered = eggFiltered.filter(pet => {
    const disc = _discovered.get(pet.key) ?? new Set();
    if (_missingOnly && disc.has(_activeVariant)) return false;
    return true;
  });

  const base = _selectedEggs.size === 0 ? _pets : eggFiltered;
  const have = base.filter(p => _discovered.get(p.key)?.has(_activeVariant)).length;
  const pct  = base.length > 0 ? Math.round((have / base.length) * 100) : 0;
  const prog = document.getElementById('pet-cond-progress');
  if (prog) prog.innerHTML = `${_activeVariant}: <strong>${have}/${base.length}</strong> <span class="dim">(${pct}%)</span>`;

  if (!filtered.length) {
    const label = _activeVariant === 'MaxWeight' ? 'Max Weight' : _activeVariant;
    grid.innerHTML = `<div class="state-empty">All ${label} pets collected! 🎉</div>`;
    return;
  }
  grid.innerHTML = `<div class="cond-grid">${filtered.map(buildCard).join('')}</div>`;
}

function buildCard(pet) {
  const name  = petDisplayName(pet);
  const disc  = _discovered.get(pet.key) ?? new Set();
  const hasIt = disc.has(_activeVariant);
  // Normal and MaxWeight use the base sprite; Gold/Rainbow use the composed endpoint.
  const usesBase = _activeVariant === 'Normal' || _activeVariant === 'MaxWeight';
  const url   = usesBase ? (pet.sprite ?? '') : composedPetSpriteUrl(pet, _activeVariant);
  const fallback = pet.sprite ?? '';
  const mwCls = _activeVariant === 'MaxWeight' ? ' cond-card-maxweight' : '';

  return `
    <div class="cond-card${hasIt ? ' has-variant' : ''}${mwCls}" data-pet-key="${pet.key}">
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
