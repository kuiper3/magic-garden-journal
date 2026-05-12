// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-modal.js
// v0.6.0 — variant modal with check all
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

  const seedPrice = plant.seed?.coinPrice;
  const sellPrice = plant.crop?.baseSellPrice;
  const harvest   = plant.plant?.harvestType;

  const detailPills = [
    seedPrice != null ? `<span class="detail-pill">🌰 ${fmtCoins(seedPrice)} seed</span>` : '',
    sellPrice != null ? `<span class="detail-pill">💰 ${fmtCoins(sellPrice)} sell</span>` : '',
    harvest           ? `<span class="detail-pill">${harvest === 'Multi' ? '♻ Multi' : '🌱 Single'}</span>` : '',
  ].filter(Boolean).join('');

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
            ${disc.size} / ${CROP_VARIANTS.length} variants discovered
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
  document.getElementById('modal-check-all', overlay)?.addEventListener('click', () => checkAll(plant, discovered, user));
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
  const key  = plant.key;
  const disc = discovered.get(key) ?? new Set();
  const missing = CROP_VARIANTS.filter(v => !disc.has(v));
  if (!missing.length) return;

  // Optimistic
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
    const rows = missing.map(v => ({ user_id: user.id, item_type: 'crop', item_key: key, variant_key: v }));
    const { error } = await supabase.from('journal_entries').upsert(rows, { onConflict: 'user_id,item_type,item_key,variant_key' });
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
  const supabase   = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Optimistic
  tile.classList.toggle('discovered', !wasDisc);
  if (!wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
  else tile.querySelector('.variant-check')?.remove();

  // Update local state via callback
  _onToggle?.(plantKey, variantKey, wasDisc);

  const disc = new Map(); // rebuild from DOM for progress
  document.querySelectorAll(`.variant-tile.discovered[data-plant-key="${plantKey}"]`).forEach(t => {
    disc.set(t.dataset.variant, true);
  });
  document.getElementById('modal-progress-text').textContent =
    `${disc.size} / ${CROP_VARIANTS.length} variants discovered`;

  try {
    if (wasDisc) {
      const { error } = await supabase.from('journal_entries').delete()
        .eq('user_id', user.id).eq('item_type','crop').eq('item_key',plantKey).eq('variant_key',variantKey);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('journal_entries')
        .insert({ user_id:user.id, item_type:'crop', item_key:plantKey, variant_key:variantKey });
      if (error) throw error;
    }
  } catch (err) {
    console.error('[modal] toggle failed, reverting:', err);
    tile.classList.toggle('discovered', wasDisc);
    if (wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
    else tile.querySelector('.variant-check')?.remove();
    _onToggle?.(plantKey, variantKey, !wasDisc);
  }
}

function updateModalProgress(key, disc) {
  const el = document.getElementById('modal-progress-text');
  if (el) el.textContent = `${disc.size} / ${CROP_VARIANTS.length} variants discovered`;
}

function onKeydown(e) { if (e.key === 'Escape') closeModal(); }

// ── Sprite helpers ────────────────────────────

function getVariantSprite(variant, cropSprite, mutations) {
  if (variant === 'Normal' || variant === 'MaxWeight') return cropSprite;
  return mutations[variant]?.sprite ?? null;
}

function variantEmoji(variant) {
  return { Normal:'🌿', Wet:'💧', Chilled:'❄️', Frozen:'🧊', Thunderstruck:'⚡',
           Dawnlit:'🌸', Amberlit:'🌕', Dawnbound:'💜', Amberbound:'🟠',
           Gold:'✨', Rainbow:'🌈', MaxWeight:'⚖️' }[variant] ?? '🌿';
}

function fmtCoins(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(0)+'B';
  if (n >= 1_000_000)     return (n/1_000_000).toFixed(n%1_000_000===0?0:1)+'M';
  if (n >= 1_000)         return (n/1_000).toFixed(n%1_000===0?0:1)+'K';
  return n.toString();
}
