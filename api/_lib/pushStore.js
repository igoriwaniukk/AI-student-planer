import { supabaseAdmin, supabaseAdminConfigured } from './supabaseAdmin.js';

// One row per subscribed device, keyed by the push subscription's endpoint
// URL — see supabase/schema.sql for the table + RLS. Async everywhere
// (unlike the old local-JSON-file version) since every call is now a real
// database round trip; every caller already awaits these.
export async function saveSubscription(subscription, state) {
  if (!supabaseAdminConfigured) return;
  await supabaseAdmin.from('push_subscriptions').upsert({ endpoint: subscription.endpoint, subscription, state: state || {}, tick: 0 });
}

export async function updateState(endpoint, state) {
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
