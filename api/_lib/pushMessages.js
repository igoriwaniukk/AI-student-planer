// Composes the periodic push notification's title/body from the last state
// the client reported (streak, whether an exam is coming up, custom
// reminders) — rotated by `tick` so the same device doesn't see the exact
// same line every time. Real notification text, not a translated key
// lookup, since the server has no access to the app's i18n dictionary.
const TEXT = {
  pl: {
    streakActive: (n) => ({ title: '🔥 Twoja seria: ' + n + (n === 1 ? ' dzień' : ' dni') + '!', body: 'Nie przerywaj jej — skończ dziś sesję nauki.' }),
    streakSession: (n, s) => ({ title: '🔥 Twoja seria: ' + n + (n === 1 ? ' dzień' : ' dni') + '!', body: 'Zacznij „' + s + '”, żeby ją przedłużyć.' }),
    streakSecured: (n) => ({ title: '🔥 Seria bezpieczna: ' + n + (n === 1 ? ' dzień' : ' dni') + '!', body: 'Dzisiejsza nauka zaliczona — widzimy się jutro.' }),
    streakNone: { title: '📚 Czas na naukę?', body: 'Zaplanuj dzisiejszą sesję i zacznij nową serię.' },
    streakNoneSession: (s) => ({ title: '📚 Czas na naukę?', body: 'Zacznij „' + s + '” i rozpocznij nową serię.' }),
    exam: { title: '🎯 Zbliża się sprawdzian', body: 'Sprawdź plan przygotowań w aplikacji Student Planner.' },
    reminder: (text) => ({ title: '📌 Przypomnienie', body: text }),
    restart: { title: '🔄 Zrestartuj swój dzień', body: 'Nie masz jeszcze planu na dziś — ułóż go teraz, zanim dzień się skończy.' },
    unfinished: (n, list) => ({ title: '📋 Zostało Ci ' + n + (n === 1 ? ' zadanie' : n < 5 ? ' zadania' : ' zadań') + ' na dziś', body: list + ' — skończ je albo przenieś na jutro w podsumowaniu dnia.' }),
    more: (n) => ' i ' + n + ' więcej',
  },
  en: {
    streakActive: (n) => ({ title: '🔥 Your streak: ' + n + (n === 1 ? ' day' : ' days') + '!', body: "Don't break it — finish a study session today." }),
    streakSession: (n, s) => ({ title: '🔥 Your streak: ' + n + (n === 1 ? ' day' : ' days') + '!', body: 'Start "' + s + '" to extend it.' }),
    streakSecured: (n) => ({ title: '🔥 Streak secured: ' + n + (n === 1 ? ' day' : ' days') + '!', body: "Today's study is done — see you tomorrow." }),
    streakNone: { title: '📚 Time to study?', body: 'Plan a session today and start a new streak.' },
    streakNoneSession: (s) => ({ title: '📚 Time to study?', body: 'Start "' + s + '" and begin a new streak.' }),
    exam: { title: '🎯 An exam is coming up', body: 'Check your prep plan in the Student Planner app.' },
    reminder: (text) => ({ title: '📌 Reminder', body: text }),
    restart: { title: '🔄 Restart your day', body: "You don't have a plan for today yet — set one up before the day's gone." },
    unfinished: (n, list) => ({ title: '📋 ' + n + (n === 1 ? ' task' : ' tasks') + ' left for today', body: list + ' — finish them or move them to tomorrow in your day summary.' }),
    more: (n) => ' and ' + n + ' more',
  },
};

// The "restart your day" nudge (see sendScheduledPushes in push.js) fully
// replaces the usual rotation below rather than taking a turn in it — if
// today still has no plan by the afternoon, that's the one thing worth
// saying, not whichever slot the tick rotation happens to land on.
export function composeRestartMessage(lang) {
  return TEXT[lang === 'en' ? 'en' : 'pl'].restart;
}

export function composeUnfinishedMessage(lang, titles) {
  const t = TEXT[lang === 'en' ? 'en' : 'pl'];
  const shown = titles.slice(0, 3).join(', ') + (titles.length > 3 ? t.more(titles.length - 3) : '');
  return t.unfinished(titles.length, shown);
}

// `todayKey` is the subscriber's local YYYY-MM-DD; studiedTodayDate and
// nextSessionDate (synced by useStreakPushSync) only count when they match
// it, so yesterday's snapshot never reads as "already studied today".
export function composeMessage(state, tick, todayKey) {
  const lang = state.lang === 'en' ? 'en' : 'pl';
  const t = TEXT[lang];
  const streak = Number(state.streak) || 0;
  const reminders = Array.isArray(state.reminders) ? state.reminders.filter(Boolean) : [];
  const studied = !!todayKey && state.studiedTodayDate === todayKey;
  const nextTitle = todayKey && state.nextSessionDate === todayKey && state.nextSessionTitle ? String(state.nextSessionTitle) : null;

  const slot = tick % 3;
  if (slot === 2 && reminders.length) {
    return t.reminder(reminders[tick % reminders.length]);
  }
  if (slot === 1 && state.hasUpcomingExam) {
    return t.exam;
  }
  if (studied) {
    return t.streakSecured(Math.max(streak, 1));
  }
  if (streak > 0) return nextTitle ? t.streakSession(streak, nextTitle) : t.streakActive(streak);
  return nextTitle ? t.streakNoneSession(nextTitle) : t.streakNone;
}
