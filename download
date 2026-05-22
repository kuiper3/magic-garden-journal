// ═══════════════════════════════════════════════
// Magic Garden Journal — js/pages/pets-modal.js
// v0.6.0 — pet detail: egg, diet, abilities, variants
// ═══════════════════════════════════════════════

import { PET_VARIANTS, composedPetSpriteUrl, ABILITY_STATIC_DATA, PET_FEED_BASE, FEED_WEATHER_MULT, FEED_COL_MULT } from '../lib/aries.js';
import { getSupabase } from '../lib/supabase.js';
import { petDisplayName, fmtHours } from './pets-grid.js';

const ARIES_BASE = 'https://mg-api.ariedam.fr';
const fmtCoin = n => n == null ? '—' : n.toLocaleString();

function rarityIconImg(rarity) {
  const r = rarity ?? 'Common';
  return `<img class="modal-rarity-icon" src="${ARIES_BASE}/assets/sprites/ui/Rarity${r}.png" alt="${r}" title="${r}">`;
}
function coinIconImg() {
  return `<img class="stat-icon-img" src="${ARIES_BASE}/assets/sprites/ui/Coin.png" alt="coin">`;
}

// Prettify an ability key (e.g. 'SeedFinderII' → 'Seed Finder II') as a fallback.
function prettify(str) {
  return String(str ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

let _onToggle = null;

export function openPetModal(pet, ctx, discovered, user, onToggle) {
  closePetModal();
  _onToggle = onToggle;

  const { eggLookup = {}, cropLookup = {}, abilityLookup = {} } = ctx ?? {};

  const key    = pet.key;
  const name   = petDisplayName(pet);
  const rarity = pet.rarity ?? 'Common';
  const petImg = pet.sprite ?? null;
  const disc   = discovered.get(key) ?? new Set();

  const egg      = eggLookup[pet.eggName] ?? null;
  const eggImg   = egg?.sprite ?? null;
  const eggPrice = egg?.coinPrice ?? (pet.eggPrice !== 9999 ? pet.eggPrice : null);
  const eggName  = pet.eggName && pet.eggName !== 'Unknown'
    ? prettify(pet.eggName) : 'Unknown egg';

  // ── Stages: Egg → Pet ──
  const stage = (src, label) => src
    ? `<div class="stage">
         <img class="stage-img" src="${src}" alt="${label}" loading="lazy">
         <span class="stage-lbl">${label}</span>
       </div>`
    : `<div class="stage"><span class="stage-img stage-missing">·</span><span class="stage-lbl">${label}</span></div>`;

  // ── Diet chips with feeding breakdown ──
  const diet = Array.isArray(pet.diet) ? pet.diet : [];
  const feedBase = PET_FEED_BASE[pet.key] ?? {};
  const WEATHERS = ['Normal','Wet/Chill','Thunder','Frozen'];
  const COL_LABELS = ['Normal','Wet','Thunderstruck','Gold','Rainbow'];

  const dietChips = diet.length
    ? diet.map(cropKey => {
        const crop   = cropLookup[cropKey] ?? {};
        const cName  = crop.name ?? prettify(cropKey);
        const cImg   = crop.sprite ?? null;
        const img    = cImg
          ? `<img src="${cImg}" alt="${cName}" loading="lazy" onerror="this.style.display='none'">`
          : '';
        const base = feedBase[cropKey];
        const hasData = base != null;

        // Build the feeding mini-table if we have a base value
        const feedRows = hasData ? WEATHERS.map((w, wi) => {
          const wm = [1,2,5,6][wi];
          const cells = FEED_COL_MULT.map(cm => {
            const v = Math.min(100, +(base * (wm + cm - 1)).toFixed(1));
            const cls = v >= 100 ? 'feed-cell cap' : v >= 70 ? 'feed-cell hi' : v >= 30 ? 'feed-cell mid' : 'feed-cell';
            return `<td class="${cls}">${v}%</td>`;
          }).join('');
          const wLabel = w.replace('/','<br>');
          return `<tr><th>${wLabel}</th>${cells}</tr>`;
        }).join('') : '';

        const feedBlock = hasData ? `
          <div class="feed-table-wrap">
            <table class="feed-table">
              <thead><tr>
                <th></th>
                <th title="Normal crop">N</th>
                <th title="Wet/Thunderstruck tier">T2</th>
                <th title="Frozen/Gold tier">T3</th>
                <th title="Dawnbound tier">T4</th>
                <th title="Rainbow/Max tier">T5</th>
              </tr></thead>
              <tbody>${feedRows}</tbody>
            </table>
            <p class="feed-note">Hunger recovery % · tiers are crop mutation levels</p>
          </div>` : `<p class="feed-no-data">Hunger data not yet mapped for this crop</p>`;

        return `
          <details class="diet-chip-detail">
            <summary class="diet-chip">
              ${img}<span class="diet-chip-lbl">${cName}</span>
              ${hasData ? `<span class="diet-base-pct">${base}%</span>` : ''}
            </summary>
            ${feedBlock}
          </details>`;
      }).join('')
    : `<span class="modal-empty-note">No diet data</span>`;

  // ── Abilities — collapsible rows with wiki proc rates + effects ──
  // 'Continuous' / 'Passive' triggers are implicit — omit them as redundant.
  const SKIP_TRIGGERS = new Set(['continuous','passive','always','always active','permanent']);
  const weights   = pet.innateAbilityWeights ?? {};
  const abEntries = Object.entries(weights);

  function buildAbilityStatChips(stat) {
    if (!stat || !stat.type) return '';
    const chips = [];
    if (stat.type === 'passive') {
      chips.push(`<span class="ability-stat passive">Always active</span>`);
    } else if (stat.type === 'perMin') {
      // Formula: rate × STR / min. Show formula; exact value calculated in Owned Pets.
      const rateStr = Number.isInteger(stat.rate) ? stat.rate : stat.rate.toFixed(2).replace(/\.?0+$/, '');
      chips.push(`<span class="ability-stat"><span class="ability-stat-lbl">Chance/min</span>${rateStr} × STR</span>`);
    } else if (stat.type === 'prob') {
      chips.push(`<span class="ability-stat"><span class="ability-stat-lbl">Chance</span>${stat.rate}% × STR</span>`);
    } else if (stat.type === 'charge') {
      chips.push(`<span class="ability-stat"><span class="ability-stat-lbl">Charge time</span>${stat.rate}s ÷ STR</span>`);
    }
    if (stat.effectTemplate) {
      // effectBase present → scales with STR
      const eff = stat.effectBase != null
        ? `${stat.effectBase}% × STR`
        : stat.effectTemplate;
      chips.push(`<span class="ability-stat effect"><span class="ability-stat-lbl">Effect</span>${eff}</span>`);
    }
    return chips.join('');
  }

  const abilityRows = abEntries.length
    ? abEntries.map(([abKey]) => {
          const ab      = abilityLookup[abKey] ?? {};
          const abName  = ab.name ?? prettify(abKey);
          const rawTrig = ab.triggerType ?? ab.trigger ?? ab.triggerOn ?? null;
          const trigger = rawTrig && !SKIP_TRIGGERS.has(String(rawTrig).toLowerCase()) ? prettify(rawTrig) : null;
          const apiDesc = ab.description ?? ab.desc ?? '';
          const stat    = ABILITY_STATIC_DATA[abName] ?? {};
          const chips   = buildAbilityStatChips(stat);
          return `
            <details class="ability-row">
              <summary class="ability-head">
                <span class="ability-name">${abName}</span>
                ${stat.weather ? `<span class="ability-trigger weather">${stat.weather}</span>` : trigger ? `<span class="ability-trigger">${trigger}</span>` : ''}
                <span class="ability-expand-icon" aria-hidden="true">▾</span>
              </summary>
              <div class="ability-body">
                ${apiDesc ? `<p class="ability-desc">${apiDesc}</p>` : ''}
                ${chips ? `<div class="ability-stats-row">${chips}</div>` : ''}
              </div>
            </details>`;
        }).join('')
    : `<span class="modal-empty-note">No abilities</span>`;

  // ── Variant tiles (Normal / Gold / Rainbow / MaxWeight) ──
  const tiles = PET_VARIANTS.map(variant => {
    const isDisc = disc.has(variant);
    const cls    = variant === 'MaxWeight' ? ' maxweight' : '';
    const label  = variant === 'MaxWeight' ? 'Max Weight' : variant;
    // Normal & MaxWeight show the base pet sprite; Gold/Rainbow use the composed endpoint.
    const url    = (variant === 'Normal' || variant === 'MaxWeight')
      ? (petImg ?? composedPetSpriteUrl(pet, variant))
      : composedPetSpriteUrl(pet, variant);
    const fallback = petImg ?? '';
    return `
      <div class="variant-tile${isDisc ? ' discovered' : ''}${cls}"
           data-variant="${variant}" data-pet-key="${key}">
        <div class="variant-img-wrap">
          <img src="${url}" alt="${label}" loading="lazy"
               data-fallback="${fallback}"
               onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}else{this.style.display='none';}">
          ${isDisc ? `<span class="variant-check">✓</span>` : ''}
        </div>
        <span class="variant-name">${label}</span>
      </div>`;
  }).join('');

  const total = PET_VARIANTS.length;
  const pct   = Math.round((disc.size / total) * 100);

  const overlay = document.createElement('div');
  overlay.id = 'pet-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true">

      <div class="modal-header">
        <div class="modal-rarity-wrap">${rarityIconImg(rarity)}</div>
        <h3 class="modal-crop-name">${name}</h3>
        <button class="modal-close" aria-label="Close">✕</button>
      </div>

      <div class="modal-stages">
        ${stage(eggImg, eggName)}
        <span class="stage-arr">→</span>
        ${stage(petImg, name)}
      </div>

      <div class="modal-info-block">
        <div class="modal-rarity-tag rarity-${String(rarity).toLowerCase()}">${rarity}</div>
        <div class="modal-info-line modal-source-line">${eggName}${eggPrice != null ? ` <span class="source-price">(${fmtCoin(eggPrice)} coins)</span>` : ''}</div>
      </div>

      <div class="modal-stats-grid pet-stats-grid">
        <div class="stat-cell">
          <span class="stat-label">EGG</span>
          <span class="stat-value">${coinIconImg()}${fmtCoin(eggPrice)}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">MATURE</span>
          <span class="stat-value">${fmtHours(pet.hoursToMature)}</span>
        </div>
        <div class="stat-cell">
          <span class="stat-label">RARITY</span>
          <span class="stat-value">${rarity}</span>
        </div>
      </div>

      <div class="modal-detail-section">
        <div class="modal-section-title">Diet</div>
        <div class="diet-chips">${dietChips}</div>
      </div>

      <div class="modal-detail-section">
        <div class="modal-section-title">Abilities</div>
        <div class="ability-list">${abilityRows}</div>
      </div>

      <div class="modal-actions-bar">
        <button class="modal-action-btn" id="pet-check-all">Check all</button>
        <button class="modal-action-btn ghost" id="pet-clear-all">Clear all</button>
        <span class="modal-progress-inline" id="pet-progress-text">
          ${disc.size}/${total} <span class="dim">(${pct}%)</span>
        </span>
      </div>

      <div class="modal-variants-section">
        <div class="modal-section-title">Variants</div>
        <div class="modal-variants-grid pet-variants-grid">${tiles}</div>
      </div>
    </div>`;

  overlay.addEventListener('click', onOverlayClick);
  overlay.querySelector('#pet-check-all')?.addEventListener('click', () => bulkToggle(pet, discovered, true));
  overlay.querySelector('#pet-clear-all')?.addEventListener('click', () => bulkToggle(pet, discovered, false));
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  document.addEventListener('keydown', onKeydown);
}

export function closePetModal() {
  document.getElementById('pet-modal')?.remove();
  document.removeEventListener('keydown', onKeydown);
  _onToggle = null;
}

// ── Bulk check / clear ────────────────────────

async function bulkToggle(pet, discovered, makeChecked) {
  const key  = pet.key;
  const disc = discovered.get(key) ?? new Set();
  const targets = makeChecked
    ? PET_VARIANTS.filter(v => !disc.has(v))
    : PET_VARIANTS.filter(v =>  disc.has(v));
  if (!targets.length) return;

  for (const v of targets) {
    if (makeChecked) disc.add(v); else disc.delete(v);
    const tile = document.querySelector(`[data-variant="${v}"][data-pet-key="${key}"]`);
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
      const rows = targets.map(v => ({ user_id: user.id, item_type: 'pet', item_key: key, variant_key: v }));
      const { error } = await supabase.from('journal_entries')
        .upsert(rows, { onConflict: 'user_id,item_type,item_key,variant_key', ignoreDuplicates: true });
      if (error) throw error;
    } else {
      const { error } = await supabase.from('journal_entries').delete()
        .eq('user_id', user.id).eq('item_type', 'pet').eq('item_key', key)
        .in('variant_key', targets);
      if (error) throw error;
    }
  } catch (err) {
    console.error('[pet-modal] bulk toggle failed:', err);
  }
}

// ── Single tile toggle ────────────────────────

async function onOverlayClick(e) {
  if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
    closePetModal(); return;
  }
  const tile = e.target.closest('.variant-tile');
  if (!tile) return;

  const petKey     = tile.dataset.petKey;
  const variantKey = tile.dataset.variant;
  const wasDisc    = tile.classList.contains('discovered');

  tile.classList.toggle('discovered', !wasDisc);
  if (!wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
  else tile.querySelector('.variant-check')?.remove();

  _onToggle?.(petKey, variantKey, wasDisc);

  const count = document.querySelectorAll(`.variant-tile.discovered[data-pet-key="${petKey}"]`).length;
  const pct   = Math.round((count / PET_VARIANTS.length) * 100);
  const el    = document.getElementById('pet-progress-text');
  if (el) el.innerHTML = `${count}/${PET_VARIANTS.length} <span class="dim">(${pct}%)</span>`;

  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (wasDisc) {
      const { error } = await supabase.from('journal_entries').delete()
        .eq('user_id', user.id).eq('item_type', 'pet')
        .eq('item_key', petKey).eq('variant_key', variantKey);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('journal_entries')
        .upsert({ user_id: user.id, item_type: 'pet', item_key: petKey, variant_key: variantKey },
                { onConflict: 'user_id,item_type,item_key,variant_key', ignoreDuplicates: true });
      if (error) throw error;
    }
  } catch (err) {
    console.error('[pet-modal] tile toggle failed, reverting:', err);
    tile.classList.toggle('discovered', wasDisc);
    if (wasDisc) tile.querySelector('.variant-img-wrap')?.insertAdjacentHTML('beforeend', `<span class="variant-check">✓</span>`);
    else tile.querySelector('.variant-check')?.remove();
    _onToggle?.(petKey, variantKey, !wasDisc);
  }
}

function updateModalProgress(disc) {
  const el = document.getElementById('pet-progress-text');
  if (!el) return;
  const pct = Math.round((disc.size / PET_VARIANTS.length) * 100);
  el.innerHTML = `${disc.size}/${PET_VARIANTS.length} <span class="dim">(${pct}%)</span>`;
}

function onKeydown(e) { if (e.key === 'Escape') closePetModal(); }
