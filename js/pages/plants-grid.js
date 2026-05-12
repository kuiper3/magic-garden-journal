// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-grid.js
// v0.6.0 — card + list view rendering
// ═══════════════════════════════════════════════

import { CROP_VARIANTS, CROP_RARITY, RARITY_META, CROP_ACQUISITION } from '../lib/aries.js';

// ── Helpers ───────────────────────────────────

export function rarityBadge(key) {
  const r = CROP_RARITY[key] ?? 'Common';
  const m = RARITY_META[r] ?? RARITY_META.Common;
  return `<span class="rarity-badge" style="color:${m.color}" title="${r}">${m.symbol}</span>`;
}

function harvestIcon(plant) {
  const t = plant.plant?.harvestType;
  if (t === 'Multi') return '<span class="harvest-icon" title="Multi-harvest">♻</span>';
  if (t === 'Single') return '<span class="harvest-icon" title="Single-harvest">🌱</span>';
  return '';
}

function fmtCoins(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(0)+'B';
  if (n >= 1_000_000)     return (n/1_000_000).toFixed(n%1_000_000===0?0:1)+'M';
  if (n >= 1_000)         return (n/1_000).toFixed(n%1_000===0?0:1)+'K';
  return n.toString();
}

function acqHint(key) {
  const a = CROP_ACQUISITION[key];
  return a ? `<span class="acq-hint" title="${a}">🔒</span>` : '';
}

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

  const img = sprite
    ? `<img class="plant-sprite" src="${sprite}" alt="${name}" loading="lazy"
           onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'plant-sprite-missing',textContent:'🌿'}))">`
    : `<div class="plant-sprite-missing">🌿</div>`;

  return `
    <div class="plant-card${buy ? ' purchasable' : ''}" data-plant-key="${key}">
      <div class="card-badges">${rarityBadge(key)}${acqHint(key)}</div>
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

// ── List view ─────────────────────────────────

export function buildRow(plant, discovered) {
  const { key } = plant;
  const name     = plant.crop?.name ?? key;
  const sprite   = plant.crop?.sprite ?? plant.seed?.sprite ?? null;
  const disc     = discovered.get(key)?.size ?? 0;
  const total    = CROP_VARIANTS.length;
  const pct      = Math.round((disc / total) * 100);
  const done     = disc >= total;
  const seedPrice = plant.seed?.coinPrice;
  const sellPrice = plant.crop?.baseSellPrice;
  const acq       = CROP_ACQUISITION[key];

  const img = sprite
    ? `<img class="row-sprite" src="${sprite}" alt="${name}" loading="lazy"
           onerror="this.style.display='none'">`
    : `<span class="row-sprite-missing">🌿</span>`;

  return `
    <div class="plant-row" data-plant-key="${key}">
      <div class="row-img">${img}</div>
      <div class="row-main">
        <div class="row-name-line">
          ${rarityBadge(key)}
          <span class="row-name">${name}</span>
          ${harvestIcon(plant)}
          ${acq ? `<span class="acq-hint" title="${acq}">🔒</span>` : ''}
        </div>
        <div class="row-progress-bar">
          <div class="progress-bar-track" style="height:3px">
            <div class="progress-bar-fill${done ? ' complete' : ''}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="row-stats">
        <span class="row-stat" title="Seed price">🌰 ${seedPrice != null ? fmtCoins(seedPrice) : '—'}</span>
        <span class="row-stat" title="Base sell price">💰 ${sellPrice != null ? fmtCoins(sellPrice) : '—'}</span>
      </div>
      <div class="row-disc${done ? ' done' : ''}">${disc}/${total}</div>
    </div>`;
}

// ── Render helpers ────────────────────────────

export function filterPlants(plants, discovered, { searchQuery = '', missingOnly = false } = {}) {
  const q = searchQuery.trim().toLowerCase();
  return plants.filter(plant => {
    if (missingOnly) {
      const disc = discovered.get(plant.key)?.size ?? 0;
      if (disc >= CROP_VARIANTS.length) return false;
    }
    if (q) {
      const name = (plant.crop?.name ?? plant.key).toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });
}
