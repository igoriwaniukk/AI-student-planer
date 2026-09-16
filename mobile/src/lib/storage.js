import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  name: 'sp_name',
  energyLog: 'sp_energyLog',
  studyHistory: 'sp_studyHistory',
  recurringActivities: 'sp_recurringActivities',
  seenAchievements: 'sp_seenAchievements',
  lastSeenStreak: 'sp_lastSeenStreak',
  language: 'sp_language',
};

// AsyncStorage is async, unlike web's localStorage, so every key's current
// value is mirrored here in memory once loaded — a hook can then render the
// cached value synchronously on every subsequent mount instead of flashing
// initialValue while its own read is in flight.
const cache = new Map();
const loading = new Map();

async function load(key, initialValue) {
  if (cache.has(key)) return cache.get(key);
  if (!loading.has(key)) {
    loading.set(
      key,
      AsyncStorage.getItem(key)
        .then((raw) => (raw ? JSON.parse(raw) : initialValue))
        .catch(() => initialValue)
        .then((value) => {
          cache.set(key, value);
          return value;
        })
    );
  }
  return loading.get(key);
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => (cache.has(key) ? cache.get(key) : initialValue));
  const [loaded, setLoaded] = useState(cache.has(key));

  useEffect(() => {
    let cancelled = false;
    if (!cache.has(key)) {
      load(key, initialValue).then((v) => {
        if (!cancelled) {
          setValue(v);
          setLoaded(true);
        }
      });
    }
    return () => {
      cancelled = true;
    };
    // Only the very first mount for this key needs to wait on the load —
    // later renders read straight from the cache seeded above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    cache.set(key, value);
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }, [key, value, loaded]);

  return [value, setValue];
}

export function useStudentName() {
  return useLocalStorage(KEYS.name, '');
}

export function useEnergyLog() {
  return useLocalStorage(KEYS.energyLog, []);
}

export function useStudyHistory() {
  return useLocalStorage(KEYS.studyHistory, {});
}

export function useRecurringActivities() {
  return useLocalStorage(KEYS.recurringActivities, []);
}

export function useSeenAchievements() {
  return useLocalStorage(KEYS.seenAchievements, []);
}

export function useLastSeenStreak() {
  return useLocalStorage(KEYS.lastSeenStreak, 0);
}

export function useLanguage() {
  return useLocalStorage(KEYS.language, 'pl');
}
