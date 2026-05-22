// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/pets-grid.js
// v0.6.1 — pet hero card (just the pet); list + filter
// ═══════════════════════════════════════════════

import { PET_VARIANTS } from '../lib/aries.js';
import { fmtCoinValue } from '../lib/icons.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';

// ── Display helpers ───────────────────────────

// Pets are keyed in PascalCase (e.g. 'SnowFox', 'WhiteCaribou'). Prefer an
// explicit API name when present, otherwise insert spaces before capitals.
export function petDisplayName(pet) {
  if (pet?.name) return pet.name;
  return String(pet?.key ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// hoursToMature → "Xh" or "Xd Yh"
export function fmtHours(h) {
  if (h == null) return '—';
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  const r = h % 24;
  return r > 0 ? `${d}d ${r}h` : `${d}d`;
}

function rarityIcon(rarity) {
  const r = rarity ?? 'Common';
  return `<img class="card-rarity-icon" src="${ARIES_BASE}/assets/sprites/ui/Rarity${r}.png" alt="${r}" title="${r}">`;
}

function coinIconImg() {
  return `<img class="stat-icon-img" src="${ARIES_BASE}/assets/sprites/ui/Coin.png" alt="coin">`;
}

const CLOCK_SVG = `<svg class="stat-icon-img" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.4"/>
  <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ── Card view ─────────────────────────────────

export function buildPetCard(pet, discovered, eggLookup) {
  const { key } = pet;
  const name    = petDisplayName(pet);
  const egg     = eggLookup?.[pet.eggName] ?? null;
  const petImg  = pet.sprite ?? null;
  const eggPrice = egg?.coinPrice ?? (pet.eggPrice !== 9999 ? pet.eggPrice : null);
  const disc    = discovered.get(key)?.size ?? 0;
  const total   = PET_VARIANTS.length;
  const pct     = Math.round((disc / total) * 100);
  const done    = disc >= total;

  const eggRow = `<div class="card-row"><span class="card-row-lbl">${coinIconImg()}Egg</span>`
    + `<span class="card-val${eggPrice == null ? ' muted' : ''}">${eggPrice != null ? fmtCoinValue(eggPrice) : '—'}</span></div>`;

  const matureRow = `<div class="card-row"><span class="card-row-lbl">${CLOCK_SVG}Mature</span>`
    + `<span class="card-val">${fmtHours(pet.hoursToMature)}</span></div>`;

  return `
    <div class="pet-card${done ? ' complete' : ''}" data-pet-key="${key}">
      <div class="card-rarity-wrap">${rarityIcon(pet.rarity)}</div>
      <div class="card-name">${name}</div>
      <div class="pet-hero">
        ${petImg
          ? `<img class="pet-hero-img" src="${petImg}" alt="${name}" loading="lazy" onerror="this.style.opacity='0.2'">`
          : `<span class="pet-hero-missing">🐾</span>`}
      </div>
      <div class="card-stats">
        ${eggRow}
        ${matureRow}
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

// ── List view ─────────────────────────────────

export function buildPetRow(pet, discovered, eggLookup) {
  const { key } = pet;
  const name    = petDisplayName(pet);
  const sprite  = pet.sprite ?? eggLookup?.[pet.eggName]?.sprite ?? null;
  const disc    = discovered.get(key)?.size ?? 0;
  const total   = PET_VARIANTS.length;
  const pct     = Math.round((disc / total) * 100);
  const done    = disc >= total;
  const egg     = eggLookup?.[pet.eggName] ?? null;
  const eggPrice = egg?.coinPrice ?? (pet.eggPrice !== 9999 ? pet.eggPrice : null);
  const eggName = pet.eggName && pet.eggName !== 'Unknown'
    ? pet.eggName.replace(/Egg$/, ' Egg').trim()
    : '';

  const img = sprite
    ? `<img class="row-sprite" src="${sprite}" alt="${name}" loading="lazy" onerror="this.style.display='none'">`
    : `<span class="row-sprite-missing">🐾</span>`;

  return `
    <div class="pet-row${done ? ' complete' : ''}" data-pet-key="${key}">
      <div class="row-img">${img}</div>
      <div class="row-main">
        <div class="row-name-line">
          <span class="row-name">${name}</span>
          ${rarityIcon(pet.rarity)}
        </div>
        ${eggName ? `<span class="row-acq">${eggName} · ${fmtHours(pet.hoursToMature)} to mature</span>` : ''}
        <div class="row-progress-bar">
          <div class="progress-bar-track" style="height:3px">
            <div class="progress-bar-fill${done ? ' complete' : ''}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="row-stats">
        <span class="row-stat" title="Cheapest egg price">${coinIconImg()}${eggPrice != null ? fmtCoinValue(eggPrice) : '—'}</span>
      </div>
      <div class="row-disc${done ? ' done' : ''}">
        <span class="row-disc-frac">${disc}/${total}</span>
        <span class="row-disc-pct">${pct}%</span>
      </div>
    </div>`;
}

// ── Filter ────────────────────────────────────

export function filterPets(pets, discovered, { searchQuery = '', missingOnly = false } = {}) {
  const q = searchQuery.trim().toLowerCase();
  return pets.filter(pet => {
    if (missingOnly && (discovered.get(pet.key)?.size ?? 0) >= PET_VARIANTS.length) return false;
    if (q) {
      const name = petDisplayName(pet).toLowerCase();
      if (!name.includes(q) && !pet.key.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}
