import { describe, it, expect } from 'vitest';
import { weekDayItems } from './weekView';
import { NUM_TODAY } from './plannerData';
import { dayInfo } from './plannerLogic';

const T = NUM_TODAY;
const t = (k) => ({ 'val.subjMath': 'Math', 'val.subjBio': 'Biology' }[k] || '');

function baseState(extra = {}) {
  return {
    taskDefs: [
      { id: 'math', category: 'school', subject: 'Matematyka', title: 'Vectors', dur: 45, day: T },
      { id: 'gym', category: 'personal', title: 'Gym', day: T, at: '18:00', dur: 60 },
      { id: 'prep', category: 'school', subject: 'Biologia', title: 'Practice problems', dur: 45, day: T + 1 },
    ],
    tasks: { math: true, prep: true },
    taskState: { math: { status: 'completed' } },
    plans: { [T]: { math: { start: 16 * 60, dur: 45 } } },
    startOverride: { prep: 16 * 60 + 30 },
    customExams: [{ id: 'quiz', subject: 'Matematyka', title: 'Vectors quiz', day: T + 2 }],
    ...extra,
  };
}

describe('weekDayItems', () => {
  it('lists a planned day: sessions, timed to-dos and weekly activities, by time', () => {
    const recurring = [{ id: 1, name: 'School', day: dayInfo(T).label, start: '08:00', dur: 450 }];
    const items = weekDayItems(baseState(), T, recurring, t);
    expect(items.map((i) => [i.kind, i.start])).toEqual([['school', 480], ['study', 960], ['todo', 1080]]);
    expect(items[1]).toMatchObject({ done: true });
  });

  it('shows a day’s own study tasks (e.g. exam prep) before that day is planned', () => {
    const items = weekDayItems(baseState(), T + 1, [], t);
    expect(items).toEqual([expect.objectContaining({ kind: 'study', start: 990, done: false })]);
  });

  it('puts tests first and doesn’t repeat a to-do that is already in the plan', () => {
    const state = baseState({ plans: { [T]: { math: { start: 960, dur: 45 }, gym: { start: 1080, dur: 60 } } } });
    expect(weekDayItems(state, T, [], t).filter((i) => i.kind === 'todo')).toHaveLength(1);
    const exam = weekDayItems(baseState(), T + 2, [], t);
    expect(exam[0]).toMatchObject({ kind: 'test', start: -1 });
  });
});
