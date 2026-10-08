import { NUM_TODAY, RECUR_DAYS } from './plannerData';
import { timeStrToMinutes, fmt, finishedOnDay, isTaskOn, planFor, taskKey } from './plannerLogic';

// What the Plans screen lists: weekly activities grouped for display (and
// saved back one entry per weekday), the tasks still ahead grouped by day,
// and an exam's study sessions.

const dayIdx = (d) => RECUR_DAYS.indexOf(d);
const minutes = (t) => timeStrToMinutes(t || '00:00');

export function activityEnd(start, dur) {
  return fmt(minutes(start) + (dur || 0));
}

// The picker only lets an activity start and end on the same day, so an end
// at or before the start means the end was dragged too far — the shortest
// valid slot is saved rather than a zero or negative length.
export function activityDuration(start, end) {
  return Math.max(15, minutes(end) - minutes(start));
}

// Activities are stored one entry per weekday ({ id, name, day, start, dur }).
// Entries with the same name become one activity; inside it, the days that
// share a start and length become one line ("Mon, Thu · 08:55–15:30").
export function groupActivities(list) {
  const byName = new Map();
  (list || []).forEach((a) => {
    const name = String(a.name || '').trim();
    const key = name.toLowerCase();
    if (!byName.has(key)) byName.set(key, { key, name, lines: new Map() });
    const lines = byName.get(key).lines;
    const lineKey = a.start + '|' + a.dur;
    if (!lines.has(lineKey)) lines.set(lineKey, { key: key + '|' + lineKey, start: a.start, dur: a.dur, days: [], ids: [] });
    const line = lines.get(lineKey);
    if (!line.days.includes(a.day)) line.days.push(a.day);
    line.ids.push(a.id);
  });
  const firstLine = (g) => g.lines[0];
  return [...byName.values()]
    .map((g) => {
      const lines = [...g.lines.values()]
        .map((l) => ({ ...l, days: l.days.sort((x, y) => dayIdx(x) - dayIdx(y)), end: activityEnd(l.start, l.dur) }))
        .sort((a, b) => dayIdx(a.days[0]) - dayIdx(b.days[0]) || minutes(a.start) - minutes(b.start));
      return { key: g.key, name: g.name, lines, ids: lines.flatMap((l) => l.ids) };
    })
    .sort((a, b) => dayIdx(firstLine(a).days[0]) - dayIdx(firstLine(b).days[0]) || minutes(firstLine(a).start) - minutes(firstLine(b).start));
}

// Replaces the entries in `replaceIds` (nothing, when adding) with one entry
// per chosen day. A day that already had an entry keeps its id.
export function saveActivityLine(list, { replaceIds = [], name, days, start, end }, now = Date.now()) {
  const replaced = new Set(replaceIds);
  const old = (list || []).filter((a) => replaced.has(a.id));
  const kept = (list || []).filter((a) => !replaced.has(a.id));
  const used = new Set(kept.map((a) => a.id));
  const dur = activityDuration(start, end);
  let next = now;
  const added = RECUR_DAYS.filter((d) => days.includes(d)).map((day) => {
    const reuse = old.find((a) => a.day === day && !used.has(a.id));
    let id = reuse?.id;
    if (id == null) {
      while (used.has(next)) next++;
      id = next++;
    }
    used.add(id);
    return { ...reuse, id, name: name.trim(), day, start, dur };
  });
  return kept.concat(added);
}

export function removeActivities(list, ids) {
  const gone = new Set(ids);
  return (list || []).filter((a) => !gone.has(a.id));
}

// Tasks still ahead: prep sessions live under their exam, an AI review
// session waits until its plan is approved, and a finished or past one-off
// isn't a plan any more.
export function upcomingTasks(state) {
  return state.taskDefs
    .filter((d) => !d.id.startsWith('examsession-') && !d.pendingDraft)
    .filter((d) => {
      if (d.repeatDays && d.repeatDays.length) return true;
      if (d.day != null) {
        if (d.day < NUM_TODAY) return false;
        const st = state.taskState[d.id] || {};
        return d.category === 'personal' ? !isTaskOn(state.tasks, d, d.day) : !['completed', 'skipped'].includes(st.status);
      }
      return finishedOnDay(state, d) === null;
    })
    .sort((a, b) => {
      const rank = (d) => (d.repeatDays && d.repeatDays.length ? 1e6 : d.day ?? NUM_TODAY + 1);
      return rank(a) - rank(b);
    });
}

// Today / Tomorrow (also a task with no fixed day, as taskDayLabel says) /
// Later / Repeating, leaving out empty groups.
export function groupPlanTasks(tasks) {
  const groups = { today: [], tomorrow: [], later: [], repeating: [] };
  tasks.forEach((d) => {
    if (d.repeatDays && d.repeatDays.length) groups.repeating.push(d);
    else if (d.day === NUM_TODAY) groups.today.push(d);
    else if (d.day == null || d.day === NUM_TODAY + 1) groups.tomorrow.push(d);
    else groups.later.push(d);
  });
  return ['today', 'tomorrow', 'later', 'repeating'].map((key) => ({ key, items: groups[key] })).filter((g) => g.items.length);
}

// Every study session known for an exam: its prep plan (see confirmPrep) and
// review sessions an approved AI day plan added, in date order.
export function examStudySessions(state, examId) {
  const prep = (state.examSessions?.[examId] || []).map((s, i) => ({
    key: 'prep-' + i,
    title: s.title,
    day: s.day ?? null,
    time: s.time || null,
    dur: s.dur,
    done: !!(s.done || (state.taskState['examsession-' + examId + '-' + i] || {}).status === 'completed'),
  }));
  const reviews = state.taskDefs
    .filter((d) => d.examId === examId && d.aiSuggested && !d.pendingDraft)
    .map((d) => {
      const block = d.day != null ? (planFor(state, d.day) || {})[d.id] : null;
      return {
        key: d.id,
        title: d.title,
        day: d.day ?? null,
        time: block ? fmt(block.start) + '–' + fmt(block.start + block.dur) : null,
        dur: d.dur,
        done: (state.taskState[taskKey(d, d.day)] || {}).status === 'completed',
      };
    });
  return prep.concat(reviews).sort((a, b) => (a.day ?? 1e9) - (b.day ?? 1e9));
}
