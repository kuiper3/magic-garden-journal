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

// ── Composed sprite key map ───────────────────
// Some API plant keys don't match their sprite filename.
// Map: API key → sprite filename stem used in composed endpoint.
// Source: mg-data.json plants[key].crop.sprite URL stems.
// Keys NOT in this map use the API key directly (e.g. Carrot → sprite/plant/Carrot).

export const PLANT_SPRITE_KEY = {
  OrangeTulip:   'Tulip',
  Clover:        'CloverThreeLeaf',
  FourLeafClover:'CloverFourLeaf',
  Rose:          'RoseRed',
  PurpleDaisy:   'DaisyPurple',
  DawnCelestial: 'DawnCelestialCrop',
  MoonCelestial: 'MoonCelestialCrop',
};

// Updated composedSpriteUrl using the sprite key map
export function composedSpriteUrl(cropKey, variant, _tallIgnored = false) {
  const spriteKey = PLANT_SPRITE_KEY[cropKey] ?? cropKey;
  const key = `sprite/plant/${spriteKey}`;
  if (variant === 'Normal' || variant === 'MaxWeight' || !MUTATION_API_NAME[variant]) {
    return `${BASE}/assets/sprites/composed?key=${encodeURIComponent(key)}`;
  }
  return `${BASE}/assets/sprites/composed?key=${encodeURIComponent(key)}&mutations=${MUTATION_API_NAME[variant]}`;
}

// ── Static crop data ──────────────────────────
// Source: wiki + Aries explorer. grow/regrow in seconds. weights in kg.
// maxWeight = baseWeight × maxScale (from Aries explorer "Max Scale" column).

