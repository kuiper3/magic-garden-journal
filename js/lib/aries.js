// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.7.0 — composed sprites, rich metadata
// ═══════════════════════════════════════════════

import { get as cacheGet, clearAll as cacheClearAll } from './cache.js';

const BASE   = 'https://mg-api.ariedam.fr';
const TTL_1H = 60 * 60 * 1000;

// ── Variant order (matches in-game journal) ────

export const CROP_VARIANTS = [
  'Normal',
  'Wet', 'Chilled', 'Frozen',
  'Dawnlit', 'Amberlit', 'Thunderstruck',
  'Gold', 'Rainbow',
  'Dawnbound', 'Amberbound',
  'MaxWeight',
];

export const PET_VARIANTS = ['Normal', 'Gold', 'Rainbow', 'MaxWeight'];

// Our journal variant name → AriesMod's composed-sprite mutation parameter
// AriesMod uses: Ambershine (we say Amberlit), Dawncharged (we say Dawnbound),
//                Ambercharged (we say Amberbound). Gold/Rainbow/Wet/Chilled/Frozen/
//                Thunderstruck/Dawnlit are the same.
export const MUTATION_API_NAME = {
  Normal:        null,
  Wet:           'Wet',
  Chilled:       'Chilled',
  Frozen:        'Frozen',
  Dawnlit:       'Dawnlit',
  Amberlit:      'Ambershine',
  Thunderstruck: 'Thunderstruck',
  Gold:          'Gold',
  Rainbow:       'Rainbow',
  Dawnbound:     'Dawncharged',
  Amberbound:    'Ambercharged',
  MaxWeight:     null, // no overlay — uses crop sprite at larger size
};

// ── Variant categories (for Conditions tab) ────

export const VARIANT_CATEGORIES = {
  'Weather': ['Wet', 'Chilled', 'Frozen', 'Thunderstruck'],
  'Lunar':   ['Dawnlit', 'Amberlit', 'Dawnbound', 'Amberbound'],
  'Colour':  ['Gold', 'Rainbow'],
  'Special': ['Normal', 'MaxWeight'],
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
  Common:    { color: '#9aa3ad', bg: '#525a63', label: 'COMMON' },
  Uncommon:  { color: '#ffffff', bg: '#3c8a47', label: 'UNCOMMON' },
  Rare:      { color: '#ffffff', bg: '#225e9a', label: 'RARE' },
  Legendary: { color: '#ffffff', bg: '#9a8030', label: 'LEGENDARY' },
  Mythical:  { color: '#ffffff', bg: '#6b3aa3', label: 'MYTHICAL' },
  Divine:    { color: '#ffffff', bg: '#a04830', label: 'DIVINE' },
  Celestial: { color: '#ffffff', bg: '#9a3a8a', label: 'CELESTIAL' },
};

// ── Acquisition ──────────────────────────────
// type: how to display the badge icon
// text: short readable note for modal/list
// source: longer description for tooltip

export const CROP_ACQUISITION = {
  // Standard seed shop crops are absent (they use a coin icon implicitly)
  Clover:         { type:'event-stpat', text:"St. Patrick's Day Event" },
  FourLeafClover: { type:'event-stpat', text:"St. Patrick's Day — chance when Clover planted" },
  Rose:           { type:'event-rose',  text:'Rose Day Event' },
  Delphinium:     { type:'carnival',    text:'Carnival Stand only' },
  Daisy:          { type:'dawn',        text:'Dawn Shop' },
  PurpleDaisy:    { type:'dawn',        text:'Dawn Shop' },
  Apple:          { type:'ios',         text:'iOS / Web App only' },
  Lavender:       { type:'dawn',        text:'Dawn Shop' },
  PineTree:       { type:'winter',      text:'Winter Event' },
  Banana:         { type:'discord',     text:'Discord (even Server ID)' },
  Squash:         { type:'carnival',    text:'Carnival Stand only' },
  Saffron:        { type:'dawn',        text:'Dawn Shop' },
  Poinsettia:     { type:'winter',      text:'Winter Event' },
  Date:           { type:'event-ramadan', text:'Ramadan Event' },
  Grape:          { type:'discord',     text:'Discord (Server ID ending in 1)' },
  Eggplant:       { type:'dawn',        text:'Dawn Shop' },
  Lemon:          { type:'discord',     text:'Discord (Server ID ending in 2)' },
  Lychee:         { type:'discord',     text:'Discord (Server ID ending in 2)' },
  Ube:            { type:'dawn',        text:'Dawn Shop' },
  Dawnbreaker:    { type:'dawn',        text:'Dawn Shop' },
};

