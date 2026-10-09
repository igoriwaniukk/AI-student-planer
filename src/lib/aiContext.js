import { NUM_TODAY, realDateForNum } from './plannerData';
import { upcomingExams, localDateKey, taskDueOnDay, isTaskOn, taskKey, planFor, dayInfo, timeStrToMinutes } from './plannerLogic';

// Everything the student has added that an AI planner should know about —
// exams (with the study sessions already planned for them and which are
// done), to-dos, notes, weekly activities and the other day's plan — so a
// plan is built around the student's real week, not just the ticked tasks.
// Plain data only; the server turns it into the prompt (api/_lib/context.js).

const EXAM_HORIZON_DAYS = 30;
const UPCOMING_TASK_DAYS = 7;

export function dateOf(day) {
  return localDateKey(realDateForNum(day));
}

function isDone(state, d, day) {
  return ((state.taskState || {})[taskKey(d, day)] || {}).status === 'completed';
}

// Parses a "HH:MM–HH:MM" prep-session time into minutes.
function parseRange(time) {
  const m = /^(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})$/.exec(String(time || '').trim());
  if (!m) return null;
  const start = timeStrToMinutes(m[1]);
  let end = timeStrToMinutes(m[2]);
  if (end <= start) end += 24 * 60;
  return { start, end };
}

// Upcoming exams and every study session known for each: the prep plan's
// sessions (see confirmPrep) and review sessions an AI day plan added.
export function examsForAI(state, fromDay = NUM_TODAY) {
  return upcomingExams(state)
    .filter((e) => e.daysUntil >= 0 && e.daysUntil <= EXAM_HORIZON_DAYS)
    .map((e) => {
      const goal = (state.examGoals || {})[e.id];
      const prep = ((state.examSessions || {})[e.id] || []).map((s, i) => {
        const range = parseRange(s.time);
        return {
          title: s.title,
          date: s.day != null ? dateOf(s.day) : null,
          start: range ? range.start : null,
          durationMinutes: s.dur,
          done: !!(s.done || ((state.taskState || {})['examsession-' + e.id + '-' + i] || {}).status === 'completed'),
        };
      });
      const reviews = (state.taskDefs || [])
        .filter((d) => d.examId === e.id && d.aiSuggested && !d.pendingDraft)
        .map((d) => ({ title: d.title, date: d.day != null ? dateOf(d.day) : null, durationMinutes: d.dur, done: isDone(state, d, d.day) }));
      return {
        examId: e.id,
        kind: e.kind || null,
        subject: e.subject,
        title: e.title,
        date: dateOf(e.day),
        daysAfterPlanDay: e.day - fromDay,
        targetGrade: goal?.grade || null,
        importance: goal?.importance || null,
        targetStudyMinutes: goal?.studyMinutes || null,
        sessions: prep.concat(reviews),
      };
    });
}

// Sessions already fixed on a day: its approved plan and other exams' prep
// sessions — so a new plan for that day doesn't double-book it.
export function busyOnDay(state, day) {
  const out = [];
  const plan = planFor(state, day) || {};
  Object.keys(plan).forEach((id) => {
    const d = (state.taskDefs || []).find((x) => x.id === id);
    out.push({ title: d ? (d.subject ? d.subject + ' — ' : '') + d.title : id, start: plan[id].start, end: plan[id].start + plan[id].dur });
  });
  Object.entries(state.examSessions || {}).forEach(([examId, list]) => {
    (list || []).forEach((s, i) => {
      if (s.day !== day || plan['examsession-' + examId + '-' + i]) return;
      const range = parseRange(s.time);
      if (range) out.push({ title: s.title, start: range.start, end: range.end });
    });
  });
  return out.sort((a, b) => a.start - b.start);
}

export function weeklyActivitiesForAI(recurringActivities) {
  return (recurringActivities || []).map((a) => ({ name: a.name || a.label || '', day: a.day, start: a.start, durationMinutes: a.dur }));
}

// A task as the planner AI sees it: its note, the time the student already
// picked for it (a prep session's slot), and which exam it prepares for.
export function taskForAI(state, d, dur) {
  const examId = d.examId || (/^examsession-(.+)-\d+$/.exec(d.id) || [])[1];
  const exam = examId ? upcomingExams(state).find((e) => e.id === examId) : null;
  const preferred = (state.startOverride || {})[d.id];
  return {
    taskId: d.id,
    subject: d.subject,
    title: d.title,
    priority: d.priority,
    durationMinutes: dur,
    note: d.note ? String(d.note).slice(0, 300) : null,
    preferredStart: typeof preferred === 'number' ? preferred : null,
    forExam: exam ? exam.title || exam.subject : null,
  };
}

// The whole picture for planning `dayNum` (today or tomorrow).
export function planningContextForAI(state, { dayNum, recurringActivities, note, aboutMe = null }) {
  const otherDay = dayNum === NUM_TODAY ? NUM_TODAY + 1 : NUM_TODAY;
  const defs = state.taskDefs || [];
  const label = (d) => (d.subject ? d.subject + ' — ' : '') + d.title;
  const other = planFor(state, otherDay) || {};
  return {
    planDate: dateOf(dayNum),
    planWeekday: dayInfo(dayNum).label,
    today: dateOf(NUM_TODAY),
    note: note && String(note).trim() ? String(note).trim().slice(0, 600) : null,
    aboutMe,
    exams: examsForAI(state, dayNum),
    todos: defs
      .filter((d) => d.category === 'personal' && taskDueOnDay(d, dayNum) && !isTaskOn(state.tasks || {}, d, dayNum))
      .map((d) => ({ title: d.title, note: d.note || null, at: d.at || null, durationMinutes: d.at ? d.dur : null })),
    otherDayPlan: {
      date: dateOf(otherDay),
      sessions: Object.keys(other).map((id) => {
        const d = defs.find((x) => x.id === id);
        return { title: d ? label(d) : id, start: other[id].start, durationMinutes: other[id].dur };
      }),
    },
    doneToday: dayNum === NUM_TODAY
      ? defs.filter((d) => d.category !== 'personal' && isDone(state, d, NUM_TODAY) && ((state.taskState || {})[taskKey(d, NUM_TODAY)] || {}).day === NUM_TODAY).map(label)
      : [],
    upcomingTasks: defs
      .filter((d) => d.category !== 'personal' && d.day != null && d.day > NUM_TODAY && d.day !== dayNum && d.day <= NUM_TODAY + UPCOMING_TASK_DAYS && !isDone(state, d, d.day))
      .map((d) => ({ title: label(d), date: dateOf(d.day), durationMinutes: d.dur })),
    weeklyActivities: weeklyActivitiesForAI(recurringActivities),
  };
}
