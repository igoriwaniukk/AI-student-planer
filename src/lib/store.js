import { useEffect, useState } from 'react';

const KEYS = {
  name: 'sp_name',
  schoolPlan: 'sp_schoolPlan',
  activities: 'sp_activities',
  profileDefaults: 'sp_profileDefaults',
  weeklyCapacityMinutes: 'sp_weeklyCapacityMinutes',
  energyLog: 'sp_energyLog',
  studyHistory: 'sp_studyHistory',
  recurringActivities: 'sp_recurringActivities',
  seenAchievements: 'sp_seenAchievements',
  lastSeenStreak: 'sp_lastSeenStreak',
  language: 'sp_language',
};

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export function useStudentName() {
  return useLocalStorage(KEYS.name, '');
}

export function useSchoolPlan() {
  return useLocalStorage(KEYS.schoolPlan, null);
}

export function useActivities() {
  return useLocalStorage(KEYS.activities, null);
}

// Collected during onboarding: everyday rhythm and study preferences used to
// seed each new daily plan, instead of asking the same questions every time.
export function useProfileDefaults() {
  return useLocalStorage(KEYS.profileDefaults, {
    studyTime: 'Wieczorem',
    bedtime: '22:30',
    wake: '6:30',
    energy: 'Normalna',
    pref: 'Wolny wieczór',
    prioritySubjects: [],
  });
}

// How many minutes/week the student wants to cap study time at — used to warn
// before a week gets overloaded rather than only reacting after the fact.
export function useWeeklyCapacity() {
  return useLocalStorage(KEYS.weeklyCapacityMinutes, 600);
}

// Real-world (not demo-day) log of energy check-ins: [{ at: ISOString, level }].
export function useEnergyLog() {
  return useLocalStorage(KEYS.energyLog, []);
}

// Real-world log of completed-study days, keyed by real ISO date, used for
// streaks and the weekly review: { "2026-09-04": { plannedMin, actualMin, completed } }.
export function useStudyHistory() {
  return useLocalStorage(KEYS.studyHistory, {});
}

// Weekly-repeating activities the student adds themselves (e.g. "Basen,
// Środa, 18:00, 60 min"): [{ id, name, day, start, dur }], matched by
// weekday name against every week rather than a single calendar date.
export function useRecurringActivities() {
  return useLocalStorage(KEYS.recurringActivities, []);
}

// Ids of achievements already shown as a celebratory popup — so an unlocked
// achievement is announced once, not on every reload.
export function useSeenAchievements() {
  return useLocalStorage(KEYS.seenAchievements, []);
}

// The streak value last shown to the student — compared against the live
// streak to detect a just-broken streak or a freshly-hit milestone.
export function useLastSeenStreak() {
  return useLocalStorage(KEYS.lastSeenStreak, 0);
}

// UI language, 'pl' or 'en'.
export function useLanguage() {
  return useLocalStorage(KEYS.language, 'pl');
}
