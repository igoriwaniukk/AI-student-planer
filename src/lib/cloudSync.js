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

// When the cloud copy was last saved, as this device last saw it (after its
// own pull or push). If the cloud's updated_at has moved on since, another
// device saved in between — so this device must not blindly overwrite it.
const CLOUD_STAMP = 'sp_cloudUpdatedAt';

function readStamp() {
  try { return localStorage.getItem(CLOUD_STAMP); } catch { return null; }
}
function writeStamp(stamp) {
  try { if (stamp) localStorage.setItem(CLOUD_STAMP, stamp); } catch { /* storage unavailable */ }
}

// Another device's newer copy wins, except the running histories, which are
// combined so neither side's study days or check-ins get lost.
function mergeCopies(local, remote) {
  const merged = { ...local, ...remote };
  const lh = local.studyHistory || {};
  const rh = remote.studyHistory || {};
  const history = { ...lh, ...rh };
  Object.keys(lh).forEach((day) => {
    if (rh[day]) history[day] = { ...lh[day], ...rh[day], completed: !!(lh[day].completed || rh[day].completed) };
  });
  merged.studyHistory = history;
  const log = new Map();
  (local.energyLog || []).concat(remote.energyLog || []).forEach((e) => { if (e?.at) log.set(e.at, e); });
  merged.energyLog = [...log.values()].sort((x, y) => (x.at < y.at ? -1 : 1)).slice(-30);
  merged.energyCheckinCount = Math.max(local.energyCheckinCount || 0, remote.energyCheckinCount || 0);
  return merged;
}

// Every locally-stored field (see KEYS in store.js), bundled as one JSON blob
// under the signed-in user's row — simplest possible shape for a
// single-profile app, and it means adding a new local field never needs a
// matching database migration.
//
// Before writing, it checks whether another device saved since this one last
// synced; if so the two copies are merged (see mergeCopies) and the result
// is written back to localStorage too — `conflict: true` tells the caller to
// reload so the app's in-memory state picks the merged copy up.
// Returns {ok, conflict?, error?}.
export async function pushToCloud(userId) {
  if (!isSupabaseConfigured || !userId) return { ok: true };
  try {
    const { data: row, error: readError } = await supabase.from('user_data').select('data, updated_at').eq('user_id', userId).maybeSingle();
    if (readError) return { ok: false, error: readError };
    let data = readAllLocal();
    const known = readStamp();
    // No stamp yet = synced before stamps existed; treat as up to date.
    const conflict = !!(row && known && row.updated_at && row.updated_at !== known);
    if (conflict) {
      data = mergeCopies(data, row.data || {});
      writeAllLocal(data);
    }
    const stamp = new Date().toISOString();
    const { error } = await supabase.from('user_data').upsert({ user_id: userId, data, updated_at: stamp });
    if (error) return { ok: false, error };
    writeStamp(stamp);
    return { ok: true, conflict };
  } catch (error) {
    return { ok: false, error };
  }
}

// Whether the cloud copy changed since this device last synced — a cheap
// check (no data) used when the app comes back to the foreground.
export async function cloudChangedSinceSync(userId) {
  if (!isSupabaseConfigured || !userId) return false;
  const known = readStamp();
  if (!known) return false;
  try {
    const { data: row, error } = await supabase.from('user_data').select('updated_at').eq('user_id', userId).maybeSingle();
    return !error && !!row?.updated_at && row.updated_at !== known;
  } catch {
    return false;
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
    const { data, error } = await supabase.from('user_data').select('data, updated_at').eq('user_id', userId).maybeSingle();
    if (error) return { ok: false, hadData: false, error };
    if (!data) return { ok: true, hadData: false };
    writeAllLocal(data.data || {});
    writeStamp(data.updated_at);
    return { ok: true, hadData: true };
  } catch (error) {
    return { ok: false, hadData: false, error };
  }
}
