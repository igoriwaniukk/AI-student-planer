import { describe, it, expect } from 'vitest';
import { DOGS, STARTERS, RARITIES, BREED_IDS } from './catalog';
import {
  EMPTY, normalize, CHEST_ODDS, rollRarity, addDog, openChest, addChest, dogPower, collectionScore, coinBonus,
  missionsFor, ensureDay, bumpMission, claimCalendar, canClaimCalendar, shopOffers, buyOutfit, buyChest, toggleOutfit,
  onSession, onPlan, onDayFinished, onStreak, onPremiumDay, chooseStarter, completedSets, breedDogs,
} from './logic';

const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

describe('catalog', () => {
  it('has 30 dogs: 15 common, 9 rare, 4 epic, 2 legendary, unique ids', () => {
    expect(DOGS.length).toBe(30);
    const count = (r) => DOGS.filter((d) => d.rarity === r).length;
    expect(RARITIES.map(count)).toEqual([15, 9, 4, 2]);
    expect(new Set(DOGS.map((d) => d.id)).size).toBe(30);
    STARTERS.forEach((id) => expect(DOGS.find((d) => d.id === id)?.rarity).toBe('common'));
  });
  it('chest chances add up to 100%', () => {
    Object.values(CHEST_ODDS).forEach((o) => expect(Object.values(o).reduce((a, b) => a + b, 0)).toBeCloseTo(100));
  });
});

describe('chests and dogs', () => {
  it('rolls rarities by the chances', () => {
    expect(rollRarity('small', () => 0.001)).toBe('legendary');
    expect(rollRarity('small', () => 0.99)).toBe('common');
    expect(rollRarity('epic', () => 0.99)).toBe('rare');
  });
  it('copies level a dog up, then turn into coins at max level', () => {
    let s = addDog(EMPTY, 'pug-fawn');
    expect(s.result).toBe('new');
    s = addDog(s.state, 'pug-fawn'); expect(s.result).toBe('copy');
    s = addDog(s.state, 'pug-fawn'); expect(s.result).toBe('levelUp'); expect(s.level).toBe(2);
    for (let i = 0; i < 3; i++) s = addDog(s.state, 'pug-fawn');
    s = addDog(s.state, 'pug-fawn'); expect(s.level).toBe(3);
    s = addDog(s.state, 'pug-fawn'); expect(s.result).toBe('coins'); expect(s.coins).toBeGreaterThan(0);
  });
  it('opens a chest: a dog, coins, maybe an outfit; the chest is used up', () => {
    const s = addChest(EMPTY, 'gold', 'test');
    const r = openChest(s, 'gold', seq(0.5, 0.1, 0.5, 0.1, 0.2));
    expect(r.state.chests).toHaveLength(0);
    expect(Object.keys(r.state.dogs)).toContain(r.dog);
    expect(r.coins).toBeGreaterThan(0);
    expect(openChest(EMPTY, 'gold')).toBeNull();
  });
  it('power grows with rarity and level; Epic/Legendary give a coin bonus', () => {
    expect(dogPower('corgi-golden', 1)).toBeGreaterThan(dogPower('pug-fawn', 3));
    const s = { ...EMPTY, dogs: { 'pug-fawn': { copies: 0, level: 1 }, 'corgi-golden': { copies: 0, level: 2 } } };
    expect(collectionScore(s)).toBe(dogPower('pug-fawn', 1) + dogPower('corgi-golden', 2));
    expect(coinBonus(s)).toBe(10);
  });
  it('completing a breed gives a set reward once', () => {
    const dogs = Object.fromEntries(breedDogs('pug').slice(0, -1).map((d) => [d.id, { copies: 0, level: 1 }]));
    const last = breedDogs('pug').at(-1);
    const s = addChest({ ...EMPTY, dogs }, 'small', 'x');
    const pugIndex = DOGS.filter((d) => d.rarity === last.rarity).indexOf(last);
    const rarityRoll = { common: 0.99, rare: 0.5, epic: 0.02, legendary: 0.001 }[last.rarity];
    const count = DOGS.filter((d) => d.rarity === last.rarity).length;
    const r = openChest(s, 'small', seq(rarityRoll, (pugIndex + 0.5) / count, 0.5, 0.99));
    expect(r.dog).toBe(last.id);
    expect(r.set).toBe('pug');
    expect(completedSets(r.state)).toContain('pug');
    expect(r.state.chests.some((c) => c.from === 'set')).toBe(true);
    expect(BREED_IDS.length).toBe(6);
  });
});

