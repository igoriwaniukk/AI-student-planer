import { describe, it, expect } from 'vitest';
import { shouldAutoShow, formatPrice, yearlySaving, DEFAULT_PRICES } from './premium';

const DAY = 86400000;
const now = Date.UTC(2026, 9, 20, 12);
const old = { now, createdAt: now - 10 * DAY, lastShown: null, lastOpenShown: null };

describe('when the payment screen may open by itself', () => {
  it('always at a used-up limit, even for brand-new students', () => {
    expect(shouldAutoShow('limit', { ...old, createdAt: now - 1000, lastShown: now - 1000 })).toBe(true);
  });

  it('never in the first two days after signing up', () => {
    expect(shouldAutoShow('win', { ...old, createdAt: now - DAY })).toBe(false);
    expect(shouldAutoShow('open', { ...old, createdAt: now - 1.9 * DAY })).toBe(false);
    expect(shouldAutoShow('win', { ...old, createdAt: now - 2.1 * DAY })).toBe(true);
  });

  it('at most once a day', () => {
    expect(shouldAutoShow('win', { ...old, lastShown: now - 5 * 3600000 })).toBe(false);
    expect(shouldAutoShow('win', { ...old, lastShown: now - 25 * 3600000 })).toBe(true);
  });

  it('on opening the app at most every three days', () => {
    expect(shouldAutoShow('open', { ...old, lastShown: now - 2 * DAY, lastOpenShown: now - 2 * DAY })).toBe(false);
    expect(shouldAutoShow('open', { ...old, lastShown: now - 2 * DAY, lastOpenShown: now - 3.1 * DAY })).toBe(true);
    // a "win" pop-up doesn't wait for the three days
    expect(shouldAutoShow('win', { ...old, lastShown: now - 2 * DAY, lastOpenShown: now - DAY - 1 })).toBe(true);
  });

  it('nothing for unknown moments', () => {
    expect(shouldAutoShow('settings', old)).toBe(false);
  });
});

describe('prices', () => {
  it('formats in the student’s language and works out the monthly share', () => {
    expect(formatPrice(DEFAULT_PRICES.yearly, 'en-US')).toBe('$59.99');
    expect(formatPrice(DEFAULT_PRICES.yearly, 'en-US', 12)).toBe('$5.00');
    expect(formatPrice({ price: 249.99, currency: 'PLN' }, 'pl-PL').replace(/\s/g, ' ')).toBe('249,99 zł');
  });

  it('works out the yearly saving', () => {
    expect(yearlySaving(DEFAULT_PRICES)).toBe(50);
    expect(yearlySaving({ yearly: { price: 120 }, monthly: { price: 10 } })).toBe(0);
    expect(yearlySaving(null)).toBe(0);
  });
});
