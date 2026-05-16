// ═══════════════════════════════════════════════
// Magic Garden Journal — js/lib/aries.js
// v0.8.0 — sourced entirely from mg-data.json
// All constants verified against live API dump.
// ═══════════════════════════════════════════════

import { get as cacheGet, clearAll as cacheClearAll } from './cache.js';

const BASE   = 'https://mg-api.ariedam.fr';
const TTL_1H = 60 * 60 * 1000;

// ── Variant order (matches in-game Garden Journal) ─

export const CROP_VARIANTS = [
  'Normal',
  'Wet', 'Chilled', 'Frozen',
  'Dawnlit', 'Amberlit', 'Thunderstruck',
  'Gold', 'Rainbow',
  'Dawnbound', 'Amberbound',
  'MaxWeight',
];

export const PET_VARIANTS = ['Normal', 'Gold', 'Rainbow', 'MaxWeight'];

// ── Variant categories (Conditions tab) ───────

export const VARIANT_CATEGORIES = {
  'Weather': ['Wet', 'Chilled', 'Frozen', 'Thunderstruck'],
  'Lunar':   ['Dawnlit', 'Amberlit', 'Dawnbound', 'Amberbound'],
  'Colour':  ['Gold', 'Rainbow'],
};

// ── Mutation API name mapping ─────────────────
// Our display name → AriesMod internal key (for composed endpoint)
// Source: mg-data.json mutations keys + spriteComposer.js

export const MUTATION_API_NAME = {
  Normal:        null,
  Wet:           'Wet',
  Chilled:       'Chilled',
  Frozen:        'Frozen',
  Thunderstruck: 'Thunderstruck',
  Dawnlit:       'Dawnlit',
  Amberlit:      'Ambershine',    // API key: Ambershine, display name: Amberlit
  Gold:          'Gold',
  Rainbow:       'Rainbow',
  Dawnbound:     'Dawncharged',   // API key: Dawncharged, display name: Dawnbound
  Amberbound:    'Ambercharged',  // API key: Ambercharged, display name: Amberbound
  MaxWeight:     null,
};

// ── Mutation sprite URLs ──────────────────────
// Source: mg-data.json mutations[key].sprite (stripped of ?v= query)
// Gold/Rainbow use ui/ path, weather/lunar use mutations/ path

export const MUTATION_SPRITES = {
  Gold:          `${BASE}/assets/sprites/ui/MutationGold.png`,
  Rainbow:       `${BASE}/assets/sprites/ui/MutationRainbow.png`,
  Wet:           `${BASE}/assets/sprites/mutations/Wet.png`,
  Chilled:       `${BASE}/assets/sprites/mutations/Chilled.png`,
  Frozen:        `${BASE}/assets/sprites/mutations/Frozen.png`,
  Thunderstruck: `${BASE}/assets/sprites/mutations/Thunderstruck.png`,
  Dawnlit:       `${BASE}/assets/sprites/mutations/Dawnlit.png`,
  Amberlit:      `${BASE}/assets/sprites/mutations/Amberlit.png`,
  Dawnbound:     `${BASE}/assets/sprites/mutations/Dawncharged.png`,
  Amberbound:    `${BASE}/assets/sprites/mutations/Ambercharged.png`,
};

// ── Weather sprites ───────────────────────────
// Source: mg-data.json weathers[key].sprite

export const WEATHER_SPRITES = {
  Rain:        `${BASE}/assets/sprites/ui/RainIcon.png`,
  Frost:       `${BASE}/assets/sprites/ui/FrostIcon.png`,
  Thunderstorm:`${BASE}/assets/sprites/ui/ThunderstormIcon.png`,
  Dawn:        `${BASE}/assets/sprites/ui/DawnIcon.png`,
  AmberMoon:   `${BASE}/assets/sprites/ui/AmberMoonIcon.png`,
  Sunny:       `${BASE}/assets/sprites/ui/SunnyIcon.png`,
};

// ── Rarity ────────────────────────────────────
// Source: mg-data.json plants[key].seed.rarity
// Note: API uses "Mythic" not "Mythical". We match the API exactly.

export const CROP_RARITY = {
  Carrot:'Common', Cabbage:'Common', Strawberry:'Common', Aloe:'Common', Beet:'Common',
  Clover:'Uncommon', Rose:'Uncommon', FavaBean:'Uncommon', Delphinium:'Uncommon',
  Blueberry:'Uncommon', Apple:'Uncommon', OrangeTulip:'Uncommon', Tomato:'Uncommon', Daisy:'Uncommon',
  FourLeafClover:'Legendary',  // API says Legendary (rare spawn, not Uncommon)
  Daffodil:'Rare', Corn:'Rare', Watermelon:'Rare', Pumpkin:'Rare',
  Echeveria:'Rare', Pear:'Rare', Gentian:'Rare', Lavender:'Rare',
  PurpleDaisy:'Legendary', Coconut:'Legendary', PineTree:'Legendary', Banana:'Legendary',
  Lily:'Legendary', Camellia:'Legendary', Squash:'Legendary', Peach:'Legendary',
  BurrosTail:'Legendary', Saffron:'Legendary',
  Mushroom:'Mythic', Cactus:'Mythic', Bamboo:'Mythic', Poinsettia:'Mythic',
  VioletCort:'Mythic', Chrysanthemum:'Mythic', Date:'Mythic', Grape:'Mythic', Eggplant:'Mythic',
  Pepper:'Divine', Lemon:'Divine', PassionFruit:'Divine', DragonFruit:'Divine',
  Cacao:'Divine', Lychee:'Divine', Ube:'Divine', Sunflower:'Divine',
  Dawnbreaker:'Celestial', Starweaver:'Celestial', DawnCelestial:'Celestial', MoonCelestial:'Celestial',
};

