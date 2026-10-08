import { describe, it, expect } from 'vitest';
import { groupActivities, saveActivityLine, removeActivities, activityDuration, upcomingTasks, groupPlanTasks, examStudySessions } from './plansView';
import { NUM_TODAY } from './plannerData';

const school = (id, day, start, dur) => ({ id, name: 'School', day, start, dur });
const list = [
  school(1, 'Poniedziałek', '08:55', 395),
  school(2, 'Wtorek', '08:00', 450),
  school(3, 'Środa', '08:00', 450),
  school(4, 'Czwartek', '08:55', 395),
  school(5, 'Piątek', '08:00', 450),
  { id: 6, name: 'Football', day: 'Czwartek', start: '17:00', dur: 90 },
  { id: 7, name: 'football ', day: 'Wtorek', start: '17:00', dur: 90 },
];

describe('weekly activities on the Plans screen', () => {
  it('shows one card per name, one line per time, days in week order', () => {
    const groups = groupActivities(list);
    expect(groups.map((g) => g.name)).toEqual(['School', 'Football']);
    const [s, f] = groups;
    expect(s.lines.map((l) => [l.days, l.start, l.end])).toEqual([
      [['Poniedziałek', 'Czwartek'], '08:55', '15:30'],
      [['Wtorek', 'Środa', 'Piątek'], '08:00', '15:30'],
    ]);
    expect(s.ids.sort()).toEqual([1, 2, 3, 4, 5]);
    expect(f.lines).toHaveLength(1);
    expect(f.lines[0].days).toEqual(['Wtorek', 'Czwartek']);
  });

  it('adds one entry per ticked day', () => {
    const out = saveActivityLine([], { name: ' Piano ', days: ['Środa', 'Poniedziałek'], start: '16:00', end: '17:30' }, 100);
    expect(out).toEqual([
      { id: 100, name: 'Piano', day: 'Poniedziałek', start: '16:00', dur: 90 },
      { id: 101, name: 'Piano', day: 'Środa', start: '16:00', dur: 90 },
    ]);
  });

  it('editing a line replaces only its days and keeps their ids', () => {
    const [s] = groupActivities(list);
    const tueWedFri = s.lines[1];
    const out = saveActivityLine(list, { replaceIds: tueWedFri.ids, name: 'School', days: ['Wtorek', 'Piątek', 'Sobota'], start: '08:10', end: '14:00' }, 100);
    const schoolDays = out.filter((a) => a.name === 'School');
    expect(schoolDays.map((a) => [a.id, a.day, a.start, a.dur]).sort((a, b) => a[0] - b[0])).toEqual([
      [1, 'Poniedziałek', '08:55', 395],
      [2, 'Wtorek', '08:10', 350],
      [4, 'Czwartek', '08:55', 395],
      [5, 'Piątek', '08:10', 350],
      [100, 'Sobota', '08:10', 350],
    ]);
    expect(out.find((a) => a.id === 3)).toBeUndefined();
    expect(new Set(out.map((a) => a.id)).size).toBe(out.length);
  });

  it('an end before the start saves the shortest slot', () => {
    expect(activityDuration('18:00', '17:00')).toBe(15);
  });

  it('deletes by ids', () => {
    expect(removeActivities(list, [6, 7]).map((a) => a.name)).not.toContain('Football');
  });
});

describe('tasks on the Plans screen', () => {
  const defs = [
    { id: 'today', category: 'school', subject: 'Matematyka', title: 'A', dur: 30, day: NUM_TODAY },
    { id: 'tmrw', category: 'school', subject: 'Biologia', title: 'B', dur: 30, day: NUM_TODAY + 1 },
    { id: 'float', category: 'personal', title: 'C' },
    { id: 'later', category: 'school', subject: 'Polski', title: 'D', dur: 30, day: NUM_TODAY + 4 },
    { id: 'rep', category: 'school', subject: 'Polski', title: 'E', dur: 20, repeatDays: ['Poniedziałek'] },
    { id: 'past', category: 'school', title: 'F', dur: 30, day: NUM_TODAY - 1 },
    { id: 'done', category: 'school', title: 'G', dur: 30, day: NUM_TODAY + 2 },
    { id: 'examsession-x-0', category: 'school', title: 'H', dur: 30, day: NUM_TODAY + 2 },
    { id: 'aireview-1', category: 'school', title: 'I', dur: 30, day: NUM_TODAY + 1, pendingDraft: true },
  ];
  const state = { taskDefs: defs, tasks: {}, taskState: { done: { status: 'completed' } } };

  it('groups what is still ahead into today, tomorrow, later and repeating', () => {
    const groups = groupPlanTasks(upcomingTasks(state));
    expect(groups.map((g) => [g.key, g.items.map((d) => d.id)])).toEqual([
      ['today', ['today']],
      ['tomorrow', ['tmrw', 'float']],
      ['later', ['later']],
      ['repeating', ['rep']],
    ]);
  });

  it('leaves out empty groups', () => {
    expect(groupPlanTasks([defs[0]]).map((g) => g.key)).toEqual(['today']);
  });
});

describe('an exam’s study sessions', () => {
  it('lists prep sessions and approved AI reviews in date order with what is done', () => {
    const state = {
      examSessions: { e1: [
        { title: 'Read notes', day: NUM_TODAY + 2, time: '16:00–16:45', dur: 45, done: false },
        { title: 'Practice test', day: NUM_TODAY, time: '17:00–17:30', dur: 30, done: true },
      ] },
      taskDefs: [
        { id: 'aireview-a', examId: 'e1', aiSuggested: true, title: 'Quick review', dur: 20, day: NUM_TODAY + 1 },
        { id: 'aireview-b', examId: 'e1', aiSuggested: true, pendingDraft: true, title: 'Draft only', dur: 20, day: NUM_TODAY + 1 },
      ],
      taskState: { 'examsession-e1-0': { status: 'completed' } },
      plans: { [NUM_TODAY + 1]: { 'aireview-a': { start: 18 * 60, dur: 20 } } },
    };
    const s = examStudySessions(state, 'e1');
    expect(s.map((x) => [x.title, x.done, x.time])).toEqual([
      ['Practice test', true, '17:00–17:30'],
      ['Quick review', false, '18:00–18:20'],
      ['Read notes', true, '16:00–16:45'],
    ]);
  });
});
