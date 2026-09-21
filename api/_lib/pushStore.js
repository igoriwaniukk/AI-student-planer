import { supabaseAdmin, supabaseAdminConfigured } from './supabaseAdmin.js';

// One row per subscribed device, keyed by the push subscription's endpoint
// URL — see supabase/schema.sql for the table + RLS. Async everywhere
// (unlike the old local-JSON-file version) since every call is now a real
// database round trip; every caller already awaits these.
export async function saveSubscription(subscription, state) {
  if (!supabaseAdminConfigured) return;
  await supabaseAdmin.from('push_subscriptions').upsert({ endpoint: subscription.endpoint, subscription, state: state || {}, tick: 0 });
}

// Merges rather than overwrites: the client only ever sends the fields it
// knows about (streak, hasUpcomingExam, reminders, lang, noPlanToday,
// tzOffsetMinutes) — a raw overwrite would wipe out lastRestartNudgeDate
// (see sendScheduledPushes in push.js), which only the server ever sets, on
// the very next unrelated client sync.
export async function updateState(endpoint, state) {
  if (!supabaseAdminConfigured) return false;
  const { data } = await supabaseAdmin.from('push_subscriptions').select('state').eq('endpoint', endpoint).single();
  const merged = { ...(data?.state || {}), ...(state || {}) };
  const { error } = await supabaseAdmin.from('push_subscriptions').update({ state: merged }).eq('endpoint', endpoint);
  return !error;
}

// Used only by the server itself (see sendScheduledPushes) to record that
// today's restart nudge has already gone out, without going through the
// client-merge path above — the caller already has the fresh row in hand.
export async function setServerState(endpoint, state) {
  if (!supabaseAdminConfigured) return false;
  const { error } = await supabaseAdmin.from('push_subscriptions').update({ state: state || {} }).eq('endpoint', endpoint);
  return !error;
}

export async function removeSubscription(endpoint) {
  if (!supabaseAdminConfigured) return false;
  const { error } = await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return !error;
}

export async function allSubscriptions() {
  if (!supabaseAdminConfigured) return [];
  const { data, error } = await supabaseAdmin.from('push_subscriptions').select('subscription, state, tick');
  return error ? [] : data;
}

export async function bumpTick(endpoint, currentTick) {
  if (!supabaseAdminConfigured) return 0;
  const next = (currentTick || 0) + 1;
  const { error } = await supabaseAdmin.from('push_subscriptions').update({ tick: next }).eq('endpoint', endpoint);
  return error ? currentTick || 0 : next;
}
