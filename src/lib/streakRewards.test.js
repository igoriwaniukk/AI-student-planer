import { describe, it, expect } from 'vitest';
import { addSession, missedDaysToFreeze, newMilestones, normalizeRewards, MAX_FREEZES } from './streakRewards';
import { computeStreak, bestStreak, localDateKey } from './plannerLogic';

const dayKey = (back) => { const d = new Date(); d.setDate(d.getDate() - back); return localDateKey(d); };
const hist = (spec) => Object.fromEntries(Object.entries(spec).map(([back, v]) => [dayKey(Number(back)), v]));

describe('addSession', () => {
  it('gives a freeze every 3 sessions', () => {
    let r = normalizeRewards(null);
    r = addSession(r); r = addSession(r);
    expect(r).toMatchObject({ freezes: 0, progress: 2 });
    r = addSession(r);
    expect(r).toMatchObject({ freezes: 1, progress: 0 });
  });
  it('stops at the maximum', () => {
    const r = addSession({ freezes: MAX_FREEZES, progress: 0, badges: [] });
    expect(r).toMatchObject({ freezes: MAX_FREEZES, progress: 0 });
  });
  it('cleans up broken stored values', () => {
    expect(normalizeRewards({ freezes: 9, progress: -1, badges: [7, 'x', 8] })).toEqual({ freezes: 3, progress: 0, badges: [7] });
  });
});

describe('missedDaysToFreeze', () => {
  it('covers a missed yesterday when the streak was alive before it', () => {
    expect(missedDaysToFreeze(hist({ 2: { completed: true } }), 1)).toEqual([dayKey(1)]);
  });
  it('covers a two-day gap only with two freezes', () => {
    const h = hist({ 3: { completed: true } });
    expect(missedDaysToFreeze(h, 1)).toEqual([]);
    expect(missedDaysToFreeze(h, 2)).toEqual([dayKey(1), dayKey(2)]);
  });
  it('does nothing when yesterday was studied or there is no streak', () => {
    expect(missedDaysToFreeze(hist({ 1: { completed: true } }), 3)).toEqual([]);
    expect(missedDaysToFreeze({}, 3)).toEqual([]);
    expect(missedDaysToFreeze(hist({ 2: { completed: true } }), 0)).toEqual([]);
  });
});

describe('frozen days in the streak', () => {
  it('keep the run going without counting', () => {
    const h = hist({ 0: { completed: true }, 1: { frozen: true }, 2: { completed: true }, 3: { completed: true } });
    expect(computeStreak(h)).toBe(3);
    expect(bestStreak(h)).toBe(3);
  });
});

describe('newMilestones', () => {
  it('lists reached milestones without a badge', () => {
    expect(newMilestones([7], 12)).toEqual([10]);
    expect(newMilestones([], 6)).toEqual([]);
  });
});
