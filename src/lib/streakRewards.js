import { localDateKey } from './plannerLogic.js';

// Streak rewards (Premium): streak freezes. Earned by studying — every
// SESSIONS_PER_FREEZE finished sessions give one, up to MAX_FREEZES — plus
// one as a gift at each milestone. `badges` records the milestones already
// reached, so each one is celebrated and rewarded only once. A missed day is covered automatically: it's marked
// `frozen` in studyHistory, which keeps the run going without adding to it
// (see computeStreak). Kept as { freezes, progress, badges } under
// KEYS.streakRewards, synced with the account like the rest.

export const STREAK_MILESTONES = [7, 10, 30, 50, 100, 200, 365];
export const MAX_FREEZES = 3;
export const SESSIONS_PER_FREEZE = 3;
export const SESSION_DONE_EVENT = 'pulgo-session-done';
export const EMPTY_REWARDS = { freezes: 0, progress: 0, badges: [] };

export function normalizeRewards(r) {
  const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
  return {
    freezes: Math.min(MAX_FREEZES, n(r?.freezes)),
    progress: Math.min(SESSIONS_PER_FREEZE - 1, n(r?.progress)),
    badges: Array.isArray(r?.badges) ? r.badges.filter((b) => STREAK_MILESTONES.includes(b)) : [],
  };
}

// One more finished session: progress towards the next freeze, or a new
// freeze. With the maximum already held, nothing is collected.
export function addSession(rewards) {
  const r = normalizeRewards(rewards);
  if (r.freezes >= MAX_FREEZES) return { ...r, progress: 0 };
  const progress = r.progress + 1;
  return progress >= SESSIONS_PER_FREEZE ? { ...r, freezes: r.freezes + 1, progress: 0 } : { ...r, progress };
}

// The missed days (newest first) right before today that freezes can cover
// to keep a running streak alive — empty when there's nothing to save, or
// not enough freezes for the whole gap.
export function missedDaysToFreeze(studyHistory, freezes, today = new Date()) {
  if (!freezes) return [];
  const h = studyHistory || {};
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  const missed = [];
  for (let i = 0; i <= freezes; i++) {
    const entry = h[localDateKey(d)];
    if (entry?.completed || entry?.frozen) return missed.length && missed.length <= freezes ? missed : [];
    missed.push(localDateKey(d));
    d.setDate(d.getDate() - 1);
  }
  return [];
}

// Milestones reached (by the best run so far) that aren't recorded yet.
export function newMilestones(badges, best) {
  return STREAK_MILESTONES.filter((m) => m <= best && !(badges || []).includes(m));
}
