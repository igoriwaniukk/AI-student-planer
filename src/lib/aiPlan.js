import { activeIds, checkBlockConflict, durOf } from './plannerLogic';
import { getCurrentLang } from './i18n';
import { authedFetch } from './authFetch';
import { planningContextForAI, taskForAI } from './aiContext';

// Turns Claude's proposed {taskId, start} blocks into a validated schedule,
// or null if anything is missing/duplicated/out of bounds — the caller then
// falls back to the deterministic packer instead of trusting a broken plan.
export function toValidatedSchedule(blocks, ids, taskDefs, durOverride, constraints) {
  if (!Array.isArray(blocks) || blocks.length !== ids.length) return null;
  const remaining = new Set(ids);
  const schedule = {};
  for (const block of blocks) {
    if (!block || typeof block.start !== 'number' || !remaining.has(block.taskId)) return null;
    remaining.delete(block.taskId);
    const dur = durOf(block.taskId, taskDefs, durOverride);
    const conflict = checkBlockConflict(block.taskId, block.start, dur, schedule, (id) => taskDefs.find((t) => t.id === id), constraints);
    if (conflict) return null;
    schedule[block.taskId] = { start: block.start, dur };
  }
  return remaining.size === 0 ? schedule : null;
}

// Extra review sessions the AI may add for an exam coming up within a week
// of the planned day. Each one is checked like any other block; one that
// doesn't fit (or names an exam that isn't coming up) is simply dropped,
// never the whole plan. At most two per plan.
export const MAX_EXTRA_SESSIONS = 2;
export function toValidatedExtras(extras, exams, schedule, taskDefs, constraints) {
  if (!Array.isArray(extras)) return [];
  const eligible = (exams || []).filter((e) => e.daysAfterPlanDay >= 1 && e.daysAfterPlanDay <= 7);
  const sched = { ...schedule };
  const out = [];
  const subjects = {};
  for (const x of extras) {
    if (out.length >= MAX_EXTRA_SESSIONS) break;
    const exam = eligible.find((e) => e.examId === x?.examId);
    const dur = Math.round(Number(x?.durationMinutes));
    if (!exam || typeof x.start !== 'number' || !(dur >= 15 && dur <= 90)) continue;
    const key = 'extra-' + out.length;
    const conflict = checkBlockConflict(key, x.start, dur, sched, (id) => taskDefs.find((t) => t.id === id) || { subject: subjects[id] || '' }, constraints);
    if (conflict) continue;
    sched[key] = { start: x.start, dur };
    subjects[key] = exam.subject;
    out.push({ examId: exam.examId, subject: exam.subject, examTitle: exam.title || exam.subject, focus: x.focus ? String(x.focus).slice(0, 60) : '', start: x.start, dur });
  }
  return out;
}

// Asks the backend to propose the day's schedule with Claude, then validates
// the result against the same conflict rules the app already enforces for
// manual edits. Returns null (never throws) whenever the AI is unavailable,
// unreachable, or proposes something invalid — callers use that as the
// signal to fall back to the deterministic scheduler.
export async function requestAIPlan(state) {
  const { taskDefs, tasks, taskState, energy, pref, durOverride, activitiesSelected, prioritySubjects, studyTime, constraints, dayNum, recurringActivities, planNote, aboutMe } = state;
  const ids = activeIds(taskDefs, tasks, taskState, dayNum);
  if (!ids.length) return null;
  const items = ids.map((id) => taskForAI(state, taskDefs.find((t) => t.id === id), durOf(id, taskDefs, durOverride)));
  const context = planningContextForAI(state, { dayNum, recurringActivities, note: planNote, aboutMe });

  try {
    const res = await authedFetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: items, energy, pref, activitiesSelected, prioritySubjects, studyTime, constraints, context, lang: getCurrentLang() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const schedule = toValidatedSchedule(data.blocks, ids, taskDefs, durOverride, constraints);
    if (!schedule) return null;
    const extras = toValidatedExtras(data.extraSessions, context.exams, schedule, taskDefs, constraints);
    return { schedule, extras, rationale: data.rationale || null };
  } catch {
    return null;
  }
}
