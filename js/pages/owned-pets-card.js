// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/owned-pets-card.js
// v0.7.0 — owned-instance card + ability proc-share helper
// ═══════════════════════════════════════════════
// An "owned pet" is one physical pet a user owns (vs. a species discovery).
// Each row: { id, pet_key, nickname, weight_kg, variant, abilities, created_at }
// `abilities` is { abilityKey: weight } as rolled on that individual pet.
// ═══════════════════════════════════════════════

import { composedPetSpriteUrl } from '../lib/aries.js';
import { petDisplayName } from './pets-grid.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';

// Owned individuals only carry a visual mutation: Normal / Gold / Rainbow.
// (MaxWeight is a journal *discovery* category, not a per-pet state — weight is
// tracked numerically here instead.)
export const OWNED_VARIANTS = ['Normal', 'Gold', 'Rainbow'];

// ── Helpers ───────────────────────────────────

// Prettify a PascalCase ability key as a fallback display name.
function prettify(str) {
  return String(str ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// Compute per-ability proc share from a rolled-weights map.
// pct(ability) = weight / Σ(weights) × 100. Returned sorted by weight desc.
export function procShares(abilities) {
  const entries = Object.entries(abilities ?? {})
    .map(([key, w]) => [key, Number(w)])
    .filter(([, w]) => Number.isFinite(w) && w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  return entries
    .map(([key, w]) => ({ key, weight: w, pct: total > 0 ? (w / total) * 100 : 0 }))
    .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key));
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
  if (kg == null || !Number.isFinite(Number(kg))) return '—';
  const n = Number(kg);
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 3 })} kg`;
}

// ── Card view ─────────────────────────────────

export function buildOwnedCard(row, species, abilityLookup = {}) {
  const speciesName = species ? petDisplayName(species) : prettify(row.pet_key);
  const nick     = (row.nickname && row.nickname.trim()) ? row.nickname.trim() : null;
  const variant  = OWNED_VARIANTS.includes(row.variant) ? row.variant : 'Normal';
  const img      = ownedSpriteUrl(species, variant);
  const rarity   = species?.rarity ?? 'Common';
  const shares   = procShares(row.abilities);

  const variantTag = variant !== 'Normal'
    ? `<span class="owned-variant-tag variant-${variant.toLowerCase()}">${variant}</span>`
    : '';

  const heroImg = img
    ? `<img class="owned-hero-img" src="${img}" alt="${speciesName}" loading="lazy" onerror="this.style.opacity='0.2'">`
    : `<span class="owned-hero-missing">🐾</span>`;

  const procRows = shares.length
    ? shares.map(s => {
        const ab   = abilityLookup[s.key] ?? {};
        const name = ab.name ?? prettify(s.key);
        const pct  = Math.round(s.pct);
        return `
          <div class="owned-proc-row">
            <span class="owned-proc-name">${name}</span>
            <div class="owned-proc-bar"><div class="owned-proc-fill" style="width:${pct}%"></div></div>
            <span class="owned-proc-pct">${pct}%</span>
          </div>`;
      }).join('')
    : `<p class="owned-proc-empty">No abilities recorded</p>`;

  return `
    <div class="owned-card variant-${variant.toLowerCase()}" data-owned-id="${row.id}" data-pet-key="${row.pet_key}">
      <div class="owned-card-head">
        <div class="owned-hero${variant !== 'Normal' ? ' ' + variant.toLowerCase() : ''}">${heroImg}</div>
        <div class="owned-card-id">
          <div class="owned-name-line">
            <span class="owned-nick">${nick ?? speciesName}</span>
            ${rarityIcon(rarity)}
          </div>
          <div class="owned-sub-line">
            ${nick ? `<span class="owned-species">${speciesName}</span>` : ''}
            ${variantTag}
            <span class="owned-weight">${fmtWeight(row.weight_kg)}</span>
          </div>
        </div>
        <div class="owned-card-actions">
          <button class="owned-icon-btn" data-owned-edit="${row.id}" title="Edit" aria-label="Edit">✎</button>
          <button class="owned-icon-btn danger" data-owned-del="${row.id}" title="Delete" aria-label="Delete">🗑</button>
        </div>
      </div>
      <div class="owned-proc-block">
        <div class="owned-proc-title">Ability proc share</div>
        ${procRows}
      </div>
    </div>`;
}
