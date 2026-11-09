import { upcomingExams } from './plannerLogic.js';

// Home's "Pug's tip of the day": picked from the student's own day — no AI
// call. An exam in the next three days comes first, then the streak, then
// the time of day, then a study tip that changes daily.
const GENERAL_TIPS = 5;

export function dailyTip(state, { streak = 0, doneToday = false, now = new Date() } = {}) {
  const exam = upcomingExams(state).find((e) => e.daysUntil >= 0 && e.daysUntil <= 3);
  if (exam) {
    const key = exam.daysUntil === 0 ? 'tip.examToday' : exam.daysUntil === 1 ? 'tip.examTomorrow' : 'tip.examSoon';
    return { key, vars: { days: exam.daysUntil }, exam };
  }
  if (doneToday) return { key: 'tip.doneToday', vars: {} };
  if (streak > 0) return { key: 'tip.keepStreak', vars: { n: streak } };
  if (now.getHours() >= 21) return { key: 'tip.evening', vars: {} };
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return { key: 'tip.general' + (dayOfYear % GENERAL_TIPS), vars: {} };
}
