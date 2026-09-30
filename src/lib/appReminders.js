import { NUM_TODAY, realDateForNum } from './plannerData';
import { computeStreak, studiedToday, statusOn, sessionClock, upcomingExams, wrapUpMinutes, fmt, pluralForm, planFor, dayOpenTasks, localDateKey, NO_PLAN_NUDGE_MINUTES } from './plannerLogic';
import { VALUE_KEY } from './i18n';

// The reminders the iPhone app schedules on the phone itself (local
// notifications), worked out here from the planner so the app never needs a
// copy of the planning logic. Recomputed whenever the plan, tasks or streak
// change; the app replaces everything it had with this list. Each item is
// { id, at (ms since epoch), title, body, open? }, only ever in the future;
// `open: 'rescue'` makes tapping it open the Restart-your-day screen.
const SESSION_LEAD_MIN = 10;
const STREAK_LEAD_MIN = 120;
const EXAM_EVE_MINUTES = 19 * 60;
const EXAM_LOOKAHEAD_DAYS = 30;
const MISSED_DELAY_MIN = 15;
// iOS keeps at most 64 pending notifications per app.
const MAX_REMINDERS = 60;

function atMinutes(day, minutes) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes).getTime();
}

function bedtimeMinutes(bedtime) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(bedtime || '22:30');
  const bed = m ? (+m[1]) * 60 + (+m[2]) : 22 * 60 + 30;
  // A bedtime after midnight belongs to the evening before it.
  return bed < 6 * 60 ? bed + 24 * 60 : bed;
}

export function buildAppReminders({ state, studyHistory, bedtime, unfinishedTitles = [], t, titleOf, now = new Date() }) {
  const nowMs = now.getTime();
  const today = realDateForNum(NUM_TODAY);
  const tomorrow = realDateForNum(NUM_TODAY + 1);
  const out = [];
  const add = (r) => { if (r.at > nowMs) out.push(r); };
  const name = (id) => titleOf(id) || t('appRem.sessionFallback');

  // 1. A planned session starts in 10 minutes (today's and tomorrow's
  // approved plans; drafts don't count).
  [NUM_TODAY, NUM_TODAY + 1].forEach((planDay) => {
    const plan = planFor(state, planDay);
    if (!plan) return;
    const day = planDay === NUM_TODAY ? today : tomorrow;
    Object.keys(plan).forEach((id) => {
      if (id === state.activeTask || statusOn(state, id, planDay) !== 'planned') return;
      const start = plan[id].start;
      add({
        id: 'session:' + id + ':' + planDay,
        at: atMinutes(day, start - SESSION_LEAD_MIN),
        title: t('appRem.sessionTitle', { name: name(id) }),
        body: t('appRem.sessionBody', { time: fmt(start) }),
      });
    });
  });

  // Restart your day (the same off-track rule as Home's card, see
  // offTrackReason): 15 minutes after a session in today's plan should have
  // ended without being started — only the next such moment, and none once
  // one has already passed, so at most one a day — or at 14:00 when today
  // has no plan but tasks are still due.
  if (!(state.daySummaries || {})[localDateKey(now)]) {
    const todayPlan = planFor(state, NUM_TODAY) || {};
    const sessions = Object.keys(todayPlan).filter((id) => (state.taskDefs || []).some((d) => d.id === id));
    if (sessions.length) {
      const checks = sessions
        .filter((id) => id !== state.activeTask && statusOn(state, id, NUM_TODAY) === 'planned')
        .map((id) => ({ id, at: atMinutes(today, todayPlan[id].start + todayPlan[id].dur + MISSED_DELAY_MIN) }))
        .sort((a, b) => a.at - b.at);
      const next = checks.find((c) => c.at > nowMs);
      if (next && !checks.some((c) => c.at <= nowMs)) {
        add({ id: 'restart:' + NUM_TODAY, at: next.at, title: t('appRem.missedTitle', { name: name(next.id), time: fmt(todayPlan[next.id].start) }), body: t('appRem.missedBody'), open: 'rescue' });
      }
    } else {
      const open = dayOpenTasks(state, NUM_TODAY);
      if (open.length) {
        add({ id: 'noplan:' + NUM_TODAY, at: atMinutes(today, NO_PLAN_NUDGE_MINUTES), title: t('appRem.noPlanTitle'), body: t('appRem.noPlanBody', { left: open.length + ' ' + t('appRem.tasks.' + pluralForm(open.length)) }), open: 'rescue' });
      }
    }
  }

  // The running session's time is up (the phone may be locked by then).
  if (state.activeTask && state.sessionStart) {
    const clock = sessionClock(state, nowMs);
    if (!clock.overtime) {
      add({ id: 'focus-end', at: clock.endsAt, title: t('appRem.focusEndTitle'), body: t('appRem.focusEndBody', { name: name(state.activeTask) }) });
    }
  }

  // 2. Streak at risk, two hours before bedtime: tonight if nothing's been
  // studied yet today, otherwise tomorrow night (studying tomorrow cancels
  // it, since the list is rebuilt the moment that happens).
  const streak = computeStreak(studyHistory || {});
  const riskMin = bedtimeMinutes(bedtime) - STREAK_LEAD_MIN;
  const streakText = (n) => ({
    title: t('appRem.streakTitle', { n, days: t(n === 1 ? 'appRem.day' : 'appRem.days') }),
    body: t('appRem.streakBody'),
  });
  if (studiedToday(studyHistory)) {
    add({ id: 'streak:' + (NUM_TODAY + 1), at: atMinutes(tomorrow, riskMin), ...streakText(streak) });
  } else if (streak > 0) {
    add({ id: 'streak:' + NUM_TODAY, at: atMinutes(today, riskMin), ...streakText(streak) });
  }

  // 3. Unfinished tasks, an hour before bedtime (same moment as the
  // automatic day summary).
  if (unfinishedTitles.length) {
    const n = unfinishedTitles.length;
    const list = unfinishedTitles.slice(0, 3).join(', ') + (n > 3 ? t('appRem.more', { n: n - 3 }) : '');
    add({
      id: 'unfinished:' + NUM_TODAY,
      at: atMinutes(today, wrapUpMinutes(bedtime)),
      title: t('appRem.unfinishedTitle', { n, tasks: t('appRem.tasks.' + pluralForm(n)) }),
      body: t('appRem.unfinishedBody', { list }),
    });
  }

  // 4. The evening before an exam.
  upcomingExams(state)
    .filter((e) => e.daysUntil >= 1 && e.daysUntil <= EXAM_LOOKAHEAD_DAYS)
    .forEach((e) => {
      const subject = t(VALUE_KEY[e.subject]) || e.subject || '';
      const title = t(VALUE_KEY[e.title]) || e.title || subject;
      add({
        id: 'exam:' + e.id,
        at: atMinutes(realDateForNum(e.day - 1), EXAM_EVE_MINUTES),
        title: t('appRem.examTitle', { name: title }),
        body: t('appRem.examBody', { subject: subject || title }),
      });
    });

  return out.sort((a, b) => a.at - b.at).slice(0, MAX_REMINDERS);
}
