import { DOGS, DOG_BY_ID, BREED_IDS, OUTFITS, OUTFIT_BY_ID } from './catalog.js';

// Pug World's rules, pure and tested (logic.test.js). The whole game state
// is one object kept under KEYS.pugWorld (see hooks/usePugWorld.js):
//   dogs: { [dogId]: { copies, level } }   favorite, coins
//   chests: [{ id, type, from }]           outfits: { owned: [], worn: { [dogId]: { head, face, neck } } }
//   calendar: { day, last }                missions: { date, items: [{ id, done }], counts, bonus }
//   shop: { date, bought: [] }             sets: [breed]   rewarded: { streaks: [], days: [] }

export const EMPTY = {
  v: 1, dogs: {}, favorite: null, coins: 0, chests: [],
  outfits: { owned: [], worn: {} },
  calendar: { day: 0, last: null },
  missions: { date: null, items: [], counts: {}, bonus: false },
  shop: { date: null, bought: [] },
  sets: [], rewarded: { streaks: [], days: [], premium: null, plan: null },
};
export function normalize(s) {
  const x = s && typeof s === 'object' ? s : {};
  return {
    ...EMPTY, ...x,
    dogs: x.dogs && typeof x.dogs === 'object' ? x.dogs : {},
    chests: Array.isArray(x.chests) ? x.chests : [],
    coins: Number.isFinite(x.coins) ? Math.max(0, Math.floor(x.coins)) : 0,
    outfits: { owned: Array.isArray(x.outfits?.owned) ? x.outfits.owned : [], worn: x.outfits?.worn || {} },
    calendar: { ...EMPTY.calendar, ...(x.calendar || {}) },
    missions: { ...EMPTY.missions, ...(x.missions || {}) },
    shop: { ...EMPTY.shop, ...(x.shop || {}) },
    sets: Array.isArray(x.sets) ? x.sets : [],
    rewarded: { ...EMPTY.rewarded, ...(x.rewarded || {}) },
  };
}

// ---------- chests ----------
// Chances in percent; shown in the app ("Chances").
export const CHEST_ODDS = {
  small: { common: 75, rare: 22, epic: 2.7, legendary: 0.3 },
  silver: { common: 60, rare: 32, epic: 7, legendary: 1 },
  gold: { common: 35, rare: 45, epic: 16, legendary: 4 },
  epic: { common: 0, rare: 50, epic: 40, legendary: 10 },
};
const CHEST_COINS = { small: [10, 20], silver: [30, 50], gold: [80, 120], epic: [150, 220] };
const CHEST_OUTFIT = { small: 0.15, silver: 0.3, gold: 0.6, epic: 0.8 };
export const CHEST_PRICE = { small: 150, silver: 400 };

// Copies needed to reach each level (level 1 = owned). Max level 3.
export const LEVEL_COPIES = [0, 0, 2, 4];
export const MAX_LEVEL = 3;
const BASE_POWER = { common: 100, rare: 220, epic: 420, legendary: 900 };
const LEVEL_MULT = [0, 1, 1.3, 1.7];
const SPARE_COINS = { common: 30, rare: 80, epic: 200, legendary: 500 };
const PERK_PCT = { epic: 3, legendary: 5 };

let seq = 0;
export const chestId = () => Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);

export function rollRarity(type, rng = Math.random) {
  const odds = CHEST_ODDS[type] || CHEST_ODDS.small;
  let r = rng() * 100;
  for (const rar of ['legendary', 'epic', 'rare', 'common']) {
    if (odds[rar] <= 0) continue;
    if (r < odds[rar]) return rar;
    r -= odds[rar];
  }
  return Object.keys(odds).find((k) => odds[k] > 0) || 'common';
}
const pick = (list, rng) => list[Math.floor(rng() * list.length) % list.length];
const between = ([a, b], rng) => a + Math.floor(rng() * (b - a + 1));

// Adds one copy of a dog: new dog, a step towards the next level, a level
// up, or (already max level) coins instead.
export function addDog(state, dogId) {
  const s = normalize(state);
  const dog = DOG_BY_ID[dogId];
  const cur = s.dogs[dogId];
  if (!cur) return { state: { ...s, dogs: { ...s.dogs, [dogId]: { copies: 0, level: 1 } }, favorite: s.favorite || dogId }, result: 'new' };
  if (cur.level >= MAX_LEVEL) return { state: { ...s, coins: s.coins + SPARE_COINS[dog.rarity] }, result: 'coins', coins: SPARE_COINS[dog.rarity] };
  const copies = cur.copies + 1;
  if (copies >= LEVEL_COPIES[cur.level + 1]) return { state: { ...s, dogs: { ...s.dogs, [dogId]: { copies: 0, level: cur.level + 1 } } }, result: 'levelUp', level: cur.level + 1 };
  return { state: { ...s, dogs: { ...s.dogs, [dogId]: { ...cur, copies } } }, result: 'copy' };
}

