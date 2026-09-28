import { describe, it, expect } from 'vitest';
import { examsForAI, planningContextForAI, busyOnDay, taskForAI, dateOf } from './aiContext';
import { toValidatedExtras } from './aiPlan';
import { toValidatedPrep, toPrepCards } from './aiPrep';
import { NUM_TODAY } from './plannerData';

const T = NUM_TODAY;
const state = {
  taskDefs: [
    { id: 'hw', category: 'school', subject: 'Inny', title: 'Homework', dur: 30, note: 'pages 12-14' },
    { id: 'examsession-ex1-0', category: 'school', subject: 'Biologia', title: 'Cells — basics', dur: 30, day: T + 1 },
    { id: 'aireview-a-0', category: 'school', subject: 'Biologia', title: 'Review: Cells test', dur: 25, day: T, examId: 'ex1', aiSuggested: true },
    { id: 'aireview-b-0', category: 'school', subject: 'Biologia', title: 'Review (draft)', dur: 25, day: T + 1, examId: 'ex1', aiSuggested: true, pendingDraft: true },
    { id: 'book', category: 'personal', title: 'Read book', note: 'chapter 3' },
    { id: 'shop', category: 'personal', title: 'Shopping' },
    { id: 'later', category: 'school', subject: 'Fizyka', title: 'Lab report', dur: 45, day: T + 3 },
  ],
  tasks: { hw: true, shop: true },
  taskState: { 'examsession-ex1-0': { status: 'completed', day: T + 1 } },
  startOverride: { 'examsession-ex1-0': 17 * 60 },
  customExams: [
    { id: 'ex1', subject: 'Biologia', title: 'Cells test', day: T + 3, v: 2 },
    { id: 'old', subject: 'Chemia', title: 'Past test', day: T - 1, v: 2 },
  ],
  examGoals: { ex1: { grade: 'Ocena co najmniej 5', importance: 'Wysoki', studyMinutes: 180 } },
  examSessions: {
    ex1: [
      { title: 'Cells — basics', day: T + 1, time: '17:00–17:30', dur: 30, done: false },
      { title: 'Mixed exercises', day: T + 2, time: '18:00–18:40', dur: 40, done: false },
    ],
  },
  plans: {
    [T]: { hw: { start: 960, dur: 30 } },
    [T + 1]: { 'examsession-ex1-0': { start: 1020, dur: 30 } },
  },
};

describe('what the planning AI is told', () => {
  it('lists upcoming exams with their planned and finished study sessions', () => {
    const exams = examsForAI(state, T + 1);
    expect(exams.map((e) => e.examId)).toEqual(['ex1']);
    const e = exams[0];
    expect(e).toMatchObject({ subject: 'Biologia', date: dateOf(T + 3), daysAfterPlanDay: 2, targetGrade: 'Ocena co najmniej 5', targetStudyMinutes: 180 });
    expect(e.sessions.map((s) => [s.title, s.done, s.start])).toEqual([
      ['Cells — basics', true, 17 * 60],
      ['Mixed exercises', false, 18 * 60],
      ['Review: Cells test', false, undefined],
    ]);
  });

  it('gives the full picture for planning tomorrow', () => {
    const c = planningContextForAI(state, { dayNum: T + 1, recurringActivities: [{ name: 'Tennis', day: 'Wtorek', start: '18:00', dur: 60 }], note: '  tired after training  ' });
    expect(c.note).toBe('tired after training');
    expect(c.todos).toEqual([{ title: 'Read book', note: 'chapter 3' }]);
    expect(c.otherDayPlan).toEqual({ date: dateOf(T), sessions: [{ title: 'Inny — Homework', start: 960, durationMinutes: 30 }] });
    expect(c.upcomingTasks).toEqual([{ title: 'Fizyka — Lab report', date: dateOf(T + 3), durationMinutes: 45 }]);
    expect(c.weeklyActivities).toEqual([{ name: 'Tennis', day: 'Wtorek', start: '18:00', durationMinutes: 60 }]);
  });

  it('marks what is already taken on a day', () => {
    expect(busyOnDay(state, T + 2)).toEqual([{ title: 'Mixed exercises', start: 18 * 60, end: 18 * 60 + 40 }]);
    expect(busyOnDay(state, T + 1).map((b) => b.title)).toEqual(['Biologia — Cells — basics']);
  });

  it('passes a task’s note, chosen time and exam', () => {
    const d = state.taskDefs[1];
    expect(taskForAI(state, d, 30)).toMatchObject({ taskId: d.id, preferredStart: 17 * 60, forExam: 'Cells test' });
    expect(taskForAI(state, state.taskDefs[0], 30)).toMatchObject({ note: 'pages 12-14', preferredStart: null, forExam: null });
  });
});