// ── Seed Finder ability tier per rarity ────────
// SF I  = Common + Uncommon
// SF II = Rare + Legendary
// SF III = Mythical
// Divine and Celestial cannot be found by Seed Finder.
export function seedFinderTier(rarity) {
  if (rarity === 'Common' || rarity === 'Uncommon') return 'I';
  if (rarity === 'Rare'   || rarity === 'Legendary') return 'II';
  if (rarity === 'Mythical') return 'III';
  return null;
}

// ── Canonical crop order ──────────────────────

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

const _idx = new Map(CROP_ORDER.map((k, i) => [k, i]));

export const PLANT_SORT_MODES = { JOURNAL: 'journal', AZ: 'az' };

// ── Composed sprite URL helpers ───────────────

/**
 * Build a URL for a composed crop sprite with mutation overlay.
 * Returns null for Normal/MaxWeight (which should use the base crop sprite).
 *
 * Example:
 *   composedSpriteUrl('Carrot', 'Wet')
 *   → 'https://mg-api.ariedam.fr/assets/sprites/composed?key=sprite/plant/Carrot&mutations=Wet'
 */
export function composedSpriteUrl(cropKey, variant, isTall = false) {
  const apiMutation = MUTATION_API_NAME[variant];
  const category = isTall ? 'tallplant' : 'plant';
  const baseKey  = `sprite/${category}/${cropKey}`;

  if (!apiMutation) {
    // Normal/MaxWeight: composed endpoint with no mutation = base sprite
    return `${BASE}/assets/sprites/composed?key=${encodeURIComponent(baseKey)}`;
  }
  return `${BASE}/assets/sprites/composed?key=${encodeURIComponent(baseKey)}&mutations=${apiMutation}`;
}

/** Tall plants need a different sprite category. Hard-coded list from game data. */
const TALL_PLANTS = new Set([
  'Cactus', 'Bamboo', 'PineTree', 'Sunflower', 'Starweaver',
  'DawnCelestial', 'MoonCelestial', 'Dawnbreaker', 'Saffron',
]);

export function isTallPlant(key) { return TALL_PLANTS.has(key); }

// ── API config ────────────────────────────────

async function apiFetch(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`AriesMod ${path} → ${res.status}`);
  return res.json();
}

export const fetchPlants    = () => cacheGet('aries:plants',    TTL_1H, () => apiFetch('/data/plants'));
export const fetchPets      = () => cacheGet('aries:pets',      TTL_1H, () => apiFetch('/data/pets'));
export const fetchMutations = () => cacheGet('aries:mutations', TTL_1H, () => apiFetch('/data/mutations'));
export const fetchEggs      = () => cacheGet('aries:eggs',      TTL_1H, () => apiFetch('/data/eggs'));
export const fetchWeathers  = () => cacheGet('aries:weathers',  TTL_1H, () => apiFetch('/data/weathers'));

export async function refreshAll() {
  cacheClearAll();
  await Promise.all([fetchPlants(), fetchPets(), fetchMutations(), fetchEggs()]);
}

export async function getPlantsSorted(mode = PLANT_SORT_MODES.JOURNAL) {
  const data = await fetchPlants();
  const plants = Object.entries(data).map(([key, val]) => ({ key, ...val }));
  if (mode === PLANT_SORT_MODES.AZ)
    return plants.sort((a, b) => (a.crop?.name ?? a.key).localeCompare(b.crop?.name ?? b.key));
  return plants.sort((a, b) => {
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
    .map(([key, val]) => ({ key, ...val, eggName: petEggMap[key]?.eggName ?? 'Unknown', eggPrice: petEggMap[key]?.eggCoinPrice ?? 9999 }))
    .sort((a, b) => a.eggPrice - b.eggPrice || a.key.localeCompare(b.key));
}
