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
// A fingerprint of each field as it was last synced, so a conflict can tell
// which fields this device changed since (those keep this device's version).
const SYNCED_HASHES = 'sp_cloudSyncedHashes';

function readStamp() {
  try { return localStorage.getItem(CLOUD_STAMP); } catch { return null; }
}
function writeStamp(stamp) {
  try { if (stamp) localStorage.setItem(CLOUD_STAMP, stamp); } catch { /* storage unavailable */ }
}

// The same moment can come back written differently — the app sends
// "…:30.123Z", Postgres answers "…:30.123+00:00" — so stamps are compared
// as points in time, not as text.
export function sameStamp(a, b) {
  if (a === b) return true;
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  return Number.isFinite(ta) && Number.isFinite(tb) && ta === tb;
}

function hashOf(value) {
  const str = JSON.stringify(value) ?? '';
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return String(h);
}
function readHashes() {
  try { return JSON.parse(localStorage.getItem(SYNCED_HASHES) || 'null'); } catch { return null; }
}
function writeHashes(data) {
  const out = {};
  Object.keys(data).forEach((k) => { out[k] = hashOf(data[k]); });
  try { localStorage.setItem(SYNCED_HASHES, JSON.stringify(out)); } catch { /* storage unavailable */ }
}

// Both devices saved since they last agreed. Fields this device changed
// since then keep this device's version; everything else takes the other
// device's newer copy. The running histories are always combined, so
// neither side's study days or check-ins get lost. Without fingerprints
// (synced by an older version) this device's copy counts as changed.
// `tookRemote` says whether anything from the other device came in.
export function mergeCopies(local, remote, hashes) {
  const changedHere = (k) => !hashes || hashes[k] !== hashOf(local[k]);
  const merged = { ...local };
  Object.keys(remote).forEach((k) => {
    if (local[k] === undefined || !changedHere(k)) merged[k] = remote[k];
  });
  const lh = local.studyHistory || {};
  const rh = remote.studyHistory || {};
  const history = { ...lh, ...rh };
  Object.keys(lh).forEach((day) => {
    if (rh[day]) history[day] = { ...lh[day], ...rh[day], completed: !!(lh[day].completed || rh[day].completed) };
  });
  if (local.studyHistory || remote.studyHistory) merged.studyHistory = history;
  const log = new Map();
  (local.energyLog || []).concat(remote.energyLog || []).forEach((e) => { if (e?.at) log.set(e.at, e); });
  if (local.energyLog || remote.energyLog) merged.energyLog = [...log.values()].sort((x, y) => (x.at < y.at ? -1 : 1)).slice(-30);
  if (local.energyCheckinCount != null || remote.energyCheckinCount != null) {
    merged.energyCheckinCount = Math.max(local.energyCheckinCount || 0, remote.energyCheckinCount || 0);
  }
  const tookRemote = Object.keys(merged).some((k) => hashOf(merged[k]) !== hashOf(local[k]));
  return { merged, tookRemote };
}

// Every locally-stored field (see KEYS in store.js), bundled as one JSON blob
// under the signed-in user's row — simplest possible shape for a
// single-profile app, and it means adding a new local field never needs a
// matching database migration.
//
// Before writing, it checks whether another device saved since this one last
// synced; if so the two copies are merged (see mergeCopies) and the result
// is written back to localStorage too — `tookRemote: true` tells the caller
// to reload so the app's in-memory state picks the other device's part up.
// Returns {ok, conflict?, tookRemote?, error?}.
export async function pushToCloud(userId) {
  if (!isSupabaseConfigured || !userId) return { ok: true };
  try {
    const { data: row, error: readError } = await supabase.from('user_data').select('data, updated_at').eq('user_id', userId).maybeSingle();
    if (readError) return { ok: false, error: readError };
    let data = readAllLocal();
    const known = readStamp();
    // No stamp yet = synced before stamps existed; treat as up to date.
    const conflict = !!(row && known && row.updated_at && !sameStamp(row.updated_at, known));
    let tookRemote = false;
    if (conflict) {
      const result = mergeCopies(data, row.data || {}, readHashes());
      data = result.merged;
      tookRemote = result.tookRemote;
      if (tookRemote) writeAllLocal(data);
    }
    const stamp = new Date().toISOString();
    const { error } = await supabase.from('user_data').upsert({ user_id: userId, data, updated_at: stamp });
    if (error) return { ok: false, error };
    writeStamp(stamp);
    writeHashes(data);
    return { ok: true, conflict, tookRemote };
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
    return !error && !!row?.updated_at && !sameStamp(row.updated_at, known);
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
    writeHashes(data.data || {});
    return { ok: true, hadData: true };
  } catch (error) {
    return { ok: false, hadData: false, error };
  }
}
