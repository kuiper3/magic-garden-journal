// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.6.0 — rarity + acquisition static maps
// ═══════════════════════════════════════════════

import { get as cacheGet, clearAll as cacheClearAll } from './cache.js';

// ── Variant constants ─────────────────────────

export const CROP_VARIANTS = [
  'Normal',
  'Wet', 'Chilled', 'Frozen', 'Thunderstruck',
  'Dawnlit', 'Amberlit', 'Dawnbound', 'Amberbound',
  'Gold', 'Rainbow', 'MaxWeight',
];

export const PET_VARIANTS = ['Normal', 'Gold', 'Rainbow', 'MaxWeight'];

// ── Variant categories (for Conditions view) ──

export const VARIANT_CATEGORIES = {
  'Weather':  ['Wet', 'Chilled', 'Frozen', 'Thunderstruck'],
  'Lunar':    ['Dawnlit', 'Amberlit', 'Dawnbound', 'Amberbound'],
  'Colour':   ['Gold', 'Rainbow'],
  'Special':  ['Normal', 'MaxWeight'],
};

// ── Rarity ────────────────────────────────────

export const CROP_RARITY = {
  Carrot:'Common', Cabbage:'Common', Strawberry:'Common', Aloe:'Common', Beet:'Common',
  Clover:'Uncommon', FourLeafClover:'Uncommon', Rose:'Uncommon', FavaBean:'Uncommon',
  Delphinium:'Uncommon', Blueberry:'Uncommon', Apple:'Uncommon', OrangeTulip:'Uncommon',
  Tomato:'Uncommon', Daisy:'Uncommon',
  Daffodil:'Rare', Corn:'Rare', Watermelon:'Rare', Pumpkin:'Rare',
  Echeveria:'Rare', Pear:'Rare', Gentian:'Rare', Lavender:'Rare',
  PurpleDaisy:'Legendary', Coconut:'Legendary', PineTree:'Legendary', Banana:'Legendary',
  Lily:'Legendary', Camellia:'Legendary', Squash:'Legendary', Peach:'Legendary',
  BurrosTail:'Legendary', Saffron:'Legendary',
  Mushroom:'Mythical', Cactus:'Mythical', Bamboo:'Mythical', Poinsettia:'Mythical',
  VioletCort:'Mythical', Chrysanthemum:'Mythical', Date:'Mythical', Grape:'Mythical',
  Eggplant:'Mythical',
  Pepper:'Divine', Lemon:'Divine', PassionFruit:'Divine', DragonFruit:'Divine',
  Cacao:'Divine', Lychee:'Divine', Ube:'Divine', Sunflower:'Divine',
  Dawnbreaker:'Celestial', Starweaver:'Celestial', DawnCelestial:'Celestial', MoonCelestial:'Celestial',
};

export const RARITY_META = {
  Common:    { color: '#9ca3af', symbol: '○' },
  Uncommon:  { color: '#4ade80', symbol: '◉' },
  Rare:      { color: '#60a5fa', symbol: '◈' },
  Legendary: { color: '#c084fc', symbol: '★' },
  Mythical:  { color: '#f87171', symbol: '✦' },
  Divine:    { color: '#fbbf24', symbol: '✧' },
  Celestial: { color: '#e879f9', symbol: '✸' },
};

// ── Acquisition notes ─────────────────────────
// Only set for crops that aren't straightforward seed-shop purchases.

export const CROP_ACQUISITION = {
  Clover:       'St. Patrick\'s Day Event',
  FourLeafClover:'St. Patrick\'s Day · random when Clover planted',
  Rose:         'Rose Day Event',
  Delphinium:   'Carnival Stand only',
  Daisy:        'Dawn Shop',
  PurpleDaisy:  'Dawn Shop',
  Apple:        'iOS / Web App only',
  Lavender:     'Dawn Shop',
  PineTree:     'Winter Event',
  Banana:       'Discord (even Server ID)',
  Squash:       'Carnival Stand only',
  Saffron:      'Dawn Shop',
  Poinsettia:   'Winter Event',
  Date:         'Ramadan Event',
  Grape:        'Discord (Server ID ends in 1)',
  Eggplant:     'Dawn Shop',
  Lemon:        'Discord (Server ID ends in 2)',
  Lychee:       'Discord (Server ID ends in 2)',
  Ube:          'Dawn Shop',
  Dawnbreaker:  'Dawn Shop',
};