describe('checking what the AI proposes', () => {
  const exams = [{ examId: 'ex1', subject: 'Biologia', title: 'Cells test', daysAfterPlanDay: 2 }, { examId: 'far', subject: 'Chemia', title: 'Far', daysAfterPlanDay: 12 }];
  const constraints = { wakeMinutes: 900, bedtimeMinutes: 1350, blocks: [{ start: 1080, end: 1140, label: 'Tennis' }] };
  const defs = [{ id: 'hw', subject: 'Inny' }];

  it('keeps review sessions that fit and drops the rest', () => {
    const out = toValidatedExtras([
      { examId: 'ex1', start: 1000, durationMinutes: 30, focus: 'cell division' },
      { examId: 'far', start: 1200, durationMinutes: 30 },
      { examId: 'ex1', start: 1090, durationMinutes: 30 },
      { examId: 'ghost', start: 1200, durationMinutes: 30 },
      { examId: 'ex1', start: 960, durationMinutes: 30 },
      { examId: 'ex1', start: 1200, durationMinutes: 5 },
      { examId: 'ex1', start: 1200, durationMinutes: 30 },
      { examId: 'ex1', start: 1260, durationMinutes: 30 },
    ], exams, { hw: { start: 960, dur: 30 } }, defs, constraints);
    expect(out.map((x) => [x.examId, x.start, x.dur, x.focus])).toEqual([['ex1', 1000, 30, 'cell division'], ['ex1', 1200, 30, '']]);
  });

  it('keeps exam study sessions that fit their own day', () => {
    const days = [
      { day: T + 1, date: dateOf(T + 1), wakeMinutes: 900, bedtimeMinutes: 1350, blocks: [], busy: [{ title: 'x', start: 1020, end: 1050 }] },
      { day: T + 2, date: dateOf(T + 2), wakeMinutes: 900, bedtimeMinutes: 1350, blocks: [{ start: 1080, end: 1140, label: 'Tennis' }], busy: [] },
    ];
    const out = toValidatedPrep([
      { date: dateOf(T + 2), start: '19:10', durationMinutes: 40, title: 'Exercises', type: 'Practice' },
      { date: dateOf(T + 2), start: '1650', durationMinutes: 40, title: 'Not a time' },
      { date: dateOf(T + 1), start: 1030, durationMinutes: 30, title: 'Clashes with busy' },
      { date: dateOf(T + 1), start: 960, durationMinutes: 30, title: 'Basics', why: 'start simple' },
      { date: dateOf(T + 5), start: 960, durationMinutes: 30, title: 'Not an offered day' },
      { date: dateOf(T + 2), start: 1100, durationMinutes: 30, title: 'On tennis' },
      { date: dateOf(T + 2), start: 1160, durationMinutes: 30, title: 'Overlaps the first' },
    ], days);
    expect(out.map((x) => [x.day, x.start, x.title])).toEqual([[T + 1, 960, 'Basics'], [T + 2, 1150, 'Exercises']]);
    expect(toPrepCards(out)[1]).toEqual({ title: 'Exercises', type: 'Practice', why: '', time: '19:10–19:50', dur: '40 min' });
    expect(toValidatedPrep([{ date: 'nope', start: 1, durationMinutes: 30, title: 'x' }], days)).toBeNull();
  });
});
