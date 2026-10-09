import { useSyncExternalStore } from 'react';
import { authedFetch } from './authFetch';
import { askApp, isNativeApp } from './nativeBridge';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Pulgo Premium on the website side: the status from /api/premium (is it
// switched on, is this student Premium, signed-up date), when the payment
// screen may pop up by itself, and buying/restoring through the iPhone app
// (RevenueCat lives in mobile/App.js). The server enforces the limits; this
// only decides what to show.

export const APP_STORE_URL = 'https://apps.apple.com/app/id6820208316';
export const MANAGE_SUBSCRIPTION_URL = 'https://apps.apple.com/account/subscriptions';
// Apple's standard Terms of Use (EULA), required next to a subscription.
export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export const PAYWALL_EVENT = 'pulgo-paywall';
export { AI_LIMIT_EVENT } from './authFetch';
export const WIN_EVENT = 'pulgo-win';

// Shown until the app's own prices arrive (and on the website).
export const DEFAULT_PRICES = {
  yearly: { price: 59.99, currency: 'USD' },
  monthly: { price: 9.99, currency: 'USD' },
};

let state = { loaded: false, enabled: false, premium: false, expiresAt: null, createdAt: null, usage: null };
const subscribers = new Set();
function set(next) {
  state = { ...state, ...next, loaded: true };
  subscribers.forEach((fn) => fn());
}

export function usePremium() {
  return useSyncExternalStore((fn) => { subscribers.add(fn); return () => subscribers.delete(fn); }, () => state);
}

// sync: ask the server to re-check RevenueCat first (right after a purchase).
export async function refreshPremium({ sync = false } = {}) {
  try {
    const res = await authedFetch('/api/premium', sync
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'sync' }) }
      : {});
    if (!res.ok) return state;
    const data = await res.json();
    set({ enabled: !!data.enabled, premium: !!data.premium, expiresAt: data.expiresAt || null, createdAt: data.createdAt || null, usage: data.usage || null });
  } catch { /* offline: keep what we had */ }
  return state;
}

export function openPaywall(reason = 'manual') {
  window.dispatchEvent(new CustomEvent(PAYWALL_EVENT, { detail: { reason } }));
}

// ── When the payment screen may open by itself ──────────────────────────
// At most once a day; never in the first two days after signing up; when
// the app opens, at most every three days; always when a limit is hit.
const LAST_SHOWN_KEY = 'sp_paywallLastShown';
const LAST_OPEN_KEY = 'sp_paywallLastOpenShown';
const FIRST_SEEN_KEY = 'sp_firstSeen';
const DAY = 86400000;

export function shouldAutoShow(trigger, { now, createdAt, lastShown, lastOpenShown }) {
  if (trigger === 'limit') return true;
  if (createdAt && now - createdAt < 2 * DAY) return false;
  if (lastShown && now - lastShown < DAY) return false;
  if (trigger === 'open' && lastOpenShown && now - lastOpenShown < 3 * DAY) return false;
  return trigger === 'open' || trigger === 'win';
}

const readNum = (k) => { try { return Number(localStorage.getItem(k)) || null; } catch { return null; } };
const writeNum = (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* storage blocked */ } };

// The server's sign-up date when we have it, otherwise the first day this
// device saw the app.
function signedUpAt() {
  const server = state.createdAt ? Date.parse(state.createdAt) : NaN;
  if (!Number.isNaN(server)) return server;
  let first = readNum(FIRST_SEEN_KEY);
  if (!first) { first = Date.now(); writeNum(FIRST_SEEN_KEY, first); }
  return first;
}

export function maybeAutoShow(trigger, reason = trigger) {
  if (!state.enabled || state.premium) return false;
  const now = Date.now();
  if (!shouldAutoShow(trigger, { now, createdAt: signedUpAt(), lastShown: readNum(LAST_SHOWN_KEY), lastOpenShown: readNum(LAST_OPEN_KEY) })) return false;
  writeNum(LAST_SHOWN_KEY, now);
  if (trigger === 'open') writeNum(LAST_OPEN_KEY, now);
  openPaywall(reason);
  return true;
}

// ── Buying through the iPhone app ───────────────────────────────────────
// An app build from before Premium answers { error: 'unknown' }.
async function userId() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id || null;
}

export function canBuyHere() {
  return isNativeApp();
}

// Localised prices from the App Store, or null.
export async function loadStorePrices() {
  if (!isNativeApp()) return null;
  const r = await askApp('premium-offerings', {}, 15000);
  if (!r || r.error || r.timeout || !r.yearly || !r.monthly) return null;
  return { yearly: r.yearly, monthly: r.monthly };
}

// Resolves to 'done' | 'cancelled' | 'update' (old app build) | 'error'.
export async function buyPremium(plan) {
  const r = await askApp('premium-purchase', { plan, userId: await userId() });
  if (r?.error === 'unknown') return 'update';
  if (r?.cancelled) return 'cancelled';
  if (!r?.ok) return 'error';
  await refreshPremium({ sync: true });
  return 'done';
}

// Resolves to 'restored' | 'none' | 'update' | 'error'.
export async function restorePremium() {
  const r = await askApp('premium-restore', { userId: await userId() });
  if (r?.error === 'unknown') return 'update';
  if (!r || r.error || r.timeout) return 'error';
  const s = await refreshPremium({ sync: true });
  return r.premium || s.premium ? 'restored' : 'none';
}

// "$59.99", "59,99 zł"… from a { price, currency } pair.
export function formatPrice(p, locale, divideBy = 1) {
  if (!p) return '';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: p.currency || 'USD' }).format(p.price / divideBy);
  } catch {
    return (p.price / divideBy).toFixed(2);
  }
}

export function yearlySaving(prices) {
  const y = prices?.yearly?.price;
  const m = prices?.monthly?.price;
  if (!y || !m) return 0;
  return Math.max(0, Math.round((1 - y / (m * 12)) * 100));
}
