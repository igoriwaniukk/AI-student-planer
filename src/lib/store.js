import { useEffect, useState } from 'react';

const KEYS = {
  name: 'sp_name',
  sessions: 'sp_sessions',
  deadlines: 'sp_deadlines',
  schoolPlan: 'sp_schoolPlan',
  activities: 'sp_activities',
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

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function formatDayLabel(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

const SUBJECT_COLORS = {
  Matematyka: '#7c5cff',
  Angielski: '#35d0c8',
  Fizyka: '#ff8a5c',
  Historia: '#e0c341',
  Chemia: '#5cd0ff',
  Biologia: '#5fdd9b',
};

export function colorForSubject(subject) {
  return SUBJECT_COLORS[subject] || '#a58cff';
}

function seedSessions() {
  const today = toISODate(new Date());
  return [
    { id: crypto.randomUUID(), day: today, time: '09:00', duration: 60, subject: 'Matematyka', type: 'study', completed: false },
    { id: crypto.randomUUID(), day: today, time: '11:30', duration: 45, subject: 'Angielski', type: 'class', completed: false },
    { id: crypto.randomUUID(), day: addDays(today, 1), time: '10:00', duration: 90, subject: 'Fizyka', type: 'study', completed: false },
  ];
}

function seedDeadlines() {
  const today = toISODate(new Date());
  return [
    { id: crypto.randomUUID(), subject: 'Matematyka', title: 'Kolokwium z funkcji', dueDate: addDays(today, 6), notes: '' },
  ];
}

export function useStudentName() {
  return useLocalStorage(KEYS.name, '');
}

export function useSessions() {
  return useLocalStorage(KEYS.sessions, seedSessions());
}

export function useDeadlines() {
  return useLocalStorage(KEYS.deadlines, seedDeadlines());
}

export function useSchoolPlan() {
  return useLocalStorage(KEYS.schoolPlan, null);
}

export function useActivities() {
  return useLocalStorage(KEYS.activities, null);
}