export const RARITY_META = {
  Common:    { bg: '#525a63', label: 'COMMON' },
  Uncommon:  { bg: '#3c8a47', label: 'UNCOMMON' },
  Rare:      { bg: '#225e9a', label: 'RARE' },
  Legendary: { bg: '#9a8030', label: 'LEGENDARY' },
  Mythic:    { bg: '#6b3aa3', label: 'MYTHIC' },
  Divine:    { bg: '#a04830', label: 'DIVINE' },
  Celestial: { bg: '#9a3a8a', label: 'CELESTIAL' },
};

// ── Acquisition ───────────────────────────────
// Source: mg-data.json plants[key].seed.eligibleShops + purchasable + wiki
// type drives the icon in icons.js

export const CROP_ACQUISITION = {
  // eligibleShops: ['Dawn'] — Dawn Shop
  Daisy:       { type: 'dawn',    text: 'Dawn Shop' },
  Lavender:    { type: 'dawn',    text: 'Dawn Shop' },
  Saffron:     { type: 'dawn',    text: 'Dawn Shop' },
  Eggplant:    { type: 'dawn',    text: 'Dawn Shop' },
  Ube:         { type: 'dawn',    text: 'Dawn Shop' },
  Dawnbreaker: { type: 'dawn',    text: 'Dawn Shop' },
  DawnCelestial:{ type: 'dawn',   text: 'Dawn Shop or Seed Shop' },

  // purchasable:false, eligibleShops:['Seed'] — event / special
  Clover:      { type: 'event-stpat',   text: "St. Patrick's Day Event" },
  Rose:        { type: 'event-rose',    text: 'Rose Day Event' },
  Delphinium:  { type: 'carnival',      text: 'Carnival Stand · Seed Finder I' },
  PineTree:    { type: 'winter',        text: 'Winter Event' },
  Squash:      { type: 'carnival',      text: 'Carnival Stand · Seed Finder II' },
  Poinsettia:  { type: 'winter',        text: 'Winter Event' },
  Date:        { type: 'event-ramadan', text: 'Ramadan Event' },
  Grape:       { type: 'discord',       text: 'Discord (Server ID ending in 1)' },
  Lemon:       { type: 'discord',       text: 'Discord (Server ID ending in 2)' },
  Lychee:      { type: 'discord',       text: 'Discord (Server ID ending in 2)' },
  Banana:      { type: 'discord',       text: 'Discord (even Server ID)' },
  Apple:       { type: 'ios',           text: 'iOS / Web App only' },

  // purchasable:false, eligibleShops:[] — no shop at all (random/special spawn)
  FourLeafClover: { type: 'chance',  text: 'Chance spawn when Clover is planted' },
  PurpleDaisy:    { type: 'dawn',    text: 'Dawn Shop (exclusive drop)' },
};

// ── Seed Finder tier ──────────────────────────
// Source: mg-data.json abilities SeedFinderI/II/III descriptions
// SF I  = Common, Uncommon
// SF II = Rare, Legendary
// SF III = Mythic
// Divine, Celestial cannot be found by Seed Finder

export function seedFinderTier(rarity) {
  if (rarity === 'Common'   || rarity === 'Uncommon')  return 'I';
  if (rarity === 'Rare'     || rarity === 'Legendary') return 'II';
  if (rarity === 'Mythic')                              return 'III';
  return null; // Divine, Celestial — not findable
}

// ── Tall plant detection ──────────────────────
// Tall plants use sprite/tallplant/ category internally.
// The composed endpoint handles this automatically based on plant metadata,
// so we just need to know which key format to use.
// Derived from mg-data.json plants where plant.tileTransformOrigin = 'bottom'
// (i.e. they anchor at the bottom and render taller than normal).

export const TALL_PLANT_KEYS = new Set([
  'Cactus', 'Bamboo', 'PineTree', 'Sunflower', 'Starweaver',
  'DawnCelestial', 'MoonCelestial', 'Dawnbreaker', 'Saffron',
  'VioletCort', 'Corn', 'Lavender',
]);

export function isTallPlant(key) { return TALL_PLANT_KEYS.has(key); }

// ── Composed sprite URL ───────────────────────
// Source: Aries API docs — GET /assets/sprites/composed?key=<key>&mutations=<list>
// The server auto-detects tall plants from metadata, so we always use sprite/plant/

export function composedSpriteUrl(cropKey, variant, _tallIgnored = false) {
  if (variant === 'Normal' || variant === 'MaxWeight') {
    return `${BASE}/assets/sprites/composed?key=${encodeURIComponent(`sprite/plant/${cropKey}`)}`;
  }
  const apiMutation = MUTATION_API_NAME[variant];
  if (!apiMutation) return `${BASE}/assets/sprites/composed?key=${encodeURIComponent(`sprite/plant/${cropKey}`)}`;
  return `${BASE}/assets/sprites/composed?key=${encodeURIComponent(`sprite/plant/${cropKey}`)}&mutations=${apiMutation}`;
}

// ── Canonical crop order ──────────────────────
// Source: in-game Garden Journal tab (verified from browser console output)

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

// ── API fetchers ──────────────────────────────

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
export const fetchAbilities = () => cacheGet('aries:abilities', TTL_1H, () => apiFetch('/data/abilities'));

export async function refreshAll() {
  cacheClearAll();
  await Promise.all([fetchPlants(), fetchPets(), fetchMutations(), fetchEggs()]);
}

// ── Sorted helpers ────────────────────────────

export async function getPlantsSorted(mode = PLANT_SORT_MODES.JOURNAL) {
  const data   = await fetchPlants();
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
