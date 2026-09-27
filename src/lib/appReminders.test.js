import { describe, it, expect, afterEach, vi } from 'vitest';
import { buildAppReminders } from './appReminders';
import { NUM_TODAY } from './plannerData';
import { localDateKey } from './plannerLogic';
import { translate, setCurrentLang } from './i18n';

// Pinned to today's real date (NUM_TODAY is worked out from it when the
// module loads), at a chosen time of day.
function at(h, m = 0, dayOffset = 0) {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dayOffset, h, m);
}
function history(daysBack) {
  const h = {};
  daysBack.forEach((n) => { h[localDateKey(at(12, 0, -n))] = { completed: true }; });
  return h;
}

const taskDefs = [
  { id: 'math', subject: 'Matematyka', title: 'Funkcje', dur: 45 },
  { id: 'bio', subject: 'Biologia', title: 'Genetyka', dur: 30 },
];
const baseState = { taskDefs, tasks: {}, taskState: {}, schedule: null, planApproved: false, selectedDay: NUM_TODAY, customExams: [] };
const titleOf = (id) => taskDefs.find((d) => d.id === id)?.title;
const tPl = (key, vars) => translate('pl', key, vars);
const tEn = (key, vars) => translate('en', key, vars);

function build(opts, lang = 'pl') {
  setCurrentLang(lang);
  return buildAppReminders({ studyHistory: {}, bedtime: '22:30', titleOf, t: lang === 'en' ? tEn : tPl, ...opts });
}

afterEach(() => {
  vi.useRealTimers();
  setCurrentLang('pl');
});

describe('buildAppReminders', () => {
  it('reminds 10 minutes before each planned session still ahead', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(16, 0));
    const state = {
      ...baseState,
      planApproved: true,
      schedule: { math: { start: 15 * 60, dur: 45 }, bio: { start: 17 * 60, dur: 30 } },
    };
    const list = build({ state });
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('session:bio:' + NUM_TODAY);
    expect(list[0].at).toBe(at(16, 50).getTime());
    expect(list[0].title).toBe('⏰ Genetyka za 10 minut');
    expect(list[0].body).toContain('17:00');
  });

  it('skips finished sessions and uses tomorrow’s date for tomorrow’s plan', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(20, 0));
    const state = {
      ...baseState,
      planApproved: true,
      selectedDay: NUM_TODAY + 1,
      schedule: { math: { start: 16 * 60, dur: 45 }, bio: { start: 17 * 60, dur: 30 } },
      taskState: { bio: { status: 'completed' } },
    };
    const list = build({ state }).filter((r) => r.id.startsWith('session'));
    expect(list.map((r) => r.id)).toEqual(['session:math:' + (NUM_TODAY + 1)]);
    expect(list[0].at).toBe(at(15, 50, 1).getTime());
  });

  it('ignores an old approved plan', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(8, 0));
    const state = { ...baseState, planApproved: true, selectedDay: NUM_TODAY - 2, schedule: { math: { start: 16 * 60, dur: 45 } } };
    expect(build({ state })).toEqual([]);
  });

  it('warns about the streak two hours before bedtime when nothing is studied yet', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(12, 0));
    const list = build({ state: baseState, studyHistory: history([1, 2, 3]) });
    expect(list).toHaveLength(1);
    expect(list[0].at).toBe(at(20, 30).getTime());
    expect(list[0].title).toBe('🔥 Twoja seria 3 dni jest zagrożona');
  });

  it('moves the streak warning to tomorrow once today is studied', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(12, 0));
    const list = build({ state: baseState, studyHistory: history([0, 1]) }, 'en');
    expect(list).toHaveLength(1);
    expect(list[0].at).toBe(at(20, 30, 1).getTime());
    expect(list[0].title).toBe('🔥 Your 2-day streak is at risk');
  });

  it('has no streak warning without a streak', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(12, 0));
    expect(build({ state: baseState, studyHistory: history([3]) })).toEqual([]);
  });

  it('treats a bedtime after midnight as the same evening', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(12, 0));
    const list = build({ state: baseState, bedtime: '00:30', studyHistory: history([1]), unfinishedTitles: ['Genetyka'] });
    expect(list.map((r) => [r.id.split(':')[0], r.at])).toEqual([
      ['streak', at(22, 30).getTime()],
      ['unfinished', at(23, 0).getTime()],
    ]);
  });

  it('lists unfinished tasks an hour before bedtime with the right plural', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(12, 0));
    const two = build({ state: baseState, unfinishedTitles: ['Funkcje', 'Genetyka'] });
    expect(two[0].at).toBe(at(21, 30).getTime());
    expect(two[0].title).toBe('📋 Zostało Ci 2 zadania na dziś');
    expect(two[0].body).toContain('Funkcje, Genetyka');
    const five = build({ state: baseState, unfinishedTitles: ['a', 'b', 'c', 'd', 'e'] });
    expect(five[0].title).toBe('📋 Zostało Ci 5 zadań na dziś');
    expect(five[0].body).toContain('a, b, c i 2 więcej');
    const one = build({ state: baseState, unfinishedTitles: ['a'] }, 'en');
    expect(one[0].title).toBe('📋 1 task left for today');
  });

  it('drops reminders whose time has passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(21, 45));
    expect(build({ state: baseState, unfinishedTitles: ['a'] })).toEqual([]);
  });

  it('reminds the evening before an exam, not for today’s', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(9, 0));
    const state = {
      ...baseState,
      customExams: [
        { id: 'e1', subject: 'Biologia', title: 'Sprawdzian z genetyki', day: NUM_TODAY + 3 },
        { id: 'e2', subject: 'Matematyka', title: 'Kartkówka', day: NUM_TODAY },
      ],
    };
    const list = build({ state }, 'en');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('exam:e1');
    expect(list[0].at).toBe(at(19, 0, 2).getTime());
    expect(list[0].title).toBe('🎯 Tomorrow: Sprawdzian z genetyki');
    expect(list[0].body).toContain('Biology');
  });

  it('adds a time-is-up reminder for a running session, not a paused one', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at(16, 0));
    const running = { ...baseState, activeTask: 'math', sessionStart: at(15, 50).getTime(), sessionElapsedMs: 0, sessionExtraMin: 2 };
    const list = build({ state: running });
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('focus-end');
    expect(list[0].at).toBe(at(16, 37).getTime());
    const paused = { ...running, sessionStart: null, sessionElapsedMs: 10 * 60000 };
    expect(build({ state: paused })).toEqual([]);
  });
});
