// Signals between the planner and Pug World (see hooks/usePugWorld.js).
// A finished session uses SESSION_DONE_EVENT from streakRewards.js.
export const PLAN_DONE_EVENT = 'pulgo-plan-approved';
export const DAY_DONE_EVENT = 'pulgo-day-finished';
export const PUG_OPEN_EVENT = 'pulgo-open-pugworld';

// The dog game is launched: on for everyone (PUG_LAUNCHED). Settings → tap
// the Version row 7 times still switches it off / on for this device (kept
// out of KEYS on purpose, so it isn't synced): '0' = off, '1' = on.
// Setting PUG_LAUNCHED back to false hides it again for everyone who didn't
// turn it on themselves.
export const PUG_LAUNCHED = true;
export const PUG_PREVIEW_KEY = 'sp_pugPreview';
export const PUG_PREVIEW_EVENT = 'pulgo-pug-preview';
export function pugPreviewOn() {
  try {
    const v = localStorage.getItem(PUG_PREVIEW_KEY);
    return v === '1' || (v !== '0' && PUG_LAUNCHED);
  } catch { return PUG_LAUNCHED; }
}
export function setPugPreview(on) {
  try { localStorage.setItem(PUG_PREVIEW_KEY, on ? '1' : '0'); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(PUG_PREVIEW_EVENT));
}
// openPugWorld() opens My dogs; openPugWorld('shop') a tab of it;
// openPugWorld({ chest: id }) straight into that chest; openPugWorld({ dog: id })
// that dog up close. openMissions() opens the Missions page.
export const openPugWorld = (opts) => window.dispatchEvent(new CustomEvent(PUG_OPEN_EVENT, { detail: typeof opts === 'string' ? { tab: opts } : (opts || {}) }));
export const openMissions = () => openPugWorld({ page: 'missions' });
