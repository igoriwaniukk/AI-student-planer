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
export async function pushToCloud(userId) {
  if (!isSupabaseConfigured || !userId) return;
  const data = readAllLocal();
  await supabase.from('user_data').upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
}

// Pulls the signed-in user's saved data down into localStorage. Returns
// whether a saved row actually existed (false for a brand-new account, so
// the caller knows to push the current local state up instead of reloading
// into an empty one).
export async function pullFromCloud(userId) {
  if (!isSupabaseConfigured || !userId) return false;
  const { data, error } = await supabase.from('user_data').select('data').eq('user_id', userId).maybeSingle();
  if (error || !data) return false;
  writeAllLocal(data.data || {});
  return true;
}
