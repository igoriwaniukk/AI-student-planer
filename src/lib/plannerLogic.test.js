import { describe, it, expect, afterEach } from 'vitest';
import {
  fmt, span, toMinutes, hm, activeIds, lightenForEnergy, buildSchedule, buildRescueSchedule,
  checkBlockConflict, computeStreak, computeTotalPoints, weeklyReview, examAtRisk,
} from './plannerLogic';
import { setCurrentLang } from './i18n';

const taskDefs = [
  { id: 'math', subject: 'Matematyka', title: 'Funkcje kwadratowe', dur: 60, priority: 'Wysoki priorytet' },
  { id: 'bio', subject: 'Biologia', title: 'Genetyka', dur: 45, priority: 'Normalny priorytet' },
  { id: 'eng', subject: 'Angielski', title: 'Słówka', dur: 30, priority: 'Niższy priorytet' },
];
const allEnabled = { math: true, bio: true, eng: true };
const allPlanned = { math: { status: 'planned' }, bio: { status: 'planned' }, eng: { status: 'planned' } };

// A fixed constraints fixture (rather than the app's real dayConstraints(),
// which reads the student's own bedtime/wake/recurring activities) so these
// tests describe an explicit, stable scenario: earliest start 15:30, one
// blocked activity 18:00–19:00 ("Tenis"), bedtime 22:30.
const constraints = { wakeMinutes: 930, bedtimeMinutes: 1350, blocks: [{ start: 1080, end: 1140, label: 'Tenis' }] };

afterEach(() => setCurrentLang('pl'));

describe('time formatting', () => {
  it('fmt pads and wraps at 24h', () => {
    expect(fmt(930)).toBe('15:30');
    expect(fmt(0)).toBe('00:00');
    expect(fmt(1440)).toBe('00:00');
  });

  it('span joins two fmt() calls with an en dash', () => {
    expect(span(930, 990)).toBe('15:30–16:30');
  });

  it('toMinutes parses HH:MM', () => {
    expect(toMinutes('15:30')).toBe(930);
    expect(toMinutes('00:00')).toBe(0);
  });

  it('hm formats duration per language', () => {
    setCurrentLang('pl');
    expect(hm(90)).toBe('1 godz. 30 min');
    expect(hm(60)).toBe('1 godz.');
    expect(hm(30)).toBe('30 min');
    setCurrentLang('en');
    expect(hm(90)).toBe('1 hr 30 min');
  });
});

describe('activeIds', () => {
  it('excludes disabled tasks and moved/skipped ones', () => {
    expect(activeIds(taskDefs, allEnabled, allPlanned)).toEqual(['math', 'bio', 'eng']);
    expect(activeIds(taskDefs, { math: true, bio: false, eng: true }, allPlanned)).toEqual(['math', 'eng']);
    expect(activeIds(taskDefs, allEnabled, { ...allPlanned, bio: { status: 'moved' } })).toEqual(['math', 'eng']);
    expect(activeIds(taskDefs, allEnabled, { ...allPlanned, eng: { status: 'skipped' } })).toEqual(['math', 'bio']);
  });
});

describe('lightenForEnergy', () => {
  it('leaves duration alone at normal/high energy', () => {
    expect(lightenForEnergy(60, 'Normalna')).toBe(60);
    expect(lightenForEnergy(60, 'Wysoka')).toBe(60);
  });

  it('shortens by ~20% (rounded to 5) at low energy, floored at 15', () => {
    expect(lightenForEnergy(60, 'Niska')).toBe(50);
    expect(lightenForEnergy(20, 'Niska')).toBe(15);
  });
});

describe('buildSchedule', () => {
  it('places active tasks back to back with a break between them', () => {
    const sched = buildSchedule({ taskDefs, tasks: allEnabled, taskState: allPlanned, energy: 'Normalna', pref: 'Wolny wieczór', constraints });
    expect(sched.math).toEqual({ start: 930, dur: 60 });
    expect(sched.bio).toEqual({ start: 930 + 60 + 10, dur: 45 });
    // eng would naturally start at 1055 and run to 1085, straddling the
    // 1080–1140 blocked window ("Tenis"), so it gets pushed to start right
    // when that window ends instead.
    expect(sched.eng).toEqual({ start: 1140, dur: 30 });
  });

  it('jumps a block that would straddle a blocked window to right after it', () => {
    // A single big task starting at 930 would run 930→1230, straddling
    // 1080–1140 — it must be pushed to start at 1140 instead.
    const bigDef = [{ id: 'big', subject: 'Matematyka', title: 'Maraton', dur: 300, priority: 'Wysoki priorytet' }];
    const sched = buildSchedule({
      taskDefs: bigDef, tasks: { big: true }, taskState: { big: { status: 'planned' } }, energy: 'Normalna', pref: 'Wolny wieczór', constraints,
    });
    expect(sched.big.start).toBe(1140);
  });

  it('respects durOverride and startOverride', () => {
    const sched = buildSchedule({
      taskDefs, tasks: allEnabled, taskState: allPlanned, energy: 'Normalna', pref: 'Wolny wieczór',
      durOverride: { math: 20 }, startOverride: { bio: 1200 }, constraints,
    });
    expect(sched.math.dur).toBe(20);
    expect(sched.bio.start).toBe(1200);
  });

  it('starts from the student\'s own wake time and skips their own recurring activities, not an invented school/tennis schedule', () => {
    const custom = { wakeMinutes: 480, bedtimeMinutes: 1320, blocks: [{ start: 600, end: 660, label: 'Poranny bieg' }] };
    const oneTask = [{ id: 'x', subject: 'Fizyka', title: 'Kinematyka', dur: 30, priority: 'Wysoki priorytet' }];
    const sched = buildSchedule({ taskDefs: oneTask, tasks: { x: true }, taskState: { x: { status: 'planned' } }, energy: 'Normalna', pref: 'Wolny wieczór', constraints: custom });
    expect(sched.x).toEqual({ start: 480, dur: 30 });
  });
});

