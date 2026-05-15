// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-modal.js
// v0.7.0 — rich modal, composed variant sprites
// ═══════════════════════════════════════════════

import { CROP_VARIANTS, composedSpriteUrl, isTallPlant, CROP_RARITY } from '../lib/aries.js';
import {
  rarityPill, acquisitionBadge, acquisitionText, seedFinderNote,
  coinPrice, fmtCoinValue, fmtTime,
} from '../lib/icons.js';
import { getSupabase } from '../lib/supabase.js';

let _onToggle = null;

// ── Open / close ──────────────────────────────

export function openModal(plant, _ignored, discovered, user, onToggle) {
  closeModal();
  _onToggle = onToggle;

  const key       = plant.key;
  const name      = plant.crop?.name ?? key;
  const sprite    = plant.crop?.sprite ?? plant.seed?.sprite ?? null;
  const disc      = discovered.get(key) ?? new Set();
  const rarity    = CROP_RARITY[key] ?? 'Common';
  const harvest   = plant.plant?.harvestType ?? null;
  const seedPrice = plant.seed?.coinPrice;
  const sellPrice = plant.crop?.baseSellPrice;
  const growT     = plant.seed?.cropGrowTime;
  const regrowT   = plant.seed?.regrowTime ?? plant.plant?.regrowTime;
  const baseW     = plant.crop?.baseWeight;
  const maxW      = plant.crop?.maxWeight;
  const acqText   = acquisitionText(key);
  const sfNote    = seedFinderNote(key);

  // First info line: rarity · harvest · replant note · acquisition (+price)
  const summaryParts = [
    `<strong>${rarity}</strong>`,
    harvest === 'Single' ? 'Single-harvest — replant seed after each harvest'
      : harvest === 'Multi' ? 'Multi-harvest' : null,
    buildAcqLine(acqText, seedPrice),
  ].filter(Boolean);

  // Seed Finder note as second line
  const sfLine = sfNote ? `<div class="modal-sf-line">Pets with <strong>${sfNote}</strong> can find this seed</div>` : '';

  // Variant tiles using composed sprite URLs
  const tall = isTallPlant(key);
  const tiles = CROP_VARIANTS.map(variant => {
    const isDisc = disc.has(variant);
    const url    = composedSpriteUrl(key, variant, tall);
    const cls    = variant === 'MaxWeight' ? ' maxweight' : '';
    const label  = variant === 'MaxWeight' ? 'Max Weight' : variant;
    return `
      <div class="variant-tile${isDisc ? ' discovered' : ''}${cls}"
           data-variant="${variant}" data-plant-key="${key}">
        <div class="variant-img-wrap">
          <img src="${url}" alt="${label}" loading="lazy"
               onerror="this.style.display='none'">
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
        ${sprite ? `<img class="modal-crop-sprite" src="${sprite}" alt="${name}">` : ''}
        <h3 class="modal-crop-name">${name}</h3>
        ${rarityPill(key)}
        ${acquisitionBadge(key)}
        <button class="modal-close" aria-label="Close">✕</button>
      </div>

      <div class="modal-actions-bar">
        <button class="modal-action-btn" id="modal-check-all">Check all</button>
        <button class="modal-action-btn ghost" id="modal-clear-all">Clear all</button>
        <span class="modal-progress-inline" id="modal-progress-text">
          ${disc.size}/${total} <span class="dim">(${pct}%)</span>
        </span>
      </div>

      <div class="modal-info-block">
        <p class="modal-summary">${summaryParts.join(' &nbsp;·&nbsp; ')}</p>
        ${sfLine}
      </div>

      <div class="modal-stats-grid">
        <div class="stat-cell"><span class="stat-label">SEED</span><span class="stat-value">${coinPrice(seedPrice)}</span></div>
        <div class="stat-cell"><span class="stat-label">SELL</span><span class="stat-value stat-sell">${coinPrice(sellPrice)}</span></div>
        <div class="stat-cell"><span class="stat-label">GROW</span><span class="stat-value">${fmtTime(growT)}</span></div>
        <div class="stat-cell"><span class="stat-label">REGROW</span><span class="stat-value">${regrowT ? fmtTime(regrowT) : '—'}</span></div>
        <div class="stat-cell"><span class="stat-label">WEIGHT</span><span class="stat-value">${baseW != null && maxW != null ? `${baseW} – ${maxW} kg` : '—'}</span></div>
        <div class="stat-cell"><span class="stat-label">TYPE</span><span class="stat-value">${harvest ?? '—'}</span></div>
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

// ── Acquisition line builder ──────────────────

function buildAcqLine(acqText, seedPrice) {
  const priceTag = seedPrice != null ? ` (${fmtCoinValue(seedPrice)} coins)` : '';
  if (acqText) return acqText + priceTag;
  return 'Seed Shop' + priceTag;
}

// ── Bulk check / clear ────────────────────────

async function bulkToggle(plant, discovered, makeChecked) {
  const key = plant.key;
  const disc = discovered.get(key) ?? new Set();
  const targets = makeChecked
    ? CROP_VARIANTS.filter(v => !disc.has(v))
    : CROP_VARIANTS.filter(v =>  disc.has(v));
  if (!targets.length) return;

  // Optimistic
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

  // Optimistic
  tile.classList.toggle('discovered', !wasDisc);
  if (!wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
  else tile.querySelector('.variant-check')?.remove();

  _onToggle?.(plantKey, variantKey, wasDisc);

  // Recount from DOM for live progress
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
        .upsert({ user_id:user.id, item_type:'crop', item_key:plantKey, variant_key:variantKey },
                { onConflict:'user_id,item_type,item_key,variant_key', ignoreDuplicates:true });
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

function onKeydown(e) { if (e.key === 'Escape') closeModal(); }
