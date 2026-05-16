// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-modal.js
// v0.7.0 — Aries-style modal with stages + stats
// ═══════════════════════════════════════════════

import { CROP_VARIANTS, MUTATION_API_NAME, CROP_RARITY, composedSpriteUrl, isTallPlant, CROP_STATIC_DATA } from '../lib/aries.js';
import {
  acquisitionBadge, acquisitionText, seedFinderNote, fmtTime,
} from '../lib/icons.js';
import { getSupabase } from '../lib/supabase.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';

function rarityIconName(rarity) {
  // API already uses 'Mythic'.
  return rarity;
}
function rarityIconImg(cropKey) {
  const r = CROP_RARITY[cropKey] ?? 'Common';
  return `<img class="modal-rarity-icon" src="${ARIES_BASE}/assets/sprites/ui/Rarity${rarityIconName(r)}.png" alt="${r}" title="${r}">`;
}
function coinIconImg() {
  return `<img class="stat-icon-img" src="${ARIES_BASE}/assets/sprites/ui/Coin.png" alt="coin">`;
}
const SELL_SVG = `<svg class="stat-icon-img" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
  <path d="M2 8l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <path d="M6 4v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M9 10h4a1 1 0 011 1v1a1 1 0 01-1 1H9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/>
  <circle cx="13" cy="11.5" r="0.5" fill="currentColor"/>
</svg>`;
const fmtCoin = n => n == null ? '—' : n.toLocaleString();

let _onToggle = null;

