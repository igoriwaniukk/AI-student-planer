// Achievement + level definitions, evaluated purely from persisted
// real-world data (studyHistory, energyLog, recurringActivities, points,
// streak) — never from the in-memory demo-day planner state — so unlocks
// are durable across reloads instead of resetting with the demo day.
export const ACHIEVEMENTS = [
  { id: 'first_day', icon: '🌱', titleKey: 'ach.first_day.title', descKey: 'ach.first_day.desc', check: (s) => s.completedDays >= 1 },
  { id: 'streak_3', icon: '🔥', titleKey: 'ach.streak_3.title', descKey: 'ach.streak_3.desc', check: (s) => s.streak >= 3 },
  { id: 'streak_7', icon: '🔥', titleKey: 'ach.streak_7.title', descKey: 'ach.streak_7.desc', check: (s) => s.streak >= 7 },
  { id: 'energy_10', icon: '⚡', titleKey: 'ach.energy_10.title', descKey: 'ach.energy_10.desc', check: (s) => s.energyCheckins >= 10 },
  { id: 'organized', icon: '🔁', titleKey: 'ach.organized.title', descKey: 'ach.organized.desc', check: (s) => s.recurringCount >= 1 },
  { id: 'points_100', icon: '⭐', titleKey: 'ach.points_100.title', descKey: 'ach.points_100.desc', check: (s) => s.points >= 100 },
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
