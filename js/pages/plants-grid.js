// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-grid.js
// v0.7.0 — Seed → Plant → Crop card layout
// ═══════════════════════════════════════════════

import { CROP_VARIANTS, CROP_RARITY } from '../lib/aries.js';
import { acquisitionBadge, acquisitionText } from '../lib/icons.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';

// Aries uses "Mythic" not "Mythical" in rarity icon filenames
function rarityIconName(rarity) {
  return rarity === 'Mythical' ? 'Mythic' : rarity;
}

function rarityIcon(cropKey) {
  const r = CROP_RARITY[cropKey] ?? 'Common';
  const file = rarityIconName(r);
  return `<img class="card-rarity-icon" src="${ARIES_BASE}/assets/sprites/ui/Rarity${file}.png" alt="${r}" title="${r}">`;
}

// Coin and sell icons sourced from the Aries explorer
function coinIconImg() {
  return `<img class="stat-icon-img" src="${ARIES_BASE}/assets/sprites/ui/Coin.png" alt="coin">`;
}

const SELL_SVG = `<svg class="stat-icon-img" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M6 4v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M9 10h4a1 1 0 011 1v1a1 1 0 01-1 1H9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/>
  <circle cx="13" cy="11.5" r="0.5" fill="currentColor"/>
</svg>`;

function fmtCoinValue(n) {
  if (n == null) return null;
  return n.toLocaleString();
}

// ── Card view (Aries-style) ──────────────────

export function buildCard(plant, discovered) {
  const { key }   = plant;
  const name      = plant.crop?.name ?? key;
  const seedImg   = plant.seed?.sprite;
  const plantImg  = plant.plant?.sprite;
  const cropImg   = plant.crop?.sprite;
  const seedPrice = plant.seed?.coinPrice;
  const sellPrice = plant.crop?.baseSellPrice;
  const buy       = plant.seed?.purchasable === true;
  const disc      = discovered.get(key)?.size ?? 0;
  const total     = CROP_VARIANTS.length;
  const pct       = Math.round((disc / total) * 100);
  const done      = disc >= total;

  const stage = (src, label) => src
    ? `<div class="stage">
         <img class="stage-img" src="${src}" alt="${label}" loading="lazy" onerror="this.style.opacity='0.2'">
         <span class="stage-lbl">${label}</span>
       </div>`
    : `<div class="stage"><span class="stage-img stage-missing">·</span><span class="stage-lbl">${label}</span></div>`;

  const seedRow = seedPrice != null
    ? `<div class="card-row"><span class="card-row-lbl">${coinIconImg()}Seed</span><span class="card-val">${fmtCoinValue(seedPrice)}</span></div>`
    : `<div class="card-row"><span class="card-row-lbl">${coinIconImg()}Seed</span><span class="card-val muted">—</span></div>`;

  const sellRow = sellPrice != null
    ? `<div class="card-row"><span class="card-row-lbl">${SELL_SVG}Sell</span><span class="card-val sell-val">${fmtCoinValue(sellPrice)}</span></div>`
    : `<div class="card-row"><span class="card-row-lbl">${SELL_SVG}Sell</span><span class="card-val muted">—</span></div>`;

  return `
    <div class="plant-card${buy ? ' purchasable' : ''}${done ? ' complete' : ''}" data-plant-key="${key}">
      <div class="card-rarity-wrap">${rarityIcon(key)}${acquisitionBadge(key)}</div>
      <div class="card-name">${name}</div>
      <div class="stages">
        ${stage(seedImg, 'Seed')}
        <span class="stage-arr">→</span>
        ${stage(plantImg, 'Plant')}
        <span class="stage-arr">→</span>
        ${stage(cropImg, 'Crop')}
      </div>
      <div class="card-stats">
        ${seedRow}
        ${sellRow}
        <div class="card-row card-progress-row">
          <span class="card-row-lbl">📓 Journal</span>
          <span class="card-val${done ? ' done' : ''}">${disc}/${total} <span class="pct">(${pct}%)</span></span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill${done ? ' complete' : ''}" style="width:${pct}%"></div>
        </div>
      </div>
    </div>`;
}

// ── List view (compact row) ───────────────────

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
          ${rarityIcon(key)}
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
        <span class="row-stat" title="Seed price">${coinIconImg()}${seed != null ? fmtCoinValue(seed) : '—'}</span>
        <span class="row-stat sell" title="Base sell price">${SELL_SVG}${sell != null ? fmtCoinValue(sell) : '—'}</span>
      </div>
      <div class="row-disc${done ? ' done' : ''}">
        <span class="row-disc-frac">${disc}/${total}</span>
        <span class="row-disc-pct">${pct}%</span>
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
