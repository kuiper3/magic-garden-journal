// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/owned-pets-card.js
// v0.7.1 — owned-instance card
// ═══════════════════════════════════════════════
// An "owned pet" is one physical pet a user owns (vs. a species discovery).
// Row shape: { id, pet_key, nickname, weight_kg, variant,
//              current_level, max_level, abilities, created_at }
//   abilities      — array of ability keys this pet rolled
//   current_level  — strength now (50–max_level)
//   max_level      — strength when fully leveled (80–100)
// Ability values scale by strength/100 and are shown current → max.
// ═══════════════════════════════════════════════

import { composedPetSpriteUrl } from '../lib/aries.js';
import { petDisplayName } from './pets-grid.js';
import { abilityFacets, facetValue, abilityKeys, clampMaxLevel, clampCurLevel } from './owned-pets-abilities.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';

// Owned individuals only carry a visual mutation: Normal / Gold / Rainbow.
// (MaxWeight is a journal *discovery* category, not a per-pet state — weight is
// tracked numerically here instead.)
export const OWNED_VARIANTS = ['Normal', 'Gold', 'Rainbow'];

// ── Helpers ───────────────────────────────────

function prettify(str) {
  return String(str ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// Sprite for an owned instance: Normal uses the base pet sprite; Gold/Rainbow
// use the composed mutation endpoint. Returns null if the species is unknown.
export function ownedSpriteUrl(species, variant) {
  if (!species) return null;
  if (variant === 'Gold' || variant === 'Rainbow') return composedPetSpriteUrl(species, variant);
  return species.sprite ?? composedPetSpriteUrl(species, 'Normal');
}

function rarityIcon(rarity) {
  const r = rarity ?? 'Common';
  return `<img class="card-rarity-icon" src="${ARIES_BASE}/assets/sprites/ui/Rarity${r}.png" alt="${r}" title="${r}">`;
}

function fmtWeight(kg) {
  if (kg == null || !Number.isFinite(Number(kg))) return null;
  const n = Number(kg);
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 3 })} kg`;
}

// One ability's rows of scaled values (current → max). When current === max,
// a single value is shown.
function abilityBlock(key, lookup, cur, max) {
  const info = abilityFacets(key, lookup);
  const same = cur === max;
  const facetRows = info.facets.map(f => {
    const lo = facetValue(f, cur);
    if (f.kind === 'text') {
      return `<div class="owned-ab-facet"><span class="owned-ab-lbl">${f.label}</span><span class="owned-ab-val">${lo}</span></div>`;
    }
    const hi = facetValue(f, max);
    const val = same ? hi : `<span class="owned-ab-cur">${lo}</span><span class="owned-ab-arrow">→</span><span class="owned-ab-max">${hi}</span>`;
    return `<div class="owned-ab-facet"><span class="owned-ab-lbl">${f.label}</span><span class="owned-ab-val">${val}</span></div>`;
  }).join('');
  const weatherTag = info.weather ? `<span class="owned-ab-weather">${info.weather}</span>` : '';
  return `
    <div class="owned-ab">
      <div class="owned-ab-name">${info.name}${weatherTag}</div>
      <div class="owned-ab-facets">${facetRows || '<span class="owned-ab-val muted">—</span>'}</div>
    </div>`;
}

// ── Card view ─────────────────────────────────

export function buildOwnedCard(row, species, abilityLookup = {}) {
  const speciesName = species ? petDisplayName(species) : prettify(row.pet_key);
  const nick     = (row.nickname && row.nickname.trim()) ? row.nickname.trim() : null;
  const variant  = OWNED_VARIANTS.includes(row.variant) ? row.variant : 'Normal';
  const img      = ownedSpriteUrl(species, variant);
  const rarity   = species?.rarity ?? 'Common';

  const max   = clampMaxLevel(row.max_level ?? 100);
  const cur   = clampCurLevel(row.current_level ?? max, max);
  const keys  = abilityKeys(row.abilities);
  const weight = fmtWeight(row.weight_kg);

  const variantTag = variant !== 'Normal'
    ? `<span class="owned-variant-tag variant-${variant.toLowerCase()}">${variant}</span>`
    : '';

  const heroImg = img
    ? `<img class="owned-hero-img" src="${img}" alt="${speciesName}" loading="lazy" onerror="this.style.opacity='0.2'">`
    : `<span class="owned-hero-missing">🐾</span>`;

  const levelChip = `<span class="owned-str" title="Strength: current → max">⚡ ${cur}<span class="owned-str-sep">/</span>${max}</span>`;

  const subBits = [
    nick ? `<span class="owned-species">${speciesName}</span>` : '',
    variantTag,
    levelChip,
    weight ? `<span class="owned-weight">${weight}</span>` : '',
  ].filter(Boolean).join('');

  const abilityBody = keys.length
    ? keys.map(k => abilityBlock(k, abilityLookup, cur, max)).join('')
    : `<p class="owned-ab-empty">No abilities recorded</p>`;

  return `
    <div class="owned-card variant-${variant.toLowerCase()}" data-owned-id="${row.id}" data-pet-key="${row.pet_key}">
      <div class="owned-card-head">
        <div class="owned-hero${variant !== 'Normal' ? ' ' + variant.toLowerCase() : ''}">${heroImg}</div>
        <div class="owned-card-id">
          <div class="owned-name-line">
            <span class="owned-nick">${nick ?? speciesName}</span>
            ${rarityIcon(rarity)}
          </div>
          <div class="owned-sub-line">${subBits}</div>
        </div>
        <div class="owned-card-actions">
          <button class="owned-icon-btn" data-owned-edit="${row.id}" title="Edit" aria-label="Edit">✎</button>
          <button class="owned-icon-btn danger" data-owned-del="${row.id}" title="Delete" aria-label="Delete">🗑</button>
        </div>
      </div>
      <div class="owned-ab-block">${abilityBody}</div>
    </div>`;
}