export function openModal(plant, mutations, discovered, user, onToggle) {
  closeModal();
  _onToggle = onToggle;

  const key       = plant.key;
  const name      = plant.crop?.name ?? key;
  const rarity    = CROP_RARITY[key] ?? 'Common';
  const seedImg   = plant.seed?.sprite;
  const plantImg  = plant.plant?.sprite;
  const cropImg   = plant.crop?.sprite;
  const disc      = discovered.get(key) ?? new Set();
  const harvest   = plant.plant?.harvestType ?? null;
  const seedPrice = plant.seed?.coinPrice;
  const sellPrice = plant.crop?.baseSellPrice;
  const staticData = CROP_STATIC_DATA[key] ?? {};
  const growT     = staticData.grow ?? plant.seed?.cropGrowTime;
  const regrowT   = staticData.regrow ?? plant.seed?.regrowTime;
  const baseW     = staticData.baseWeight ?? plant.crop?.baseWeight;
  const maxW      = staticData.maxWeight ?? plant.crop?.maxWeight;
  const acqText   = acquisitionText(key);
  const sfNote    = seedFinderNote(key);

  // Acquisition line
  const sourceLabel = acqText || 'Seed Shop';
  const sourceLine = seedPrice != null
    ? `${sourceLabel} <span class="source-price">(${fmtCoin(seedPrice)} coins)</span>`
    : sourceLabel;

  const harvestLabel = harvest === 'Single'
    ? 'Single-harvest — replant after each harvest'
    : harvest === 'Multi' ? 'Multi-harvest' : '';

  const sfLine = sfNote
    ? `<div class="modal-sf-line">Pets with <strong>${sfNote}</strong> can find this seed</div>`
    : '';

  // Stages
  const stage = (src, label) => src
    ? `<div class="stage">
         <img class="stage-img" src="${src}" alt="${label}" loading="lazy">
         <span class="stage-lbl">${label}</span>
       </div>`
    : `<div class="stage"><span class="stage-img stage-missing">·</span><span class="stage-lbl">${label}</span></div>`;

  // Variant tiles using composed endpoint (per-crop mutated sprites)
  const tall  = isTallPlant(key);
  const tiles = CROP_VARIANTS.map(variant => {
    const isDisc = disc.has(variant);
    const url    = composedSpriteUrl(key, variant, tall);
    const cls    = variant === 'MaxWeight' ? ' maxweight' : '';
    const label  = variant === 'MaxWeight' ? 'Max Weight' : variant;
    const fallback = getMutationIconFallback(variant, cropImg ?? seedImg);
    return `
      <div class="variant-tile${isDisc ? ' discovered' : ''}${cls}"
           data-variant="${variant}" data-plant-key="${key}">
        <div class="variant-img-wrap">
          <img src="${url}" alt="${label}" loading="lazy"
               data-fallback="${fallback}"
               onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}else{this.style.display='none';}">
          ${isDisc ? `<span class="variant-check">✓</span>` : ''}
        </div>
        <span class="variant-name">${label}</span>
      </div>`;
  }).join('');

  const total = CROP_VARIANTS.length;
  const pct   = Math.round((disc.size / total) * 100);

  const overlay = document.createElement('div');
  overlay.id = 'plant-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">

      <div class="modal-header">
        <div class="modal-rarity-wrap">${rarityIconImg(key)}${acquisitionBadge(key)}</div>
        <h3 class="modal-crop-name">${name}</h3>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>

      <div class="modal-stages">
        ${stage(seedImg, 'Seed')}
        <span class="stage-arr">→</span>
        ${stage(plantImg, 'Plant')}
        <span class="stage-arr">→</span>
        ${stage(cropImg, 'Crop')}
      </div>

      <div class="modal-info-block">
        <div class="modal-rarity-tag rarity-${rarity.toLowerCase()}">${rarity}</div>
        ${harvestLabel ? `<div class="modal-info-line">${harvestLabel}</div>` : ''}
        <div class="modal-info-line modal-source-line">${sourceLine}</div>
        ${sfLine}
      </div>

      <div class="modal-stats-grid">
        <div class="stat-cell">
          <span class="stat-label">SEED</span>
          <span class="stat-value">${coinIconImg()}${fmtCoin(seedPrice)}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">SELL</span>
          <span class="stat-value sell">${SELL_SVG}${fmtCoin(sellPrice)}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">GROW</span>
          <span class="stat-value">${fmtTime(growT)}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">REGROW</span>
          <span class="stat-value">${regrowT ? fmtTime(regrowT) : '—'}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">WEIGHT</span>
          <span class="stat-value">${baseW != null && maxW != null ? `${baseW} – ${maxW} kg` : '—'}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">TYPE</span>
          <span class="stat-value">${harvest ?? '—'}</span>
        </div>
      </div>

      <div class="modal-actions-bar">
        <button class="modal-action-btn" id="modal-check-all">Check all</button>
        <button class="modal-action-btn ghost" id="modal-clear-all">Clear all</button>
        <span class="modal-progress-inline" id="modal-progress-text">
          ${disc.size}/${total} <span class="dim">(${pct}%)</span>
        </span>
      </div>

      <div class="modal-variants-section">
        <div class="modal-section-title">Variants</div>
        <div class="modal-variants-grid">${tiles}</div>
      </div>
    </div>`;

  overlay.addEventListener('click', onOverlayClick);
  overlay.querySelector('#modal-check-all')?.addEventListener('click', () => bulkToggle(plant, discovered, true));
  overlay.querySelector('#modal-clear-all')?.addEventListener('click', () => bulkToggle(plant, discovered, false));
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.addEventListener('keydown', onKeydown);
}

export function closeModal() {
  document.getElementById('plant-modal')?.remove();
  document.removeEventListener('keydown', onKeydown);
  _onToggle = null;
}

// ── Bulk check / clear ────────────────────────

async function bulkToggle(plant, discovered, makeChecked) {
  const key  = plant.key;
  const disc = discovered.get(key) ?? new Set();
  const targets = makeChecked
    ? CROP_VARIANTS.filter(v => !disc.has(v))
    : CROP_VARIANTS.filter(v =>  disc.has(v));
  if (!targets.length) return;

  for (const v of targets) {
    if (makeChecked) disc.add(v); else disc.delete(v);
    const tile = document.querySelector(`[data-variant="${v}"][data-plant-key="${key}"]`);
    if (!tile) continue;
    tile.classList.toggle('discovered', makeChecked);
    if (makeChecked) {
      if (!tile.querySelector('.variant-check'))
        tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
    } else {
      tile.querySelector('.variant-check')?.remove();
    }
  }
  if (!discovered.has(key)) discovered.set(key, disc);
  updateModalProgress(disc);
  _onToggle?.(key);

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (makeChecked) {
      const rows = targets.map(v => ({ user_id: user.id, item_type:'crop', item_key:key, variant_key:v }));
      const { error } = await supabase.from('journal_entries')
        .upsert(rows, { onConflict: 'user_id,item_type,item_key,variant_key', ignoreDuplicates: true });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('journal_entries').delete()
        .eq('user_id', user.id).eq('item_type','crop').eq('item_key',key)
        .in('variant_key', targets);
      if (error) throw error;
    }
  } catch (err) {
    console.error('[modal] bulk toggle failed:', err);
  }
}

// ── Single tile toggle ────────────────────────

async function onOverlayClick(e) {
  if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
    closeModal(); return;
  }
  const tile = e.target.closest('.variant-tile');
  if (!tile) return;

  const plantKey   = tile.dataset.plantKey;
  const variantKey = tile.dataset.variant;
  const wasDisc    = tile.classList.contains('discovered');

  tile.classList.toggle('discovered', !wasDisc);
  if (!wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
  else tile.querySelector('.variant-check')?.remove();

  _onToggle?.(plantKey, variantKey, wasDisc);

  const count = document.querySelectorAll(`.variant-tile.discovered[data-plant-key="${plantKey}"]`).length;
  const pct   = Math.round((count / CROP_VARIANTS.length) * 100);
  const el    = document.getElementById('modal-progress-text');
  if (el) el.innerHTML = `${count}/${CROP_VARIANTS.length} <span class="dim">(${pct}%)</span>`;

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (wasDisc) {
      const { error } = await supabase.from('journal_entries').delete()
        .eq('user_id', user.id).eq('item_type', 'crop')
        .eq('item_key', plantKey).eq('variant_key', variantKey);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('journal_entries')
        .upsert({ user_id: user.id, item_type: 'crop', item_key: plantKey, variant_key: variantKey },
                { onConflict: 'user_id,item_type,item_key,variant_key', ignoreDuplicates: true });
      if (error) throw error;
    }
  } catch (err) {
    console.error('[modal] tile toggle failed, reverting:', err);
    tile.classList.toggle('discovered', wasDisc);
    if (wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
    else tile.querySelector('.variant-check')?.remove();
    _onToggle?.(plantKey, variantKey, !wasDisc);
  }
}

function updateModalProgress(disc) {
  const el  = document.getElementById('modal-progress-text');
  if (!el) return;
  const pct = Math.round((disc.size / CROP_VARIANTS.length) * 100);
  el.innerHTML = `${disc.size}/${CROP_VARIANTS.length} <span class="dim">(${pct}%)</span>`;
}

// ── Mutation icon fallback ────────────────────
//
// If the /assets/sprites/composed endpoint fails for a specific crop+mutation
// combination, fall back to the plain mutation icon (e.g. wet droplet, gold sparkle).
// As a last resort, fall back to the base crop sprite.
//
// Sprite filenames confirmed from AriesMod source (spriteComposer.js).
// Our display name → sprite file name:
//   Amberlit   → Amberlit.png      (API internal: Ambershine)
//   Dawnbound  → Dawncharged.png
//   Amberbound → Ambercharged.png

const ARIES_BASE_URL = 'https://mg-api.ariedam.fr';

const MUTATION_SPRITE_FILE = {
  Wet:           'Wet',
  Chilled:       'Chilled',
  Frozen:        'Frozen',
  Thunderstruck: 'Thunderstruck',
  Dawnlit:       'Dawnlit',
  Amberlit:      'Amberlit',
  Gold:          'Gold',
  Rainbow:       'Rainbow',
  Dawnbound:     'Dawncharged',
  Amberbound:    'Ambercharged',
};

function getMutationIconFallback(variant, cropSprite) {
  if (variant === 'Normal' || variant === 'MaxWeight') return cropSprite ?? '';
  const file = MUTATION_SPRITE_FILE[variant];
  return file ? `${ARIES_BASE_URL}/assets/sprites/mutations/${file}.png` : (cropSprite ?? '');
}

function onKeydown(e) { if (e.key === 'Escape') closeModal(); }
