import { supabase, isSupabaseConfigured } from './supabaseClient';
import { KEYS } from './store';

function readAllLocal() {
  const out = {};
  Object.entries(KEYS).forEach(([name, storageKey]) => {
    const raw = localStorage.getItem(storageKey);
    if (raw != null) {
      try {
        out[name] = JSON.parse(raw);
      } catch {
        // skip a corrupted entry rather than fail the whole sync
      }
    }
  });
  return out;
}

function writeAllLocal(data) {
  Object.entries(KEYS).forEach(([name, storageKey]) => {
    if (data[name] !== undefined) localStorage.setItem(storageKey, JSON.stringify(data[name]));
  });
}

// Every locally-stored field (see KEYS in store.js), bundled as one JSON blob
// under the signed-in user's row — simplest possible shape for a
// single-profile app, and it means adding a new local field never needs a
// matching database migration.
//
// Returns {ok: true} on success or {ok: false, error} on failure (network
// drop, RLS misconfiguration, Supabase outage) — callers surface this
// instead of the previous behavior of silently discarding the failure,
// which could leave a device's changes never synced with no indication.
export async function pushToCloud(userId) {
  if (!isSupabaseConfigured || !userId) return { ok: true };
  const data = readAllLocal();
  try {
    const { error } = await supabase.from('user_data').upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
    return error ? { ok: false, error } : { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

// Pulls the signed-in user's saved data down into localStorage. Resolves to
// {ok, hadData, error?} — hadData tells the caller whether a saved row
// actually existed (false for a brand-new account, so it knows to push the
// current local state up instead of reloading into an empty one); ok
// distinguishes "no data yet" from "the request itself failed".
export async function pullFromCloud(userId) {
  if (!isSupabaseConfigured || !userId) return { ok: true, hadData: false };
  try {
    const { data, error } = await supabase.from('user_data').select('data').eq('user_id', userId).maybeSingle();
    if (error) return { ok: false, hadData: false, error };
    if (!data) return { ok: true, hadData: false };
    writeAllLocal(data.data || {});
    return { ok: true, hadData: true };
  } catch (error) {
    return { ok: false, hadData: false, error };
  }
}