// Opens the first waiting chest of a type (or the given id).
export function openChest(state, chestIdOrType, rng = Math.random) {
  const s = normalize(state);
  const i = s.chests.findIndex((c) => c.id === chestIdOrType || c.type === chestIdOrType);
  if (i < 0) return null;
  const chest = s.chests[i];
  const rarity = rollRarity(chest.type, rng);
  const dog = pick(DOGS.filter((x) => x.rarity === rarity), rng);
  const coins = Math.round(between(CHEST_COINS[chest.type] || CHEST_COINS.small, rng) * (1 + coinBonus(s) / 100));
  let next = { ...s, chests: s.chests.filter((_, j) => j !== i), coins: s.coins + coins };
  const added = addDog(next, dog.id);
  next = added.state;
  let outfit = null;
  const missing = OUTFITS.filter((o) => !next.outfits.owned.includes(o.id));
  if (missing.length && rng() < (CHEST_OUTFIT[chest.type] || 0)) {
    outfit = pick(missing, rng).id;
    next = { ...next, outfits: { ...next.outfits, owned: next.outfits.owned.concat(outfit) } };
  }
  next = bumpMission(next, 'chest');
  const set = completedSets(next).find((b) => !next.sets.includes(b));
  if (set) next = { ...next, sets: next.sets.concat(set), chests: next.chests.concat({ id: chestId(), type: 'gold', from: 'set' }), coins: next.coins + 200 };
  return { state: next, chest, dog: dog.id, rarity, result: added.result, level: added.level, spareCoins: added.coins || 0, coins, outfit, set: set || null };
}

export function addChest(state, type, from) {
  const s = normalize(state);
  return { ...s, chests: s.chests.concat({ id: chestId(), type, from }) };
}
export function addCoins(state, amount) {
  const s = normalize(state);
  return { ...s, coins: s.coins + Math.round(amount * (1 + coinBonus(s) / 100)) };
}

// ---------- power, score, perks ----------
export function dogPower(dogId, level = 1) {
  const dog = DOG_BY_ID[dogId];
  return dog ? Math.round(BASE_POWER[dog.rarity] * LEVEL_MULT[Math.min(MAX_LEVEL, Math.max(1, level))]) : 0;
}
export function collectionScore(state) {
  return Object.entries(normalize(state).dogs).reduce((a, [id, x]) => a + dogPower(id, x.level), 0);
}
export function dogPerk(dogId, level = 1) {
  const dog = DOG_BY_ID[dogId];
  return dog && PERK_PCT[dog.rarity] ? PERK_PCT[dog.rarity] * level : 0;
}
// Extra % coins from every Epic and Legendary dog owned (capped at 30%).
export function coinBonus(state) {
  return Math.min(30, Object.entries(normalize(state).dogs).reduce((a, [id, x]) => a + dogPerk(id, x.level), 0));
}

// ---------- sets ----------
export function breedDogs(breed) { return DOGS.filter((x) => x.breed === breed); }
export function completedSets(state) {
  const s = normalize(state);
  return BREED_IDS.filter((b) => breedDogs(b).every((x) => s.dogs[x.id]));
}

// ---------- daily: missions, calendar, shop ----------
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
// id → [event that counts, how many]
export const MISSIONS = {
  session: ['session', 1], session2: ['session', 2], chest: ['chest', 1], chest2: ['chest', 2],
  dress: ['dress', 1], plan: ['plan', 1], trick: ['trick', 1], album: ['album', 1],
};
export const MISSION_COINS = 15;
export function missionsFor(date) {
  const rng = seeded('m' + date);
  const study = rng() < 0.5 ? 'session' : 'session2';
  const pool = ['chest', 'chest2', 'dress', 'plan', 'trick', 'album'];
  const a = pool.splice(Math.floor(rng() * pool.length), 1)[0];
  const others = pool.filter((p) => MISSIONS[p][0] !== MISSIONS[a][0]);
  const b = others[Math.floor(rng() * others.length)];
  return [study, a, b];
}
export function ensureDay(state, date) {
  const s = normalize(state);
  let next = s;
  if (s.missions.date !== date) next = { ...next, missions: { date, items: missionsFor(date).map((id) => ({ id, done: false })), counts: {}, bonus: false } };
  if (s.shop.date !== date) next = { ...next, shop: { date, bought: [] } };
  return next;
}
// Counts an event (session, chest, dress, plan, trick, album) towards
// today's missions: coins per finished mission, a silver chest for all 3.
export function bumpMission(state, event) {
  const s = normalize(state);
  if (!s.missions.date) return s;
  const counts = { ...s.missions.counts, [event]: (s.missions.counts[event] || 0) + 1 };
  let coins = 0;
  const items = s.missions.items.map((m) => {
    const [ev, n] = MISSIONS[m.id] || [];
    if (!m.done && ev === event && counts[event] >= n) { coins += MISSION_COINS; return { ...m, done: true }; }
    return m;
  });
  let next = { ...s, coins: s.coins + coins, missions: { ...s.missions, counts, items } };
  if (!next.missions.bonus && items.length && items.every((m) => m.done)) {
    next = { ...next, missions: { ...next.missions, bonus: true }, chests: next.chests.concat({ id: chestId(), type: 'silver', from: 'missions' }) };
  }
  return next;
}

