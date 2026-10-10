import { planFor, statusOn, timedTodoBlocks, timeStrToMinutes, upcomingExams, dayInfo, taskShortLabel } from './plannerLogic';
import { iconForTask, iconForSubject, iconForActivity } from './taskAuto';
import { VALUE_KEY } from './i18n';

// Everything on one day for the Calendar's week view, colour-coded by kind:
// 'study' (planned sessions, and before a day is planned its own study tasks
// such as exam prep), 'school' (weekly activities: school, football…),
// 'todo' (to-dos, incl. ones at a set time) and 'test' (exams). Sorted by
// time; tests first, items without a time last.
export function weekDayItems(state, dayNum, recurringActivities = [], t = (k) => k) {
  const items = [];
  const seen = new Set();
  const def = (id) => (state.taskDefs || []).find((d) => d.id === id);
  const plan = planFor(state, dayNum);

  Object.entries(plan || {}).forEach(([id, slot]) => {
    const d = def(id);
    if (!d) return;
    seen.add(id);
    items.push({
      key: 'p-' + id, kind: d.category === 'personal' ? 'todo' : 'study', start: slot.start,
      title: taskShortLabel(t, d), icon: iconForTask(d), done: statusOn(state, id, dayNum) === 'completed',
    });
  });

  if (!plan) {
    (state.taskDefs || [])
      .filter((d) => d.category !== 'personal' && d.day === dayNum && !(d.repeatDays && d.repeatDays.length))
      .forEach((d) => {
        seen.add(d.id);
        const start = state.startOverride?.[d.id];
        items.push({
          key: 'o-' + d.id, kind: 'study', start: start ?? null,
          title: taskShortLabel(t, d), icon: iconForTask(d), done: statusOn(state, d.id, dayNum) === 'completed',
        });
      });
  }

  timedTodoBlocks(state.taskDefs, dayNum).forEach((b) => {
    if (seen.has(b.taskId)) return;
    const d = def(b.taskId);
    items.push({
      key: 't-' + b.taskId, kind: 'todo', start: b.start,
      title: d ? taskShortLabel(t, d) : b.label, icon: d ? iconForTask(d) : '📝', done: statusOn(state, b.taskId, dayNum) === 'completed',
    });
  });

  const weekday = dayInfo(dayNum).label;
  recurringActivities.filter((a) => a.day === weekday).forEach((a) => {
    items.push({ key: 'r-' + a.id, kind: 'school', start: timeStrToMinutes(a.start), title: a.name, icon: iconForActivity(a.name) || '🗓️', done: false });
  });

  upcomingExams(state).filter((e) => e.day === dayNum).forEach((e) => {
    const subject = t(VALUE_KEY[e.subject]) || e.subject;
    const title = t(VALUE_KEY[e.title]) || e.title;
    items.push({ key: 'e-' + e.id, kind: 'test', start: -1, title: subject + ' — ' + title, icon: iconForSubject(e.subject), done: false });
  });

  const order = (x) => (x.start == null ? 1e6 : x.start);
  return items.sort((a, b) => order(a) - order(b));
}
