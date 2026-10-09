import { describe, it, expect } from 'vitest';
import { planFor, draftFor, workingPlan, plannedElsewhere, daySessionBreakdown, dayOpenTasks, offTrackReason, localDateKey, timedTodoBlocks, todoTimeLabel, dayConstraints, checkBlockConflict } from './plannerLogic';
import { NUM_TODAY } from './plannerData';
import { initialState } from '../hooks/usePlanner';

const TODAY = NUM_TODAY;
const TOMORROW = NUM_TODAY + 1;
const hw = { id: 'hw', category: 'school', subject: 'Inny', title: 'Homework', dur: 30 };
const rep = { id: 'rep', category: 'school', subject: 'Matematyka', title: 'Drill', dur: 20, repeatDays: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'] };

describe('plans for today and tomorrow side by side', () => {
  const state = {
    taskDefs: [hw, rep], tasks: {}, taskState: {},
    plans: { [TODAY]: { hw: { start: 960, dur: 30 }, rep: { start: 1000, dur: 20 } } },
    drafts: { [TOMORROW]: { rep: { start: 390, dur: 20 } } },
  };

  it('reads each day on its own', () => {
    expect(planFor(state, TODAY).hw.start).toBe(960);
    expect(planFor(state, TOMORROW)).toBeNull();
    expect(draftFor(state, TOMORROW).rep.start).toBe(390);
    expect(workingPlan(state, TOMORROW)).toEqual({ rep: { start: 390, dur: 20 } });
    expect(workingPlan(state, TODAY).hw.start).toBe(960);
  });

  it('a one-off task in today’s plan belongs to today; a repeating one to each day', () => {
    expect(plannedElsewhere(state, hw, TOMORROW)).toBe(true);
    expect(plannedElsewhere(state, hw, TODAY)).toBe(false);
    expect(plannedElsewhere(state, rep, TOMORROW)).toBe(false);
  });

  it('a draft doesn’t count as the day’s plan', () => {
    expect(daySessionBreakdown(state, TOMORROW).planned).toEqual([]);
    expect(daySessionBreakdown(state, TODAY).planned).toEqual(['hw', 'rep']);
  });

  it('a task in today’s plan is not an open task tomorrow', () => {
    expect(dayOpenTasks(state, TOMORROW).map((d) => d.id)).toEqual(['rep']);
  });
});

describe('moving saved data to per-day plans', () => {
  const persisted = (extra) => ({ taskDefs: [hw], tasks: { hw: true }, taskState: {}, customExams: [], ...extra });

  it('an approved plan from the old single slot lands on its own day', () => {
    expect(initialState({}, {}, persisted({ planApproved: true, selectedDay: TODAY, schedule: { hw: { start: 960, dur: 30 } } })).plans)
      .toEqual({ [TODAY]: { hw: { start: 960, dur: 30 } } });
    expect(initialState({}, {}, persisted({ planApproved: true, selectedDay: TOMORROW, schedule: { hw: { start: 400, dur: 30 } } })).plans)
      .toEqual({ [TOMORROW]: { hw: { start: 400, dur: 30 } } });
  });

  it('drops an old plan whose day has passed and an unapproved preview', () => {
    expect(initialState({}, {}, persisted({ planApproved: true, selectedDay: TODAY - 1, schedule: { hw: { start: 960, dur: 30 } } })).plans).toEqual({});
    expect(initialState({}, {}, persisted({ planApproved: false, selectedDay: TODAY, schedule: { hw: { start: 960, dur: 30 } } })).plans).toEqual({});
  });

  it('keeps today’s and tomorrow’s plans and drafts, retiring past days', () => {
    const s = initialState({}, {}, persisted({
      plans: { [TODAY - 1]: { hw: { start: 1, dur: 30 } }, [TODAY]: { hw: { start: 960, dur: 30 } }, [TOMORROW]: {} },
      drafts: { [TODAY - 1]: { hw: { start: 2, dur: 30 } }, [TOMORROW]: { hw: { start: 390, dur: 30 } } },
    }));
    expect(Object.keys(s.plans).map(Number).sort()).toEqual([TODAY, TOMORROW]);
    expect(Object.keys(s.drafts).map(Number)).toEqual([TOMORROW]);
    expect(s.schedule).toBeUndefined();
  });
});

describe('when the day needs a restart', () => {
  const base = {
    taskDefs: [
      { id: 'a', category: 'school', subject: 'Matematyka', title: 'Algebra', dur: 40, day: TODAY },
      { id: 'b', category: 'school', subject: 'Biologia', title: 'Cells', dur: 30, day: TODAY },
      { id: 'r', category: 'personal', title: 'Read', day: TODAY },
    ],
    tasks: { a: true, b: true }, taskState: {}, daySummaries: {},
  };
  const withPlan = { ...base, plans: { [TODAY]: { a: { start: 960, dur: 40 }, b: { start: 1110, dur: 30 } } } };

  it('names the missed session once its time has passed', () => {
    expect(offTrackReason(withPlan, 999)).toBeNull();
    expect(offTrackReason(withPlan, 1001)).toMatchObject({ kind: 'missed', id: 'a', count: 1, left: 3, key: 'missed:a:' + TODAY });
    expect(offTrackReason(withPlan, 1150)).toMatchObject({ id: 'b', count: 2 });
  });

  it('stays quiet while a session runs, after it was done, or once the day is summarized', () => {
    expect(offTrackReason({ ...withPlan, activeTask: 'a' }, 1001)).toBeNull();
    expect(offTrackReason({ ...withPlan, taskState: { a: { status: 'completed' } } }, 1001)).toBeNull();
    expect(offTrackReason({ ...withPlan, daySummaries: { [localDateKey()]: {} } }, 1001)).toBeNull();
  });

  it('from 14:00 with no plan and tasks left', () => {
    const noPlan = { ...base, plans: {} };
    expect(offTrackReason(noPlan, 13 * 60 + 59)).toBeNull();
    expect(offTrackReason(noPlan, 14 * 60)).toMatchObject({ kind: 'noPlan', left: 3, key: 'noplan:' + TODAY });
    expect(offTrackReason({ ...noPlan, taskDefs: [] }, 16 * 60)).toBeNull();
  });
});

describe('a to-do at a set time', () => {
  const gym = { id: 'gym', category: 'personal', title: 'Gym', day: TODAY, at: '18:00', dur: 90 };
  const plain = { id: 'milk', category: 'personal', title: 'Buy milk', day: TODAY };
  const undated = { id: 'x', category: 'personal', title: 'Undated', at: '10:00', dur: 30 };

  it('blocks its time on its own day only', () => {
    expect(timedTodoBlocks([gym, plain, undated], TODAY)).toEqual([{ start: 1080, end: 1170, label: 'Gym', kind: 'todo', taskId: 'gym' }]);
    expect(timedTodoBlocks([gym], TOMORROW)).toEqual([]);
    expect(todoTimeLabel(gym)).toBe('18:00–19:30');
    expect(todoTimeLabel(plain)).toBeNull();
  });

  it('keeps study sessions out of that time', () => {
    const c = dayConstraints({ wake: '06:30', bedtime: '22:30', recurringActivities: [], dayNum: TODAY, extraBlocks: timedTodoBlocks([gym], TODAY) });
    expect(checkBlockConflict('hw', 18 * 60 + 30, 30, {}, () => hw, c)).not.toBeNull();
    expect(checkBlockConflict('hw', 16 * 60, 30, {}, () => hw, c)).toBeNull();
  });
});