export const CROP_STATIC_DATA = {
  Carrot:        { grow: 4,      regrow: null,  baseWeight: 0.100, maxWeight: 0.300 },
  Cabbage:       { grow: 35,     regrow: 45,    baseWeight: 1.000, maxWeight: 3.000 },
  Strawberry:    { grow: 10,     regrow: null,  baseWeight: 0.050, maxWeight: 0.100 },
  Aloe:          { grow: 45,     regrow: null,  baseWeight: 1.500, maxWeight: 3.750 },
  Beet:          { grow: 60,     regrow: null,  baseWeight: 0.300, maxWeight: 0.900 },
  Clover:        { grow: 240,    regrow: null,  baseWeight: 0.010, maxWeight: 0.030 },
  FourLeafClover:{ grow: 240,    regrow: null,  baseWeight: 0.010, maxWeight: 0.030 },
  Rose:          { grow: 300,    regrow: null,  baseWeight: 0.010, maxWeight: 0.040 },
  FavaBean:      { grow: 240,    regrow: 900,   baseWeight: 0.030, maxWeight: 0.090 },
  Delphinium:    { grow: 25,     regrow: null,  baseWeight: 0.020, maxWeight: 0.060 },
  Blueberry:     { grow: 22,     regrow: 105,   baseWeight: 0.010, maxWeight: 0.020 },
  Apple:         { grow: 5400,   regrow: 21600, baseWeight: 0.180, maxWeight: 0.360 },
  OrangeTulip:   { grow: 8,      regrow: null,  baseWeight: 0.010, maxWeight: 0.030 },
  Tomato:        { grow: 40,     regrow: 1100,  baseWeight: 0.300, maxWeight: 0.600 },
  Daisy:         { grow: 60,     regrow: null,  baseWeight: 0.010, maxWeight: 0.025 },
  PurpleDaisy:   { grow: 60,     regrow: null,  baseWeight: 0.010, maxWeight: 0.025 },
  Daffodil:      { grow: 50,     regrow: null,  baseWeight: 0.010, maxWeight: 0.030 },
  Corn:          { grow: 30,     regrow: 130,   baseWeight: 1.200, maxWeight: 2.400 },
  Watermelon:    { grow: 720,    regrow: null,  baseWeight: 4.500, maxWeight: 13.500 },
  Pumpkin:       { grow: 2100,   regrow: null,  baseWeight: 6.000, maxWeight: 18.000 },
  Echeveria:     { grow: 120,    regrow: null,  baseWeight: 0.800, maxWeight: 2.200 },
  Pear:          { grow: 5400,   regrow: 21600, baseWeight: 0.170, maxWeight: 0.340 },
  Gentian:       { grow: 90,     regrow: null,  baseWeight: 0.020, maxWeight: 0.060 },
  Lavender:      { grow: 100,    regrow: null,  baseWeight: 0.020, maxWeight: 0.060 },
  Coconut:       { grow: 3600,   regrow: 43200, baseWeight: 5.000, maxWeight: 15.000 },
  PineTree:      { grow: 14400,  regrow: null,  baseWeight: 1000,  maxWeight: 3500 },
  Banana:        { grow: 4500,   regrow: 14400, baseWeight: 0.120, maxWeight: 0.204 },
  Lily:          { grow: 240,    regrow: null,  baseWeight: 0.020, maxWeight: 0.055 },
  Camellia:      { grow: 10800,  regrow: 86400, baseWeight: 0.300, maxWeight: 0.750 },
  Squash:        { grow: 200,    regrow: 1500,  baseWeight: 0.300, maxWeight: 0.750 },
  Peach:         { grow: 5400,   regrow: 7200,  baseWeight: 0.180, maxWeight: 0.540 },
  BurrosTail:    { grow: 100,    regrow: 1800,  baseWeight: 0.400, maxWeight: 1.000 },
  Saffron:       { grow: 180,    regrow: null,  baseWeight: 0.030, maxWeight: 0.090 },
  Mushroom:      { grow: 86400,  regrow: null,  baseWeight: 2.500, maxWeight: 8.750 },
  Cactus:        { grow: 9000,   regrow: null,  baseWeight: 1500,  maxWeight: 2700 },
  Bamboo:        { grow: 43200,  regrow: null,  baseWeight: 1.000, maxWeight: 2.000 },
  Poinsettia:    { grow: 5400,   regrow: 10800, baseWeight: 0.020, maxWeight: 0.040 },
  VioletCort:    { grow: 64800,  regrow: null,  baseWeight: 2.000, maxWeight: 7.000 },
  Chrysanthemum: { grow: 10800,  regrow: 86400, baseWeight: 0.010, maxWeight: 0.028 },
  Date:          { grow: 3600,   regrow: 64800, baseWeight: 0.020, maxWeight: 0.040 },
  Grape:         { grow: 900,    regrow: 86400, baseWeight: 3.000, maxWeight: 6.000 },
  Eggplant:      { grow: 7200,   regrow: 2700,  baseWeight: 0.500, maxWeight: 1.250 },
  Pepper:        { grow: 600,    regrow: 560,   baseWeight: 0.500, maxWeight: 1.000 },
  Lemon:         { grow: 3600,   regrow: 43200, baseWeight: 0.500, maxWeight: 1.500 },
  PassionFruit:  { grow: 2700,   regrow: 86400, baseWeight: 9.500, maxWeight: 19.000 },
  DragonFruit:   { grow: 900,    regrow: 1800,  baseWeight: 8.400, maxWeight: 16.800 },
  Cacao:         { grow: 5400,   regrow: 86400, baseWeight: 0.500, maxWeight: 1.250 },
  Lychee:        { grow: 1800,   regrow: 86400, baseWeight: 9.000, maxWeight: 18.000 },
  Ube:           { grow: 3600,   regrow: null,  baseWeight: 3.500, maxWeight: 10.500 },
  Sunflower:     { grow: 18000,  regrow: 86400, baseWeight: 10.000, maxWeight: 25.000 },
  Dawnbreaker:   { grow: 172800, regrow: null,  baseWeight: 100,   maxWeight: 300 },
  Starweaver:    { grow: 86400,  regrow: 86400, baseWeight: 10.000, maxWeight: 20.000 },
  DawnCelestial: { grow: 86400,  regrow: 86400, baseWeight: 6.000,  maxWeight: 15.000 },
  MoonCelestial: { grow: 86400,  regrow: 86400, baseWeight: 2.000,  maxWeight: 4.000 },
};
