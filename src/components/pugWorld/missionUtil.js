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

export const MISSION_ICON = { session: '📖', session2: '📚', min30: '⏱️', min45: '⏱️', task: '✅', task3: '✅', chest: '🎁', chest2: '🎁', dress: '👕', plan: '🗓️', trick: '✨', album: '📒' };
export const MISSION_TINT = { session: '#2ee6c5', session2: '#2ee6c5', min30: '#2ee6c5', min45: '#2ee6c5', task: '#35d07f', task3: '#35d07f', chest: '#f5a524', chest2: '#f5a524', dress: '#ff7eb6', plan: '#a58cff', trick: '#ffd166', album: '#5aa9ff' };

// "27 / 45 min" for the minutes missions, "1 / 2" for the others.
export function missionLabel(id, have, n) {
  return have + ' / ' + n + (MISSIONS[id]?.[0] === 'minutes' ? ' min' : '');
}
