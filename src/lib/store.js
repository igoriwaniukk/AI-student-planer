import { useEffect, useState } from 'react';

const KEYS = {
  name: 'sp_name',
  schoolPlan: 'sp_schoolPlan',
  activities: 'sp_activities',
  vulcanSession: 'sp_vulcanSession',
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

// Session id only — the actual Vulcan credentials never leave the backend
// (see server/vulcanSessions.js). This just remembers "we were connected"
// across reloads; if the dev server restarted, the id is stale and the
// next request will come back as "session expired".
export function useVulcanSession() {
  return useLocalStorage(KEYS.vulcanSession, null);
}
