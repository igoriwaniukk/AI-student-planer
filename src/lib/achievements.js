// Achievement + level definitions, evaluated purely from persisted
// real-world data (studyHistory, energyLog, recurringActivities, points,
// streak) — never from the in-memory demo-day planner state — so unlocks
// are durable across reloads instead of resetting with the demo day.
export const ACHIEVEMENTS = [
  { id: 'first_day', icon: '🌱', title: 'Pierwszy krok', desc: 'Ukończ swój pierwszy pełny dzień nauki.', check: (s) => s.completedDays >= 1 },
  { id: 'streak_3', icon: '🔥', title: '3 dni z rzędu', desc: 'Utrzymaj serię 3 dni z ukończonym planem.', check: (s) => s.streak >= 3 },
  { id: 'streak_7', icon: '🔥', title: 'Tydzień nauki', desc: 'Utrzymaj serię 7 dni z ukończonym planem.', check: (s) => s.streak >= 7 },
  { id: 'energy_10', icon: '⚡', title: '10 zameldowań energii', desc: 'Zapisz swój poziom energii 10 razy.', check: (s) => s.energyCheckins >= 10 },
  { id: 'organized', icon: '🔁', title: 'Zorganizowany', desc: 'Dodaj swoje pierwsze cotygodniowe zajęcie.', check: (s) => s.recurringCount >= 1 },
  { id: 'points_100', icon: '⭐', title: '100 punktów', desc: 'Zdobądź 100 punktów.', check: (s) => s.points >= 100 },
];

export function computeUnlockedAchievements(stats) {
  return ACHIEVEMENTS.filter((a) => a.check(stats));
}

export const LEVELS = [
  { min: 0, title: 'Początkujący' },
  { min: 100, title: 'Zdyscyplinowany' },
  { min: 250, title: 'Wytrwały uczeń' },
  { min: 500, title: 'Mistrz planowania' },
  { min: 1000, title: 'Ekspert nauki' },
  { min: 2000, title: 'Legenda nauki' },
];

export function computeLevel(points) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) idx = i;
  }
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const progress = next ? Math.round(((points - current.min) / (next.min - current.min)) * 100) : 100;
  return { level: idx + 1, title: current.title, nextAt: next ? next.min : null, progress };
}
