import { useEffect, useState } from 'react';

const KEYS = {
  name: 'sp_name',
  schoolPlan: 'sp_schoolPlan',
  activities: 'sp_activities',
  profileDefaults: 'sp_profileDefaults',
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