describe('daily', () => {
  it('3 different missions a day, one about studying', () => {
    const m = missionsFor('2026-11-13');
    expect(m).toHaveLength(3);
    expect(new Set(m).size).toBe(3);
    expect(m[0]).toMatch(/^session/);
    expect(missionsFor('2026-11-13')).toEqual(m);
  });
  it('missions pay coins and all 3 give a silver chest', () => {
    let s = ensureDay(EMPTY, '2026-11-13');
    s = { ...s, missions: { ...s.missions, items: [{ id: 'session', done: false }, { id: 'chest', done: false }, { id: 'dress', done: false }] } };
    s = bumpMission(s, 'session'); s = bumpMission(s, 'chest');
    expect(s.coins).toBe(30);
    s = bumpMission(s, 'dress');
    expect(s.missions.bonus).toBe(true);
    expect(s.chests.at(-1)).toMatchObject({ type: 'silver', from: 'missions' });
  });
  it('calendar: once a day, day 7 is a gold chest, missing a day never resets', () => {
    let s = EMPTY;
    for (let i = 1; i <= 6; i++) s = claimCalendar(s, '2026-11-0' + i).state;
    expect(canClaimCalendar(s, '2026-11-06')).toBe(false);
    const r = claimCalendar(s, '2026-11-20');
    expect(r.reward).toEqual({ chest: 'gold' });
    expect(r.state.calendar.day).toBe(7);
  });
  it('shop: 4 offers a day with one deal; buying needs coins', () => {
    const offers = shopOffers(EMPTY, '2026-11-13');
    expect(offers).toHaveLength(4);
    expect(offers.filter((o) => o.deal)).toHaveLength(1);
    expect(buyOutfit(EMPTY, '2026-11-13', offers[0].id)).toBeNull();
    const rich = { ...EMPTY, coins: 1000 };
    const after = buyOutfit(rich, '2026-11-13', offers[0].id);
    expect(after.outfits.owned).toContain(offers[0].id);
    expect(after.coins).toBe(1000 - offers[0].price);
    expect(buyChest(rich, 'small').chests).toHaveLength(1);
  });
  it('outfits: one per slot, tap again to take off', () => {
    let s = { ...EMPTY, dogs: { 'pug-fawn': { copies: 0, level: 1 } }, outfits: { owned: ['cap', 'beanie'], worn: {} } };
    s = toggleOutfit(s, 'pug-fawn', 'cap'); expect(s.outfits.worn['pug-fawn'].head).toBe('cap');
    s = toggleOutfit(s, 'pug-fawn', 'beanie'); expect(s.outfits.worn['pug-fawn'].head).toBe('beanie');
    s = toggleOutfit(s, 'pug-fawn', 'beanie'); expect(s.outfits.worn['pug-fawn'].head).toBeUndefined();
  });
});

describe('rewards from studying', () => {
  it('a session gives a chest and coins; a day and streak milestones only once', () => {
    let s = onSession(EMPTY);
    expect(s.chests).toHaveLength(1); expect(s.coins).toBe(20);
    s = onDayFinished(onDayFinished(s, '2026-11-13'), '2026-11-13');
    expect(s.chests.filter((c) => c.type === 'silver')).toHaveLength(1);
    s = onStreak(onStreak(s, 7), 7);
    expect(s.chests.filter((c) => c.type === 'gold')).toHaveLength(2);
    const coins = s.coins;
    s = onPlan(onPlan(s, '2026-11-13'), '2026-11-13');
    expect(s.coins).toBe(coins + 15);
    s = onPremiumDay(onPremiumDay(s, '2026-11-13'), '2026-11-13');
    expect(s.chests.filter((c) => c.from === 'premium')).toHaveLength(1);
  });
  it('the starter dog comes with a welcome chest, only for a new player', () => {
    const s = chooseStarter(EMPTY, 'corgi-red');
    expect(s.favorite).toBe('corgi-red');
    expect(s.chests).toHaveLength(1);
    expect(chooseStarter(s, 'pug-fawn')).toEqual(normalize(s));
  });
});
