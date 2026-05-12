// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants.js
// v0.4.0 — grid view with progress bars
// ═══════════════════════════════════════════════
// 0.5.0 adds: variant drill-down modal + Supabase writes

import { getPlantsSorted, CROP_VARIANTS } from '../lib/aries.js';
import { getSupabase } from '../lib/supabase.js';

let _container = null;

// ── Page interface ────────────────────────────

/** @param {HTMLElement} container */
export function render(container) {
  _container = container;
  container.innerHTML = `
    <link rel="stylesheet" href="css/plants.css">
    <div class="page-header">
      <h2 class="page-title">Plants</h2>
      <p class="page-subtitle">Track your discovered crop variants · ${CROP_VARIANTS.length} variants per crop</p>
    </div>
    <div id="plants-content">
      <div class="state-loading">
        <div class="spinner"></div>
        <span>Loading plants…</span>
      </div>
    </div>
  `;
}

export async function init() {
  try {
    await loadPlants();
  } catch (err) {
    console.error('[plants] init error:', err);
    showError(err.message);
  }
}

export function destroy() {
  _container = null;
}

// ── Data loading ──────────────────────────────

async function loadPlants() {
  // Plants catalog + journal entries in parallel — no mutations fetch needed,
  // variant list is a game constant (CROP_VARIANTS, 12 entries).
  const [plants, entries] = await Promise.all([
    getPlantsSorted(),
    fetchJournalEntries(),
  ]);

  const discoveredMap = buildDiscoveredMap(entries);
  renderGrid(plants, discoveredMap);
}

async function fetchJournalEntries() {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('journal_entries')
      .select('item_key, variant_key')
      .eq('user_id', user.id)
      .eq('item_type', 'crop');

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn('[plants] Could not load journal entries:', err.message);
    return [];
  }
}

/** Builds Map<plantKey, Set<variantKey>> from Supabase rows. */
function buildDiscoveredMap(entries) {
  const map = new Map();
  for (const { item_key, variant_key } of entries) {
    if (!map.has(item_key)) map.set(item_key, new Set());
    map.get(item_key).add(variant_key);
  }
  return map;
}

// ── Rendering ─────────────────────────────────

function renderGrid(plants, discoveredMap) {
  const content = document.getElementById('plants-content');
  if (!content) return;

  if (!plants.length) {
    content.innerHTML = `
      <div class="state-error">
        <span class="error-icon">🌱</span>
        <span>No plant data available. Try refreshing.</span>
      </div>`;
    return;
  }

  const cards = plants.map(plant => buildCard(plant, discoveredMap)).join('');
  content.innerHTML = `<div class="plants-grid">${cards}</div>`;
}

function buildCard(plant, discoveredMap) {
  const key         = plant.key;
  const name        = plant.crop?.name ?? key;
  const sprite      = plant.crop?.sprite ?? plant.seed?.sprite ?? null;
  const purchasable = plant.seed?.purchasable === true;
  const discovered  = discoveredMap.get(key)?.size ?? 0;
  const total       = CROP_VARIANTS.length; // always 12
  const pct         = Math.round((discovered / total) * 100);
  const complete    = discovered >= total;

  const spriteHtml = sprite
    ? `<img class="plant-sprite" src="${sprite}" alt="${name}" loading="lazy"
           onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'plant-sprite-missing',textContent:'🌿'}))">`
    : `<div class="plant-sprite-missing">🌿</div>`;

  return `
    <div class="plant-card${purchasable ? ' purchasable' : ''}"
         data-plant-key="${key}"
         title="${name} · ${discovered}/${total} variants">
      ${spriteHtml}
      <span class="plant-name">${name}</span>
      <div class="plant-progress">
        <span class="progress-label">${discovered} / ${total}</span>
        <div class="progress-bar-track">
          <div class="progress-bar-fill${complete ? ' complete' : ''}"
               style="width: ${pct}%"></div>
        </div>
      </div>
    </div>`;
}

// ── Error state ───────────────────────────────

function showError(message) {
  const content = document.getElementById('plants-content');
  if (!content) return;
  content.innerHTML = `
    <div class="state-error">
      <span class="error-icon">⚠️</span>
      <span>Could not load plants: ${message}</span>
    </div>`;
}
