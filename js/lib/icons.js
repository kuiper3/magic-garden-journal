// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/icons.js
// v0.7.0 — coin SVG, acquisition badges, formatters
// ═══════════════════════════════════════════════

import { CROP_ACQUISITION, CROP_RARITY, seedFinderTier } from './aries.js';

// ── Gold coin SVG (inline, reusable) ──────────

export const COIN_SVG = `
<svg class="coin-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="coinGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fff4b0"/>
      <stop offset="55%" stop-color="#f5c43a"/>
      <stop offset="100%" stop-color="#b88410"/>
    </radialGradient>
  </defs>
  <circle cx="8" cy="8" r="7" fill="url(#coinGrad)" stroke="#8a5e0a" stroke-width="0.7"/>
  <circle cx="8" cy="8" r="4.6" fill="none" stroke="#d99a18" stroke-width="0.7" opacity="0.65"/>
  <text x="8" y="11" text-anchor="middle" font-family="Arial Black, sans-serif"
        font-size="6.5" font-weight="900" fill="#8a5e0a">C</text>
</svg>`.trim();

// ── Coin formatter ────────────────────────────

export function fmtCoinValue(n) {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'K';
  return n.toLocaleString();
}

/** Coin price with inline coin icon. */
export function coinPrice(n, opts = {}) {
  if (n == null) return '<span class="coin-price coin-na">—</span>';
  const cls = opts.large ? 'coin-price large' : 'coin-price';
  return `<span class="${cls}">${COIN_SVG}<span class="coin-value">${fmtCoinValue(n)}</span></span>`;
}

// ── Time formatter ────────────────────────────

export function fmtTime(seconds) {
  if (seconds == null) return '—';
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600), m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Acquisition badge ─────────────────────────

const DISCORD_SVG = `
<svg class="acq-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill="#5865F2" d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
</svg>`.trim();

const STPAT_SVG = `
<svg class="acq-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill="#3a8d3a" d="M12 2c-1.5 0-2.5 1.5-2 3.5C8 4 6 4.5 5.5 6.5S7 9.5 9 9.5h.5C9 11 9.5 13 11.5 13.5 12 15 11.5 17 10 18l1.5 1.5L12 22l.5-2.5L14 18c-1.5-1-2-3-1.5-4.5 2-.5 2.5-2.5 2-4H15c2 0 3.5-1 3-3s-2.5-2.5-4.5-1C14 3.5 13 2 12 2z"/>
</svg>`.trim();

const ROSE_SVG = `
<svg class="acq-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle cx="12" cy="10" r="4" fill="#d93553"/>
  <circle cx="12" cy="10" r="2" fill="#a01b35"/>
  <path d="M12 14 L11 22 M12 14 L15 19" stroke="#3a7a3a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
</svg>`.trim();

const DAWN_SVG = `
<svg class="acq-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="dawnG" cx="50%" cy="60%" r="50%">
      <stop offset="0%" stop-color="#ffd4f0"/>
      <stop offset="60%" stop-color="#d65fb8"/>
      <stop offset="100%" stop-color="#7d2a8c"/>
    </radialGradient>
  </defs>
  <circle cx="12" cy="12" r="8" fill="url(#dawnG)"/>
  <circle cx="12" cy="12" r="5" fill="#fff" opacity="0.3"/>
</svg>`.trim();

const WINTER_SVG = `
<svg class="acq-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g stroke="#aee5ff" stroke-width="1.6" stroke-linecap="round" fill="none">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="5.5" y1="5.5" x2="18.5" y2="18.5"/>
    <line x1="18.5" y1="5.5" x2="5.5" y2="18.5"/>
  </g>
</svg>`.trim();

const RAMADAN_SVG = `
<svg class="acq-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path fill="#f5c43a" d="M16 4a8 8 0 1 0 0 16 6 6 0 1 1 0-16z"/>
  <circle cx="18" cy="7" r="1" fill="#f5c43a"/>
</svg>`.trim();

const ACQ_BADGES = {
  'event-stpat':   { svg: STPAT_SVG,   label: "St. Patrick's Day Event" },
  'event-rose':    { svg: ROSE_SVG,    label: 'Rose Day Event' },
  'event-ramadan': { svg: RAMADAN_SVG, label: 'Ramadan Event' },
  'dawn':          { svg: DAWN_SVG,    label: 'Dawn Shop' },
  'winter':        { svg: WINTER_SVG,  label: 'Winter Event' },
  'discord':       { svg: DISCORD_SVG, label: 'Discord exclusive' },
  'ios':           { html: '<span class="acq-emoji" aria-hidden="true">📱</span>', label: 'iOS / Web App only' },
  'carnival':      { html: '<span class="acq-emoji" aria-hidden="true">🎪</span>', label: 'Carnival Stand' },
};

/** Returns an acquisition badge for a crop, or empty string if standard seed shop. */
export function acquisitionBadge(cropKey) {
  const acq = CROP_ACQUISITION[cropKey];
  if (!acq) return '';
  const cfg = ACQ_BADGES[acq.type];
  if (!cfg) return '';
  const inner = cfg.svg || cfg.html;
  return `<span class="acq-badge" title="${cfg.label}">${inner}</span>`;
}

/** Returns acquisition note text (for modals/lists). */
export function acquisitionText(cropKey) {
  return CROP_ACQUISITION[cropKey]?.text ?? '';
}

// ── Rarity pill ───────────────────────────────

export function rarityPill(cropKey) {
  const r = CROP_RARITY[cropKey] ?? 'Common';
  return `<span class="rarity-pill rarity-${r.toLowerCase()}">${r.toUpperCase()}</span>`;
}

// ── Seed Finder note ──────────────────────────

export function seedFinderNote(cropKey) {
  const rarity = CROP_RARITY[cropKey];
  const tier   = seedFinderTier(rarity);
  return tier ? `Seed Finder ${tier}` : null;
}
