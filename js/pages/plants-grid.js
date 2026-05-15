// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-grid.js
// v0.7.0 — refined card + list view
// ═══════════════════════════════════════════════

import { CROP_VARIANTS } from '../lib/aries.js';
import { rarityPill, acquisitionBadge, acquisitionText, coinPrice } from '../lib/icons.js';

// ── Card view ─────────────────────────────────

export function buildCard(plant, discovered) {
  const { key } = plant;
  const name   = plant.crop?.name ?? key;
  const sprite = plant.crop?.sprite ?? plant.seed?.sprite ?? null;
  const disc   = discovered.get(key)?.size ?? 0;
  const total  = CROP_VARIANTS.length;
  const pct    = Math.round((disc / total) * 100);
  const done   = disc >= total;
  const buy    = plant.seed?.purchasable === true;
  const acqBadge = acquisitionBadge(key);

  const img = sprite
    ? `<img class="plant-sprite" src="${sprite}" alt="${name}" loading="lazy"
           onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'plant-sprite-missing',textContent:'🌿'}))">`
    : `<div class="plant-sprite-missing">🌿</div>`;

  return `
    <div class="plant-card${buy ? ' purchasable' : ''}${done ? ' complete' : ''}" data-plant-key="${key}">
      <div class="card-row-top">
        <div class="card-img-wrap">${img}</div>
        <div class="card-name-wrap">
          <span class="plant-name">${name}</span>
        </div>
        <div class="card-tag-wrap">${acqBadge}${rarityPill(key)}</div>
      </div>
      <div class="card-progress-row">
        <span class="progress-text"><strong>${disc}/${total}</strong> <span class="progress-pct">(${pct}%)</span></span>
        <div class="progress-bar-track">
          <div class="progress-bar-fill${done ? ' complete' : ''}" style="width:${pct}%"></div>
        </div>
      </div>
    </div>`;
}

// ── List view ─────────────────────────────────

export function buildRow(plant, discovered) {
  const { key }  = plant;
  const name     = plant.crop?.name ?? key;
  const sprite   = plant.crop?.sprite ?? plant.seed?.sprite ?? null;
  const disc     = discovered.get(key)?.size ?? 0;
  const total    = CROP_VARIANTS.length;
  const pct      = Math.round((disc / total) * 100);
  const done     = disc >= total;
  const seed     = plant.seed?.coinPrice;
  const sell     = plant.crop?.baseSellPrice;
  const acq      = acquisitionText(key);

  const img = sprite
    ? `<img class="row-sprite" src="${sprite}" alt="${name}" loading="lazy" onerror="this.style.display='none'">`
    : `<span class="row-sprite-missing">🌿</span>`;

  return `
    <div class="plant-row${done ? ' complete' : ''}" data-plant-key="${key}">
      <div class="row-img">${img}</div>
      <div class="row-main">
        <div class="row-name-line">
          <span class="row-name">${name}</span>
          ${rarityPill(key)}
          ${acquisitionBadge(key)}
        </div>
        ${acq ? `<span class="row-acq">${acq}</span>` : ''}
        <div class="row-progress-bar">
          <div class="progress-bar-track" style="height:3px">
            <div class="progress-bar-fill${done ? ' complete' : ''}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="row-stats">
        <span class="row-stat" title="Seed price">${coinPrice(seed)} seed</span>
        <span class="row-stat" title="Base sell price">${coinPrice(sell)} sell</span>
      </div>
      <div class="row-disc${done ? ' done' : ''}">
        <span class="row-disc-frac">${disc}/${total}</span>
        <span class="row-disc-pct">(${pct}%)</span>
      </div>
    </div>`;
}

// ── Filter ────────────────────────────────────

export function filterPlants(plants, discovered, { searchQuery = '', missingOnly = false } = {}) {
  const q = searchQuery.trim().toLowerCase();
  return plants.filter(plant => {
    if (missingOnly && (discovered.get(plant.key)?.size ?? 0) >= CROP_VARIANTS.length) return false;
    if (q) {
      const name = (plant.crop?.name ?? plant.key).toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });
}