export const CALENDAR = [{ coins: 20 }, { chest: 'small' }, { coins: 40 }, { chest: 'small' }, { coins: 60 }, { chest: 'silver' }, { chest: 'gold' }];
export function canClaimCalendar(state, date) { return normalize(state).calendar.last !== date; }
// Missing a day never resets the calendar — it just waits for the next claim.
export function claimCalendar(state, date) {
  const s = normalize(state);
  if (s.calendar.last === date) return { state: s, reward: null };
  const reward = CALENDAR[s.calendar.day % 7];
  let next = { ...s, calendar: { day: s.calendar.day + 1, last: date } };
  next = reward.chest ? addChest(next, reward.chest, 'calendar') : { ...next, coins: next.coins + reward.coins };
  return { state: next, reward };
}

// Today's shop: 4 outfits (not owned yet when possible), one at half price.
export function shopOffers(state, date) {
  const s = normalize(state);
  const rng = seeded('s' + date);
  const notOwned = OUTFITS.filter((o) => !s.outfits.owned.includes(o.id));
  const list = (notOwned.length >= 4 ? notOwned : OUTFITS).slice().sort(() => rng() - 0.5).slice(0, 4);
  const deal = Math.floor(rng() * list.length);
  return list.map((o, i) => ({ id: o.id, price: i === deal ? Math.round(o.price / 2) : o.price, deal: i === deal }));
}
export function buyOutfit(state, date, outfitId) {
  const s = normalize(state);
  const offer = shopOffers(s, date).find((o) => o.id === outfitId);
  const price = offer ? offer.price : OUTFIT_BY_ID[outfitId]?.price;
  if (!price || s.coins < price || s.outfits.owned.includes(outfitId)) return null;
  return { ...s, coins: s.coins - price, outfits: { ...s.outfits, owned: s.outfits.owned.concat(outfitId) }, shop: { ...s.shop, bought: s.shop.bought.concat(outfitId) } };
}
export function buyChest(state, type) {
  const s = normalize(state);
  const price = CHEST_PRICE[type];
  if (!price || s.coins < price) return null;
  return addChest({ ...s, coins: s.coins - price }, type, 'shop');
}

// Puts an outfit on a dog (or takes it off when it's already worn).
export function toggleOutfit(state, dogId, outfitId) {
  const s = normalize(state);
  const o = OUTFIT_BY_ID[outfitId];
  if (!o || !s.outfits.owned.includes(outfitId) || !s.dogs[dogId]) return s;
  const worn = { ...(s.outfits.worn[dogId] || {}) };
  if (worn[o.slot] === outfitId) delete worn[o.slot]; else worn[o.slot] = outfitId;
  return bumpMission({ ...s, outfits: { ...s.outfits, worn: { ...s.outfits.worn, [dogId]: worn } } }, 'dress');
}

// ---------- rewards from studying ----------
export const SESSION_COINS = 20;
export const PLAN_COINS = 15;
export const DAY_COINS = 30;
export const STREAK_CHESTS = [3, 7, 14, 30, 50, 100];

export function onSession(state) {
  return bumpMission(addCoins(addChest(state, 'small', 'session'), SESSION_COINS), 'session');
}
// Approving a plan: coins once a day (re-approving can't farm them).
export function onPlan(state, date) {
  const s = normalize(state);
  if (s.rewarded.plan === date) return bumpMission(s, 'plan');
  return bumpMission(addCoins({ ...s, rewarded: { ...s.rewarded, plan: date } }, PLAN_COINS), 'plan');
}
// A finished day gives a silver chest once per date.
export function onDayFinished(state, date) {
  const s = normalize(state);
  if (s.rewarded.days.includes(date)) return s;
  return addCoins(addChest({ ...s, rewarded: { ...s.rewarded, days: s.rewarded.days.concat(date).slice(-40) } }, 'silver', 'day'), DAY_COINS);
}
// A gold chest the first time the streak reaches each milestone.
export function onStreak(state, streak) {
  let s = normalize(state);
  for (const m of STREAK_CHESTS) {
    if (streak >= m && !s.rewarded.streaks.includes(m)) s = addChest({ ...s, rewarded: { ...s.rewarded, streaks: s.rewarded.streaks.concat(m) } }, 'gold', 'streak');
  }
  return s;
}
// Premium: one bonus chest a day.
export function onPremiumDay(state, date) {
  const s = normalize(state);
  if (s.rewarded.premium === date) return s;
  return addChest({ ...s, rewarded: { ...s.rewarded, premium: date } }, 'small', 'premium');
}

export function chooseStarter(state, dogId) {
  const s = normalize(state);
  if (Object.keys(s.dogs).length) return s;
  return { ...s, dogs: { [dogId]: { copies: 0, level: 1 } }, favorite: dogId, chests: s.chests.concat({ id: chestId(), type: 'small', from: 'welcome' }) };
}
