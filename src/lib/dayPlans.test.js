import { describe, it, expect } from 'vitest';
import { planFor, draftFor, workingPlan, plannedElsewhere, daySessionBreakdown, dayOpenTasks } from './plannerLogic';
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
