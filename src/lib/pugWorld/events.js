// Signals between the planner and Pug World (see hooks/usePugWorld.js).
// A finished session uses SESSION_DONE_EVENT from streakRewards.js.
export const PLAN_DONE_EVENT = 'pulgo-plan-approved';
export const DAY_DONE_EVENT = 'pulgo-day-finished';
export const PUG_OPEN_EVENT = 'pulgo-open-pugworld';

// Pug World is hidden until it launches: Settings → tap the Version row 7
// times turns this on for this device (kept out of KEYS on purpose, so it
// isn't synced and stays a per-device preview).
export const PUG_PREVIEW_KEY = 'sp_pugPreview';
export const PUG_PREVIEW_EVENT = 'pulgo-pug-preview';
export function pugPreviewOn() {
  try { return localStorage.getItem(PUG_PREVIEW_KEY) === '1'; } catch { return false; }
}
export function setPugPreview(on) {
  try { if (on) localStorage.setItem(PUG_PREVIEW_KEY, '1'); else localStorage.removeItem(PUG_PREVIEW_KEY); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(PUG_PREVIEW_EVENT));
}
export const openPugWorld = (tab) => window.dispatchEvent(new CustomEvent(PUG_OPEN_EVENT, { detail: { tab } }));