// ── Canonical order ───────────────────────────

export const CROP_ORDER = [
  'Carrot','Cabbage','Strawberry','Aloe',
  'Clover','FourLeafClover','Beet','Rose',
  'FavaBean','Delphinium','Blueberry','Apple',
  'OrangeTulip','Tomato','Daisy','PurpleDaisy',
  'Daffodil','Corn','Watermelon','Pumpkin',
  'Echeveria','Pear','Gentian','Lavender',
  'Coconut','PineTree','Banana','Lily',
  'Camellia','Squash','Peach','BurrosTail',
  'Saffron','Mushroom','Cactus','Bamboo',
  'Poinsettia','VioletCort','Chrysanthemum','Date',
  'Grape','Eggplant','Pepper','Lemon',
  'PassionFruit','DragonFruit','Cacao','Lychee',
  'Ube','Sunflower','Dawnbreaker','Starweaver',
  'DawnCelestial','MoonCelestial',
];

const _idx = new Map(CROP_ORDER.map((k,i) => [k,i]));

// ── Sort modes ────────────────────────────────

export const PLANT_SORT_MODES = { JOURNAL:'journal', AZ:'az' };

// ── API ───────────────────────────────────────

const BASE   = 'https://mg-api.ariedam.fr';
const TTL_1H = 60 * 60 * 1000;

async function apiFetch(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`AriesMod ${path} → ${res.status}`);
  return res.json();
}

export const fetchPlants   = () => cacheGet('aries:plants',    TTL_1H, () => apiFetch('/data/plants'));
export const fetchPets     = () => cacheGet('aries:pets',      TTL_1H, () => apiFetch('/data/pets'));
export const fetchMutations= () => cacheGet('aries:mutations', TTL_1H, () => apiFetch('/data/mutations'));
export const fetchEggs     = () => cacheGet('aries:eggs',      TTL_1H, () => apiFetch('/data/eggs'));

export async function refreshAll() {
  cacheClearAll();
  await Promise.all([fetchPlants(), fetchPets(), fetchMutations(), fetchEggs()]);
}

export async function getPlantsSorted(mode = PLANT_SORT_MODES.JOURNAL) {
  const data   = await fetchPlants();
  const plants = Object.entries(data).map(([key, val]) => ({ key, ...val }));
  if (mode === PLANT_SORT_MODES.AZ)
    return plants.sort((a,b) => (a.crop?.name ?? a.key).localeCompare(b.crop?.name ?? b.key));
  return plants.sort((a,b) => {
    const ai = _idx.has(a.key) ? _idx.get(a.key) : 9999;
    const bi = _idx.has(b.key) ? _idx.get(b.key) : 9999;
    return ai !== bi ? ai - bi : a.key.localeCompare(b.key);
  });
}

export async function getPetsSorted() {
  const [petsData, eggsData] = await Promise.all([fetchPets(), fetchEggs()]);
  const petEggMap = {};
  for (const [eggName, egg] of Object.entries(eggsData))
    for (const petName of Object.keys(egg.faunaSpawnWeights ?? {}))
      if (!petEggMap[petName] || egg.coinPrice < petEggMap[petName].eggCoinPrice)
        petEggMap[petName] = { eggName, eggCoinPrice: egg.coinPrice ?? 0 };
  return Object.entries(petsData)
    .map(([key,val]) => ({ key,...val, eggName:petEggMap[key]?.eggName??'Unknown', eggPrice:petEggMap[key]?.eggCoinPrice??9999 }))
    .sort((a,b) => a.eggPrice - b.eggPrice || a.key.localeCompare(b.key));
}
