import { supabaseAdmin, supabaseAdminConfigured } from './supabaseAdmin.js';

// Pulgo Premium: free accounts get a daily (exam prep: weekly) allowance of
// AI requests, Premium accounts are unlimited. Everything here is off until
// PREMIUM_ENABLED=true is set in Vercel, so the app behaves exactly as before
// until the App Store subscription is ready (see PREMIUM_SETUP.md).
//
// Usage is counted per user in public.ai_usage and Premium is stored in
// public.entitlements (supabase/schema.sql), both written only from here
// with the service-role key. RevenueCat tells us who is Premium, either by
// webhook or when the app asks us to sync right after a purchase.

export const FREE_LIMITS = {
  chat: { limit: 10, per: 'day' },
  plan: { limit: 1, per: 'day' },
  rescue: { limit: 1, per: 'day' },
  prep: { limit: 1, per: 'week' },
};
export const ENTITLEMENT_ID = 'premium';

export function premiumEnabled() {
  return process.env.PREMIUM_ENABLED === 'true';
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUserId = (id) => typeof id === 'string' && UUID.test(id);

// The student's own calendar date, so the allowance resets at their
// midnight. An unknown or missing time zone falls back to UTC.
export function localDay(timeZone, now = new Date()) {
  const fmt = (tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  try { return fmt(timeZone || 'UTC'); } catch { return fmt('UTC'); }
}

// 'd2026-10-09' for daily limits, 'w2026-10-05' (that week's Monday) for weekly ones.
export function periodKey(per, day) {
  if (per !== 'week') return 'd' + day;
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return 'w' + date.toISOString().slice(0, 10);
}

const active = (row) => !!row?.premium && (!row.expires_at || Date.parse(row.expires_at) > Date.now());

export async function getEntitlement(userId) {
  const { data, error } = await supabaseAdmin.from('entitlements').select('premium, expires_at').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return { premium: active(data), expiresAt: data?.expires_at || null };
}

// Lets one AI request through or not. Returns { allowed: true, release }
// where release() gives the use back if the AI call then fails, or
// { allowed: false, feature, limit, per } once the allowance is used up.
// Any database trouble lets the request through: a missing table must
// never take the AI features down.
export async function consumeAi(user, feature, timeZone) {
  const rule = FREE_LIMITS[feature];
  if (!premiumEnabled() || !user || !rule || !supabaseAdminConfigured) return { allowed: true, release: async () => {} };
  try {
    if ((await getEntitlement(user.id)).premium) return { allowed: true, premium: true, release: async () => {} };
    const args = { p_user: user.id, p_period: periodKey(rule.per, localDay(timeZone)), p_feature: feature };
    const { data, error } = await supabaseAdmin.rpc('consume_ai_usage', { ...args, p_limit: rule.limit });
    if (error) throw error;
    if (data < 0) return { allowed: false, feature, limit: rule.limit, per: rule.per };
    return {
      allowed: true,
      release: async () => { await supabaseAdmin.rpc('release_ai_usage', args).then(() => {}, () => {}); },
    };
  } catch (e) {
    console.error('[premium] usage check failed, letting the request through:', e?.message || e);
    return { allowed: true, release: async () => {} };
  }
}

// How much of each allowance is left today, for the app's status call.
export async function usageSummary(userId, timeZone) {
  const day = localDay(timeZone);
  const periods = Object.fromEntries(Object.entries(FREE_LIMITS).map(([f, r]) => [f, periodKey(r.per, day)]));
  const { data, error } = await supabaseAdmin.from('ai_usage').select('feature, period, count').eq('user_id', userId).in('period', [...new Set(Object.values(periods))]);
  if (error) throw error;
  return Object.fromEntries(Object.entries(FREE_LIMITS).map(([f, r]) => {
    const row = (data || []).find((x) => x.feature === f && x.period === periods[f]);
    return [f, { used: row?.count || 0, limit: r.limit, per: r.per }];
  }));
}

export async function saveEntitlement(userId, { premium, expiresAt = null, productId = null, source }) {
  const { error } = await supabaseAdmin.from('entitlements').upsert({
    user_id: userId, premium: !!premium, expires_at: expiresAt, product_id: productId, source, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Reads the subscriber straight from RevenueCat (the app logs purchases in
// under the Supabase user id) and stores whether "premium" is active.
export async function syncFromRevenueCat(userId, fetchImpl = fetch) {
  const key = process.env.REVENUECAT_SECRET_KEY;
  if (!key || !isUserId(userId)) return null;
  const res = await fetchImpl('https://api.revenuecat.com/v1/subscribers/' + encodeURIComponent(userId), {
    headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('RevenueCat answered ' + res.status);
  const ent = (await res.json())?.subscriber?.entitlements?.[ENTITLEMENT_ID];
  const expiresAt = ent?.expires_date || null;
  const premium = !!ent && (!expiresAt || Date.parse(expiresAt) > Date.now());
  await saveEntitlement(userId, { premium, expiresAt, productId: ent?.product_identifier || null, source: 'revenuecat' });
  return { premium, expiresAt };
}

function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// RevenueCat webhook: any change to a subscription (bought, renewed,
// cancelled, expired, refunded…) re-reads that user from RevenueCat, or uses
// the event itself when no secret key is set.
export async function handleRevenueCatWebhook(authorization, body, fetchImpl = fetch) {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
  if (!expected || !sameSecret(authorization || '', expected)) return { status: 401, body: { error: 'unauthorized' } };
  if (!supabaseAdminConfigured) return { status: 503, body: { error: 'database not configured' } };
  const ev = body?.event || {};
  const ids = [...new Set([ev.app_user_id, ev.original_app_user_id, ...(ev.aliases || [])].filter(isUserId))];
  try {
    for (const id of ids) {
      if (process.env.REVENUECAT_SECRET_KEY) {
        await syncFromRevenueCat(id, fetchImpl);
      } else if ((ev.entitlement_ids || []).includes(ENTITLEMENT_ID) || ev.type === 'EXPIRATION') {
        const exp = ev.expiration_at_ms ? new Date(ev.expiration_at_ms).toISOString() : null;
        const premium = ev.type !== 'EXPIRATION' && (!exp || Date.parse(exp) > Date.now());
        await saveEntitlement(id, { premium, expiresAt: exp, productId: ev.product_id || null, source: 'revenuecat-webhook' });
      }
    }
    return { status: 200, body: { ok: true, users: ids.length } };
  } catch (e) {
    console.error('[premium] webhook failed:', e?.message || e);
    return { status: 500, body: { error: 'webhook failed' } };
  }
}

// What the app needs to know: is Premium switched on, is this user Premium,
// how much is left, and when they signed up (no pop-ups in the first days).
export async function premiumStatus(user, timeZone) {
  if (!premiumEnabled()) return { enabled: false };
  const base = { enabled: true, premium: false, expiresAt: null, createdAt: user?.created_at || null, usage: null };
  if (!user || !supabaseAdminConfigured) return base;
  try {
    const ent = await getEntitlement(user.id);
    return { ...base, ...ent, usage: ent.premium ? null : await usageSummary(user.id, timeZone) };
  } catch (e) {
    console.error('[premium] status failed:', e?.message || e);
    return base;
  }
}
