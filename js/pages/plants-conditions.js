// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-conditions.js
// v0.6.0 — mutation conditions tab
// ═══════════════════════════════════════════════

import { VARIANT_CATEGORIES, CROP_VARIANTS } from '../lib/aries.js';
import { rarityBadge } from './plants-grid.js';
import { getSupabase } from '../lib/supabase.js';

let _activeVariant  = 'Wet';
let _missingOnly    = false;
let _plants         = [];
let _discovered     = new Map();
let _onToggle       = null;

// Flat list of variants available in the conditions tab (all except Normal/MaxWeight)
const CONDITION_VARIANTS = Object.values(VARIANT_CATEGORIES).flat().filter(v => v !== 'Normal' && v !== 'MaxWeight');

export function renderConditions(container, plants, discovered, onToggle) {
  _plants = plants;
  _discovered = discovered;
  _onToggle = onToggle;

  container.innerHTML = `
    <link rel="stylesheet" href="css/plants.css">
    <div class="cond-toolbar">
      <div class="cond-variant-tabs" id="cond-tabs">${buildVariantTabs()}</div>
      <div class="cond-filter-row">
        <button class="filter-pill${_missingOnly ? '' : ' active'}" id="cond-show-all">Show all</button>
        <button class="filter-pill${_missingOnly ? ' active' : ''}" id="cond-missing">Missing only</button>
      </div>
    </div>
    <div id="cond-plant-list"></div>`;

  document.getElementById('cond-tabs')?.addEventListener('click', onTabClick);
  document.getElementById('cond-show-all')?.addEventListener('click', () => setFilter(false));
  document.getElementById('cond-missing')?.addEventListener('click', () => setFilter(true));
  document.getElementById('cond-plant-list')?.addEventListener('click', onPlantClick);

  renderPlantList();
}

function buildVariantTabs() {
  return Object.entries(VARIANT_CATEGORIES)
    .filter(([, variants]) => variants.some(v => CONDITION_VARIANTS.includes(v)))
    .map(([cat, variants]) => {
      const relevant = variants.filter(v => CONDITION_VARIANTS.includes(v));
      return relevant.map(v => `
        <button class="cond-tab${v === _activeVariant ? ' active' : ''}"
                data-variant="${v}">${v}</button>`).join('');
    }).join('<span class="cond-tab-sep">·</span>');
}

function onTabClick(e) {
  const btn = e.target.closest('.cond-tab');
  if (!btn) return;
  _activeVariant = btn.dataset.variant;
  document.querySelectorAll('.cond-tab').forEach(b => b.classList.toggle('active', b.dataset.variant === _activeVariant));
  renderPlantList();
}

function setFilter(missing) {
  _missingOnly = missing;
  document.getElementById('cond-show-all')?.classList.toggle('active', !missing);
  document.getElementById('cond-missing')?.classList.toggle('active', missing);
  renderPlantList();
}

function renderPlantList() {
  const container = document.getElementById('cond-plant-list');
  if (!container) return;

  const filtered = _plants.filter(plant => {
    const disc = _discovered.get(plant.key) ?? new Set();
    if (_missingOnly && disc.has(_activeVariant)) return false;
    return true;
  });

  if (!filtered.length) {
    container.innerHTML = `<div class="state-empty">All ${_activeVariant} variants collected! 🎉</div>`;
    return;
  }

  container.innerHTML = filtered.map(plant => {
    const disc      = _discovered.get(plant.key) ?? new Set();
    const hasIt     = disc.has(_activeVariant);
    const name      = plant.crop?.name ?? plant.key;
    const sprite    = plant.crop?.sprite ?? plant.seed?.sprite ?? null;

    return `
      <div class="cond-plant-row${hasIt ? ' has-variant' : ''}"
           data-plant-key="${plant.key}" data-variant="${_activeVariant}">
        ${sprite ? `<img class="cond-sprite" src="${sprite}" alt="${name}" loading="lazy">` : '<span class="cond-sprite-missing">🌿</span>'}
        <div class="cond-name-wrap">
          ${rarityBadge(plant.key)}
          <span class="cond-plant-name">${name}</span>
        </div>
        <div class="cond-check-wrap">
          <div class="cond-checkbox${hasIt ? ' checked' : ''}" aria-label="Toggle ${_activeVariant} for ${name}">
            ${hasIt ? '✓' : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

async function onPlantClick(e) {
  const row = e.target.closest('.cond-plant-row');
  if (!row) return;

  const plantKey   = row.dataset.plantKey;
  const variantKey = row.dataset.variant;
  const wasChecked = row.classList.contains('has-variant');

  // Optimistic
  row.classList.toggle('has-variant', !wasChecked);
  const checkbox = row.querySelector('.cond-checkbox');
  if (checkbox) {
    checkbox.classList.toggle('checked', !wasChecked);
    checkbox.textContent = wasChecked ? '' : '✓';
  }

  // Update local discovered map
  if (!_discovered.has(plantKey)) _discovered.set(plantKey, new Set());
  const set = _discovered.get(plantKey);
  wasChecked ? set.delete(variantKey) : set.add(variantKey);
  _onToggle?.(plantKey);

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (wasChecked) {
      const { error } = await supabase.from('journal_entries').delete()
        .eq('user_id', user.id).eq('item_type','crop').eq('item_key',plantKey).eq('variant_key',variantKey);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('journal_entries')
        .insert({ user_id:user.id, item_type:'crop', item_key:plantKey, variant_key:variantKey });
      if (error) throw error;
    }
  } catch (err) {
    console.error('[conditions] toggle failed, reverting:', err);
    row.classList.toggle('has-variant', wasChecked);
    if (checkbox) { checkbox.classList.toggle('checked', wasChecked); checkbox.textContent = wasChecked ? '✓' : ''; }
    const set = _discovered.get(plantKey);
    wasChecked ? set.add(variantKey) : set.delete(variantKey);
    _onToggle?.(plantKey);
  }
}