describe('checkBlockConflict', () => {
  const def = (id) => taskDefs.find((t) => t.id === id);

  it('flags a start before the student\'s wake time', () => {
    expect(checkBlockConflict('math', 800, 30, {}, def, constraints)).toEqual({ key: 'block.conflictWake', vars: { time: '15:30' } });
  });

  it('flags anything overlapping a blocked recurring activity, naming it', () => {
    expect(checkBlockConflict('math', 1060, 30, {}, def, constraints)).toEqual({ key: 'block.conflictActivity', vars: { name: 'Tenis' } });
  });

  it('flags anything ending after the student\'s bedtime', () => {
    expect(checkBlockConflict('math', 1340, 20, {}, def, constraints)).toEqual({ key: 'block.conflictSleep', vars: { time: '22:30' } });
  });

  it('flags overlap with another scheduled block, naming its subject', () => {
    const schedule = { bio: { start: 930, dur: 60 } };
    expect(checkBlockConflict('math', 960, 30, schedule, def, constraints)).toEqual({ key: 'block.conflictOther', vars: { subject: 'Biologia' } });
  });

  it('allows a valid, non-overlapping time', () => {
    const schedule = { bio: { start: 930, dur: 60 } };
    expect(checkBlockConflict('math', 1000, 30, schedule, def, constraints)).toBeNull();
  });
});

describe('buildRescueSchedule', () => {
  it('keeps everything at full length when the budget covers it', () => {
    const { schedule, decisions } = buildRescueSchedule({
      taskDefs, tasks: allEnabled, taskState: allPlanned, energy: 'Normalna', availableMinutes: 300, constraints,
    });
    expect(Object.keys(schedule)).toHaveLength(3);
    expect(decisions).toEqual({ math: 'kept', bio: 'kept', eng: 'kept' });
    expect(schedule.math.dur).toBe(60);
  });

  it('protects higher-priority tasks first when the budget is tight, staying within budget', () => {
    const { schedule, decisions } = buildRescueSchedule({
      taskDefs, tasks: allEnabled, taskState: allPlanned, energy: 'Normalna', availableMinutes: 70, constraints,
    });
    const totalDur = Object.values(schedule).reduce((a, b) => a + b.dur, 0);
    expect(totalDur).toBeLessThanOrEqual(70);
    // Highest priority (math) must never be the one dropped while a lower one is kept.
    expect(decisions.math).not.toBe('moved');
  });

  it('marks a task moved once the sleep bound would otherwise be exceeded', () => {
    const lateDefs = [{ id: 'a', subject: 'Matematyka', title: 'A', dur: 300, priority: 'Wysoki priorytet' }, { id: 'b', subject: 'Biologia', title: 'B', dur: 300, priority: 'Normalny priorytet' }];
    const { decisions } = buildRescueSchedule({
      taskDefs: lateDefs, tasks: { a: true, b: true }, taskState: { a: { status: 'planned' }, b: { status: 'planned' } },
      energy: 'Normalna', availableMinutes: 600, constraints,
    });
    expect(decisions.b).toBe('moved');
  });
});

describe('computeStreak / computeTotalPoints / weeklyReview', () => {
  function isoDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  it('counts consecutive completed days ending yesterday when today has no entry', () => {
    const history = { [isoDaysAgo(1)]: { completed: true }, [isoDaysAgo(2)]: { completed: true }, [isoDaysAgo(3)]: { completed: false } };
    expect(computeStreak(history)).toBe(2);
  });

  it('returns 0 for an empty history', () => {
    expect(computeStreak({})).toBe(0);
  });

  it('scores 20 per completed day and 2 per energy check-in', () => {
    const history = { [isoDaysAgo(0)]: { completed: true }, [isoDaysAgo(1)]: { completed: false } };
    expect(computeTotalPoints(history, [1, 2, 3])).toBe(20 + 6);
  });

  it('sums planned/actual minutes and computes a completion rate over the last 7 days', () => {
    const history = {
      [isoDaysAgo(0)]: { plannedMin: 60, actualMin: 50, completed: true },
      [isoDaysAgo(1)]: { plannedMin: 40, actualMin: 40, completed: true },
    };
    const review = weeklyReview(history);
    expect(review.plannedMin).toBe(100);
    expect(review.actualMin).toBe(90);
    expect(review.completedDays).toBe(2);
    expect(review.trackedDays).toBe(2);
    expect(review.rate).toBe(100);
  });
});

describe('examAtRisk', () => {
  const state = { taskState: {} };

  it('is false once the exam has already happened', () => {
    expect(examAtRisk(state, { id: 'x', daysUntil: 0 }, { studyMinutes: 500 })).toBe(false);
  });

  it('is false without a goal', () => {
    expect(examAtRisk(state, { id: 'x', daysUntil: 3 }, null)).toBe(false);
  });

  it('flags a goal that cannot fit at ~90 min/day in the remaining days', () => {
    expect(examAtRisk(state, { id: 'x', daysUntil: 2 }, { studyMinutes: 500 })).toBe(true);
  });

  it('does not flag a goal that comfortably fits', () => {
    expect(examAtRisk(state, { id: 'x', daysUntil: 10 }, { studyMinutes: 200 })).toBe(false);
  });
});
