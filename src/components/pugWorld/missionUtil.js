import { MISSIONS } from '../../lib/pugWorld/logic.js';

// A mission's progress (have / n) and the hours until missions reset.
export function missionProgress(state, m) {
  const [ev, n] = MISSIONS[m.id] || ['', 1];
  return { have: m.done ? n : Math.min(n, state.missions.counts[ev] || 0), n };
}

export function hoursToMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(1, Math.ceil((midnight - now) / 3600000));
}
