// Composes the periodic push notification's title/body from the last state
// the client reported (streak, whether an exam is coming up, custom
// reminders) — rotated by `tick` so the same device doesn't see the exact
// same line every time. Real notification text, not a translated key
// lookup, since the server has no access to the app's i18n dictionary.
const TEXT = {
  pl: {
    streakActive: (n) => ({ title: '🔥 Twoja passa: ' + n + (n === 1 ? ' dzień' : ' dni') + '!', body: 'Nie przerywaj jej — zaznacz dzisiejszą naukę jako wykonaną.' }),
    streakNone: { title: '📚 Czas na naukę?', body: 'Zaplanuj dzisiejszą sesję i zacznij nową passę.' },
    exam: { title: '🎯 Zbliża się sprawdzian', body: 'Sprawdź plan przygotowań w aplikacji Student Planner.' },
    reminder: (text) => ({ title: '📌 Przypomnienie', body: text }),
  },
  en: {
    streakActive: (n) => ({ title: '🔥 Your streak: ' + n + (n === 1 ? ' day' : ' days') + '!', body: "Don't break it — mark today's study session as done." }),
    streakNone: { title: '📚 Time to study?', body: 'Plan a session today and start a new streak.' },
    exam: { title: '🎯 An exam is coming up', body: 'Check your prep plan in the Student Planner app.' },
    reminder: (text) => ({ title: '📌 Reminder', body: text }),
  },
};

export function composeMessage(state, tick) {
  const lang = state.lang === 'en' ? 'en' : 'pl';
  const t = TEXT[lang];
  const streak = Number(state.streak) || 0;
  const reminders = Array.isArray(state.reminders) ? state.reminders.filter(Boolean) : [];

  const slot = tick % 3;
  if (slot === 2 && reminders.length) {
    return t.reminder(reminders[tick % reminders.length]);
  }
  if (slot === 1 && state.hasUpcomingExam) {
    return t.exam;
  }
  return streak > 0 ? t.streakActive(streak) : t.streakNone;
}
