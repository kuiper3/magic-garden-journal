// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-modal.js
// v0.6.1 — upsert fix + mutation sprite normalizer
// ═══════════════════════════════════════════════

import { CROP_VARIANTS } from '../lib/aries.js';
import { rarityBadge } from './plants-grid.js';
import { getSupabase } from '../lib/supabase.js';

let _onToggle = null;

export function openModal(plant, mutations, discovered, user, onToggle) {
  closeModal();
  _onToggle = onToggle;

  const key    = plant.key;
  const name   = plant.crop?.name ?? key;
  const sprite = plant.crop?.sprite ?? plant.seed?.sprite ?? null;
  const disc   = discovered.get(key) ?? new Set();

  const seedPrice  = plant.seed?.coinPrice;
  const sellPrice  = plant.crop?.baseSellPrice;
  const harvest    = plant.plant?.harvestType;
  const baseWeight = plant.crop?.baseWeight;
  const maxWeight  = plant.crop?.maxWeight;
  const growTime   = plant.seed?.cropGrowTime;

  const detailPills = [
    seedPrice  != null ? `<span class="detail-pill" title="Seed price">🌰 ${fmtCoins(seedPrice)}</span>` : '',
    sellPrice  != null ? `<span class="detail-pill" title="Base sell price">💰 ${fmtCoins(sellPrice)}</span>` : '',
    harvest           ? `<span class="detail-pill">${harvest === 'Multi' ? '♻️ Multi' : '🌱 Single'}</span>` : '',
    (baseWeight != null && maxWeight != null)
      ? `<span class="detail-pill" title="Weight range">⚖️ ${baseWeight}–${maxWeight} kg</span>` : '',
    growTime   != null ? `<span class="detail-pill" title="Grow time">⏱️ ${fmtTime(growTime)}</span>` : '',
  ].filter(Boolean).join('');

  const total = CROP_VARIANTS.length;
  const pct   = Math.round((disc.size / total) * 100);

  const tiles = CROP_VARIANTS.map(variant => {
    const isDisc    = disc.has(variant);
    const varSprite = getVariantSprite(variant, sprite, mutations);
    return `
      <div class="variant-tile${isDisc ? ' discovered' : ''}"
           data-variant="${variant}" data-plant-key="${key}">
        <div class="variant-img-wrap">
          ${varSprite
            ? `<img src="${varSprite}" alt="${variant}" loading="lazy" onerror="this.style.display='none'">`
            : `<span class="variant-emoji">${variantEmoji(variant)}</span>`}
          ${isDisc ? `<span class="variant-check">✓</span>` : ''}
        </div>
        <span class="variant-name">${variant}</span>
      </div>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'plant-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">
      <div class="modal-header">
        ${sprite ? `<img class="modal-crop-sprite" src="${sprite}" alt="${name}">` : ''}
        <div class="modal-crop-info">
          <div class="modal-name-row">${rarityBadge(key)}<h3 class="modal-crop-name">${name}</h3></div>
          ${detailPills ? `<div class="modal-detail-pills">${detailPills}</div>` : ''}
          <p class="modal-crop-progress" id="modal-progress-text">
            ${disc.size} / ${total} variants &nbsp;·&nbsp; ${pct}%
          </p>
        </div>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>
      <div class="modal-actions-bar">
        <button class="modal-action-btn" id="modal-check-all">Check all</button>
      </div>
      <div class="modal-variants-grid">${tiles}</div>
    </div>`;

  overlay.addEventListener('click', onOverlayClick);
  // querySelector scoped to overlay
  overlay.querySelector('#modal-check-all')?.addEventListener('click', () => checkAll(plant, discovered, user));
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.addEventListener('keydown', onKeydown);
}

export function closeModal() {
  document.getElementById('plant-modal')?.remove();
  document.removeEventListener('keydown', onKeydown);
  _onToggle = null;
}

// ── Check all ─────────────────────────────────

async function checkAll(plant, discovered, user) {
  const key     = plant.key;
  const disc    = discovered.get(key) ?? new Set();
  const missing = CROP_VARIANTS.filter(v => !disc.has(v));
  if (!missing.length) return;

  for (const v of missing) {
    disc.add(v);
    const tile = document.querySelector(`[data-variant="${v}"][data-plant-key="${key}"]`);
    if (tile) {
      tile.classList.add('discovered');
      if (!tile.querySelector('.variant-check'))
        tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
    }
  }
  if (!discovered.has(key)) discovered.set(key, disc);
  updateModalProgress(key, disc);
  _onToggle?.(key);

  try {
    const supabase = await getSupabase();
    const rows = missing.map(v => ({
      user_id: user.id, item_type: 'crop', item_key: key, variant_key: v,
    }));
    // upsert avoids duplicate key errors if some rows already exist
    const { error } = await supabase.from('journal_entries')
      .upsert(rows, { onConflict: 'user_id,item_type,item_key,variant_key', ignoreDuplicates: true });
    if (error) throw error;
  } catch (err) {
    console.error('[modal] check all failed:', err);
  }
}

// ── Tile toggle ───────────────────────────────

async function onOverlayClick(e) {
  if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
    closeModal(); return;
  }
  const tile = e.target.closest('.variant-tile');
  if (!tile) return;

  const plantKey   = tile.dataset.plantKey;
  const variantKey = tile.dataset.variant;
  const wasDisc    = tile.classList.contains('discovered');

  // Optimistic UI update
  tile.classList.toggle('discovered', !wasDisc);
  if (!wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
  else tile.querySelector('.variant-check')?.remove();

  _onToggle?.(plantKey, variantKey, wasDisc);

  // Recount from DOM for accurate progress display
  const discCount = document.querySelectorAll(`.variant-tile.discovered[data-plant-key="${plantKey}"]`).length;
  const pct = Math.round((discCount / CROP_VARIANTS.length) * 100);
  const progEl = document.getElementById('modal-progress-text');
  if (progEl) progEl.textContent = `${discCount} / ${CROP_VARIANTS.length} variants · ${pct}%`;

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (wasDisc) {
      const { error } = await supabase.from('journal_entries').delete()
        .eq('user_id', user.id).eq('item_type', 'crop')
        .eq('item_key', plantKey).eq('variant_key', variantKey);
      if (error) throw error;
    } else {
      // upsert instead of insert — prevents unique constraint revert bug
      const { error } = await supabase.from('journal_entries')
        .upsert(
          { user_id: user.id, item_type: 'crop', item_key: plantKey, variant_key: variantKey },
          { onConflict: 'user_id,item_type,item_key,variant_key', ignoreDuplicates: true }
        );
      if (error) throw error;
    }
  } catch (err) {
    console.error('[modal] toggle failed, reverting:', err);
    // Revert optimistic update
    tile.classList.toggle('discovered', wasDisc);
    if (wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
    else tile.querySelector('.variant-check')?.remove();
    _onToggle?.(plantKey, variantKey, !wasDisc);
  }
}

function updateModalProgress(key, disc) {
  const el  = document.getElementById('modal-progress-text');
  const pct = Math.round((disc.size / CROP_VARIANTS.length) * 100);
  if (el) el.textContent = `${disc.size} / ${CROP_VARIANTS.length} variants · ${pct}%`;
}

function onKeydown(e) { if (e.key === 'Escape') closeModal(); }

// ── Variant sprite lookup ─────────────────────
// The AriesMod mutations endpoint may use different casing/spacing.
// Try the exact name first, then common normalizations.

function getVariantSprite(variant, cropSprite, mutations) {
  if (variant === 'Normal' || variant === 'MaxWeight') return cropSprite;
  if (!mutations) return null;

  // Try exact match first
  if (mutations[variant]?.sprite) return mutations[variant].sprite;

  // Try case-insensitive + whitespace-normalized match
  const norm = variant.toLowerCase().replace(/\s+/g, '');
  for (const [k, v] of Object.entries(mutations)) {
    if (k.toLowerCase().replace(/\s+/g, '') === norm && v?.sprite) return v.sprite;
  }
  return null;
}

function variantEmoji(variant) {
  return {
    Normal:'🌿', Wet:'💧', Chilled:'❄️', Frozen:'🧊', Thunderstruck:'⚡',
    Dawnlit:'🌸', Amberlit:'🌕', Dawnbound:'💜', Amberbound:'🟠',
    Gold:'✨', Rainbow:'🌈', MaxWeight:'⚖️',
  }[variant] ?? '🌿';
}

function fmtCoins(n) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(n%1_000_000_000===0?0:1)+'B';
  if (n >= 1_000_000)     return (n/1_000_000).toFixed(n%1_000_000===0?0:1)+'M';
  if (n >= 1_000)         return (n/1_000).toFixed(n%1_000===0?0:1)+'K';
  return n.toLocaleString();
}

function fmtTime(seconds) {
  if (!seconds) return '—';
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds/60)}m`;
  const h = Math.floor(seconds/3600), m = Math.round((seconds%3600)/60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
