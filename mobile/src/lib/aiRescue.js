import { activeIds, checkBlockConflict, durOf } from './plannerLogic';
import { getCurrentLang } from './i18n';
import { authedFetch } from './authFetch';

// Turns Claude's {blocks, moved} proposal into a validated {schedule,
// decisions} pair, or null if anything is missing/duplicated/out of bounds/
// over budget/longer than requested — the caller then falls back to the
// deterministic rescue packer instead of trusting a broken plan.
export function toValidatedRescue(blocks, moved, ids, taskDefs, durOverride, availableMinutes, constraints) {
  if (!Array.isArray(blocks) || !Array.isArray(moved)) return null;
  const remainingIds = new Set(ids);
  const schedule = {};
  const decisions = {};
  let totalDur = 0;
  for (const block of blocks) {
    if (!block || typeof block.start !== 'number' || typeof block.dur !== 'number' || !remainingIds.has(block.taskId)) return null;
    const original = durOf(block.taskId, taskDefs, durOverride);
    if (block.dur <= 0 || block.dur > original) return null;
    const conflict = checkBlockConflict(block.taskId, block.start, block.dur, schedule, (id) => taskDefs.find((t) => t.id === id), constraints);
    if (conflict) return null;
    remainingIds.delete(block.taskId);
    schedule[block.taskId] = { start: block.start, dur: block.dur };
    decisions[block.taskId] = block.dur < original ? 'shortened' : 'kept';
    totalDur += block.dur;
  }
  if (totalDur > availableMinutes) return null;
  for (const id of moved) {
    if (!remainingIds.has(id)) return null;
    remainingIds.delete(id);
    decisions[id] = 'moved';
  }
  return remainingIds.size === 0 ? { schedule, decisions } : null;
}

// Asks the backend to propose a rescue plan with Claude — which tasks stay
// (possibly shortened) and which get moved to another day — given how much
// time is actually left. Returns null (never throws) whenever the AI is
// unavailable, unreachable, or proposes something invalid; callers use that
// as the signal to fall back to the deterministic rescue packer.
export async function requestAIRescue({ taskDefs, tasks, taskState, energy, durOverride, availableMinutes, reasons, activitiesNote, activitiesSelected, prioritySubjects, studyTime, constraints }) {
  const ids = activeIds(taskDefs, tasks, taskState);
  if (!ids.length) return null;
  const items = ids.map((id) => {
    const d = taskDefs.find((t) => t.id === id);
    return { taskId: id, subject: d.subject, title: d.title, priority: d.priority, durationMinutes: durOf(id, taskDefs, durOverride) };
  });

  try {
    const res = await authedFetch('/api/plan/rescue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: items, energy, availableMinutes, reasons, activitiesNote, activitiesSelected, prioritySubjects, studyTime, constraints, lang: getCurrentLang() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = toValidatedRescue(data.blocks, data.moved, ids, taskDefs, durOverride, availableMinutes, constraints);
    return result ? { ...result, rationale: data.rationale || null } : null;
  } catch {
    return null;
  }
}
