import { activeIds, checkBlockConflict, durOf } from './plannerLogic';
import { getCurrentLang } from './i18n';
import { authedFetch } from './authFetch';

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

// Asks the backend to propose today's schedule with Claude, then validates
// the result against the same conflict rules the app already enforces for
// manual edits. Returns null (never throws) whenever the AI is unavailable,
// unreachable, or proposes something invalid — callers use that as the
// signal to fall back to the deterministic scheduler.
export async function requestAIPlan({ taskDefs, tasks, taskState, energy, pref, durOverride, activitiesNote, activitiesSelected, prioritySubjects, constraints }) {
  const ids = activeIds(taskDefs, tasks, taskState);
  if (!ids.length) return null;
  const items = ids.map((id) => {
    const d = taskDefs.find((t) => t.id === id);
    return { taskId: id, subject: d.subject, title: d.title, priority: d.priority, durationMinutes: durOf(id, taskDefs, durOverride) };
  });

  try {
    const res = await authedFetch('/api/plan/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: items, energy, pref, activitiesNote, activitiesSelected, prioritySubjects, constraints, lang: getCurrentLang() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const schedule = toValidatedSchedule(data.blocks, ids, taskDefs, durOverride, constraints);
    return schedule ? { schedule, rationale: data.rationale || null } : null;
  } catch {
    return null;
  }
}
