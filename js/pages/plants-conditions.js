// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/plants-conditions.js
// v0.7.0 — fixed variant order, refined visual
// ═══════════════════════════════════════════════

import { CROP_VARIANTS, MUTATION_API_NAME } from '../lib/aries.js';
import { rarityPill, acquisitionBadge } from '../lib/icons.js';
import { getSupabase } from '../lib/supabase.js';

// Condition variants — same order as in-game journal except skip Normal/MaxWeight
const CONDITION_VARIANTS = CROP_VARIANTS.filter(v => v !== 'Normal' && v !== 'MaxWeight');

let _activeVariant = 'Wet';
let _missingOnly   = false;
let _plants        = [];
let _discovered    = new Map();
let _onToggle      = null;

export function renderConditions(container, plants, discovered, onToggle) {
  _plants     = plants;
  _discovered = discovered;
  _onToggle   = onToggle;

  container.innerHTML = `
    <link rel="stylesheet" href="css/plants.css">
    <div class="cond-toolbar">
      <div class="cond-variant-tabs" id="cond-tabs">${buildTabs()}</div>
      <div class="cond-filter-row">
        <button class="filter-pill${_missingOnly ? '' : ' active'}" id="cond-show-all">Show all</button>
        <button class="filter-pill${_missingOnly ? ' active' : ''}" id="cond-missing">Missing only</button>
      </div>
    </div>
    <div id="cond-plant-list"></div>`;

  document.getElementById('cond-tabs')?.addEventListener('click', onTabClick);
  document.getElementById('cond-show-all')?.addEventListener('click', () => setFilter(false));
  document.getElementById('cond-missing')?.addEventListener('click', () => setFilter(true));
  document.getElementById('cond-plant-list')?.addEventListener('click', onRowClick);

  renderList();
}

function buildTabs() {
  return CONDITION_VARIANTS.map(v =>
    `<button class="cond-tab${v === _activeVariant ? ' active' : ''}" data-variant="${v}">${v}</button>`
  ).join('');
}

function onTabClick(e) {
  const btn = e.target.closest('.cond-tab');
  if (!btn) return;
  _activeVariant = btn.dataset.variant;
  document.querySelectorAll('.cond-tab').forEach(b => b.classList.toggle('active', b.dataset.variant === _activeVariant));
  renderList();
}

function setFilter(missingOnly) {
  _missingOnly = missingOnly;
  document.getElementById('cond-show-all')?.classList.toggle('active', !missingOnly);
  document.getElementById('cond-missing')?.classList.toggle('active', missingOnly);
  renderList();
}

function renderList() {
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
    const disc   = _discovered.get(plant.key) ?? new Set();
    const hasIt  = disc.has(_activeVariant);
    const name   = plant.crop?.name ?? plant.key;
    // Use mutation sprite for the active variant, crop sprite for Normal/MaxWeight
    const cropSprite = plant.crop?.sprite ?? plant.seed?.sprite;
    const sprite = getMutationSprite(_activeVariant, cropSprite);

    return `
      <div class="cond-plant-row${hasIt ? ' has-variant' : ''}"
           data-plant-key="${plant.key}" data-variant="${_activeVariant}">
        <img class="cond-sprite${hasIt ? '' : ' dim'}" src="${sprite}" alt="${name}" loading="lazy"
             onerror="this.style.display='none'">
        <div class="cond-name-wrap">
          <span class="cond-plant-name">${name}</span>
          ${rarityPill(plant.key)}
          ${acquisitionBadge(plant.key)}
        </div>
        <div class="cond-check-wrap">
          <div class="cond-checkbox${hasIt ? ' checked' : ''}">${hasIt ? '✓' : ''}</div>
        </div>
      </div>`;
  }).join('');
}

async function onRowClick(e) {
  const row = e.target.closest('.cond-plant-row');
  if (!row) return;

  const plantKey   = row.dataset.plantKey;
  const variantKey = row.dataset.variant;
  const wasChecked = row.classList.contains('has-variant');

  // Optimistic
  row.classList.toggle('has-variant', !wasChecked);
  const checkbox = row.querySelector('.cond-checkbox');
  const sprite   = row.querySelector('.cond-sprite');
  if (checkbox) { checkbox.classList.toggle('checked', !wasChecked); checkbox.textContent = wasChecked ? '' : '✓'; }
  if (sprite)   sprite.classList.toggle('dim', wasChecked);

  if (!_discovered.has(plantKey)) _discovered.set(plantKey, new Set());
  const set = _discovered.get(plantKey);
  if (wasChecked) set.delete(variantKey); else set.add(variantKey);
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
        .upsert({ user_id:user.id, item_type:'crop', item_key:plantKey, variant_key:variantKey },
                { onConflict:'user_id,item_type,item_key,variant_key', ignoreDuplicates:true });
      if (error) throw error;
    }
  } catch (err) {
    console.error('[conditions] toggle failed, reverting:', err);
    row.classList.toggle('has-variant', wasChecked);
    if (checkbox) { checkbox.classList.toggle('checked', wasChecked); checkbox.textContent = wasChecked ? '✓' : ''; }
    if (sprite) sprite.classList.toggle('dim', !wasChecked);
    if (wasChecked) set.add(variantKey); else set.delete(variantKey);
    _onToggle?.(plantKey);
  }
}
// ── Mutation sprite lookup ────────────────────

const ARIES_BASE = 'https://mg-api.ariedam.fr';

const MUTATION_SPRITE_FILE = {
  Wet: 'Wet', Chilled: 'Chilled', Frozen: 'Frozen', Thunderstruck: 'Thunderstruck',
  Dawnlit: 'Dawnlit', Amberlit: 'Amberlit',
  Gold: 'Gold', Rainbow: 'Rainbow',
  Dawnbound: 'Dawncharged', Amberbound: 'Ambercharged',
};

function getMutationSprite(variant, cropSprite) {
  if (variant === 'Normal' || variant === 'MaxWeight') return cropSprite;
  const file = MUTATION_SPRITE_FILE[variant];
  if (file) return `${ARIES_BASE}/assets/sprites/mutations/${file}.png`;
  return cropSprite;
}
