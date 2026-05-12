// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-grid.js
// v0.6.1 — % on cards, better acquisition display
// ═══════════════════════════════════════════════

import { CROP_VARIANTS, CROP_RARITY, RARITY_META, CROP_ACQUISITION } from '../lib/aries.js';

// ── Coin formatter ────────────────────────────

export function fmtCoins(n) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(n%1_000_000_000===0?0:1)+'B';
  if (n >= 1_000_000)     return (n/1_000_000).toFixed(n%1_000_000===0?0:1)+'M';
  if (n >= 1_000)         return (n/1_000).toFixed(n%1_000===0?0:1)+'K';
  return n.toLocaleString();
}

// ── Rarity badge ──────────────────────────────

export function rarityBadge(key) {
  const r = CROP_RARITY[key] ?? 'Common';
  const m = RARITY_META[r] ?? RARITY_META.Common;
  return `<span class="rarity-badge" style="color:${m.color}" title="${r}">${m.symbol}</span>`;
}

// ── Acquisition source tag ────────────────────
// Uses distinct icons by source type so it's clear it's informational, not a lock.

function acqTag(key) {
  const a = CROP_ACQUISITION[key];
  if (!a) return '';
  let icon = '📋'; // default: special source
  if (a.includes('Event') || a.includes('Day'))          icon = '🗓️';
  else if (a.includes('Discord'))                         icon = '💬';
  else if (a.includes('Dawn Shop'))                       icon = '🌅';
  else if (a.includes('Carnival'))                        icon = '🎪';
  else if (a.includes('iOS') || a.includes('Web App'))    icon = '📱';
  else if (a.includes('random') || a.includes('chance'))  icon = '🍀';
  return `<span class="acq-tag" title="${a}">${icon}</span>`;
}

function harvestBadge(plant) {
  const t = plant.plant?.harvestType;
  if (t === 'Multi')  return `<span class="harvest-badge multi"  title="Multi-harvest">♻</span>`;
  if (t === 'Single') return `<span class="harvest-badge single" title="Single-harvest">1×</span>`;
  return '';
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
  const seed   = plant.seed?.coinPrice;

  const img = sprite
    ? `<img class="plant-sprite" src="${sprite}" alt="${name}" loading="lazy"
           onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'plant-sprite-missing',textContent:'🌿'}))">`
    : `<div class="plant-sprite-missing">🌿</div>`;

  return `
    <div class="plant-card${buy ? ' purchasable' : ''}" data-plant-key="${key}">
      <div class="card-top-badges">
        ${rarityBadge(key)}${acqTag(key)}
      </div>
      ${img}
      <span class="plant-name">${name}</span>
      ${seed != null ? `<span class="card-seed-price">🌰 ${fmtCoins(seed)}</span>` : ''}
      <div class="plant-progress">
        <div class="progress-bar-track">
          <div class="progress-bar-fill${done ? ' complete' : ''}" style="width:${pct}%"></div>
        </div>
        <span class="progress-label">${disc}/${total} &nbsp;<span class="progress-pct${done ? ' done' : ''}">${pct}%</span></span>
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
  const acq      = CROP_ACQUISITION[key];

  const img = sprite
    ? `<img class="row-sprite" src="${sprite}" alt="${name}" loading="lazy" onerror="this.style.display='none'">`
    : `<span class="row-sprite-missing">🌿</span>`;

  return `
    <div class="plant-row" data-plant-key="${key}">
      <div class="row-img">${img}</div>
      <div class="row-main">
        <div class="row-name-line">
          ${rarityBadge(key)}
          <span class="row-name">${name}</span>
          ${harvestBadge(plant)}
          ${acq ? `<span class="acq-tag row-acq" title="${acq}">${acqTag(key)}</span>` : ''}
        </div>
        ${acq ? `<span class="row-acq-text">${acq}</span>` : ''}
        <div class="row-progress-bar">
          <div class="progress-bar-track" style="height:3px">
            <div class="progress-bar-fill${done ? ' complete' : ''}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="row-stats">
        ${seed != null ? `<span class="row-stat" title="Seed price">🌰 ${fmtCoins(seed)}</span>` : ''}
        ${sell != null ? `<span class="row-stat" title="Base sell price">💰 ${fmtCoins(sell)}</span>` : ''}
      </div>
      <div class="row-disc${done ? ' done' : ''}">${disc}/${total}<br><span class="row-pct">${pct}%</span></div>
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
