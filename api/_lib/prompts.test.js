import { describe, it, expect } from 'vitest';
import { buildPlanUserMessage } from './plan.js';
import { buildRescueUserMessage } from './rescue.js';
import { buildPrepUserMessage } from './prep.js';
import { buildChatSystemPrompt } from './chat.js';
import { aboutMeLines } from './context.js';

const context = {
  planDate: '2026-09-29', planWeekday: 'Wtorek', today: '2026-09-28',
  note: 'Tired after training',
  exams: [{ examId: 'ex1', subject: 'Biologia', title: 'Cells test', date: '2026-10-01', daysAfterPlanDay: 2, targetGrade: 'Ocena co najmniej 5', importance: 'Wysoki', targetStudyMinutes: 180,
    sessions: [{ title: 'Cells — basics', date: '2026-09-29', start: 1020, durationMinutes: 30, done: true }] }],
  todos: [{ title: 'Read book', note: 'chapter 3' }],
  otherDayPlan: { date: '2026-09-28', sessions: [{ title: 'Inny — Homework', start: 960, durationMinutes: 30 }] },
  doneToday: [], upcomingTasks: [{ title: 'Fizyka — Lab report', date: '2026-10-01', durationMinutes: 45 }],
  weeklyActivities: [{ name: 'Tennis', day: 'Wtorek', start: '18:00', durationMinutes: 60 }],
};
const tasks = [{ taskId: 'm', subject: 'Matematyka', title: 'Algebra', durationMinutes: 40, priority: 'Wysoki priorytet', note: 'ex. 5-9', preferredStart: 1020, forExam: 'Cells test' }];
const constraints = { wakeMinutes: 390, bedtimeMinutes: 1350, blocks: [] };

describe('prompts include everything the student added', () => {
  it('day plan', () => {
    const msg = buildPlanUserMessage(tasks, 'Normalna', 'Wolny wieczór', '', [], [], '', constraints, context);
    for (const bit of ['Tired after training', 'examId: ex1', 'Cells test', 'data: 2026-10-01', 'cel: Ocena co najmniej 5', 'Cells — basics (2026-09-29 17:00, 30 min) — ZROBIONE',
      'Read book (notatka: chapter 3)', 'Inny — Homework 16:00', 'Fizyka — Lab report', 'Tennis: Wtorek 18:00', 'notatka: ex. 5-9', 'godzinę 17:00', 'przygotowanie do: Cells test']) {
      expect(msg).toContain(bit);
    }
  });

  it('restart my day', () => {
    const msg = buildRescueUserMessage(tasks, 'Niska', 60, ['Plan się opóźnił'], '', [], [], '', constraints, context);
    expect(msg).toContain('Cells test');
    expect(msg).toContain('notatka: ex. 5-9');
  });

  it('exam study plan', () => {
    const msg = buildPrepUserMessage(
      { kind: 'Sprawdzian', subject: 'Biologia', title: 'Cells test', date: '2026-10-01', time: '09:00', daysUntil: 3, topics: ['Cell structure', 'Mitosis'], difficulty: 'Średni', level: 'Znam podstawy', goal: 'Ocena co najmniej 5' },
      [{ date: '2026-09-29', weekday: 'Wtorek', wakeMinutes: 390, bedtimeMinutes: 1350, blocks: [{ label: 'School', start: 480, end: 930 }], busy: [{ title: 'Algebra', start: 1020, end: 1060 }], dueTasks: ['Lab report'] }],
      { exams: context.exams },
    );
    for (const bit of ['Cells test', 'Cell structure; Mitosis', 'Znam podstawy', '2026-09-29 (Wtorek): wolne od 06:30 do 22:30', 'School 08:00–15:30', 'zajęte: Algebra 17:00–17:40', 'Lab report', 'Inne sprawdziany ucznia']) {
      expect(msg).toContain(bit);
    }
  });
});

describe('chat language', () => {
  it('answers in the language the student writes in, the app language as fallback', async () => {
    const { buildChatSystemPrompt } = await import('./chat.js');
    const en = buildChatSystemPrompt(null, 'en');
    expect(en).toContain("same language as the student's latest message");
    expect(en).toContain('reply in English');
    expect(en).not.toMatch(/zawsze po polsku/);
    expect(buildChatSystemPrompt(null, 'pl')).toContain('reply in Polish');
  });
});

describe('what Pulgo knows about the student', () => {
  const aboutMe = { facts: ['Best time to study: Evening', 'Every week: School Mon–Fri'], note: 'I get tired after 2 hours.' };
  it('goes into the plan, prep and chat prompts', () => {
    const plan = buildPlanUserMessage(tasks, 'Normalna', 'Wolny wieczór', '', [], [], '', constraints, { ...context, aboutMe });
    expect(plan).toContain('Profil ucznia: Best time to study: Evening; Every week: School Mon–Fri.');
    expect(plan).toContain('I get tired after 2 hours.');
    const prep = buildPrepUserMessage({ subject: 'Biologia', title: 'Cells', date: '2026-10-01', daysUntil: 3, topics: [] }, [], { exams: [], aboutMe });
    expect(prep).toContain('I get tired after 2 hours.');
    expect(buildChatSystemPrompt({ aboutMe }, 'en')).toContain('Every week: School Mon–Fri');
  });
  it('adds nothing when there is nothing to say', () => {
    expect(aboutMeLines(null)).toEqual([]);
    expect(aboutMeLines({ facts: [], note: null })).toEqual([]);
  });
});

describe('answers in the app language', () => {
  it('names any app language for the AI, Polish when unknown', async () => {
    const { buildPlanSystemPrompt } = await import('./plan.js');
    expect(buildPlanSystemPrompt('ja')).toContain('Respond in Japanese');
    expect(buildPlanSystemPrompt('pl')).toContain('Odpowiadaj po polsku');
    expect(buildPlanSystemPrompt('xx')).toContain('Odpowiadaj po polsku');
    expect(buildChatSystemPrompt(null, 'de')).toContain('reply in German');
  });

  it('writes push notifications in the app language', async () => {
    const { composeRestartMessage, composeUnfinishedMessage } = await import('./pushMessages.js');
    expect(composeRestartMessage('es').title).toBe('🔄 Reinicia tu día');
    expect(composeUnfinishedMessage('pl', ['A', 'B', 'C', 'D', 'E']).title).toBe('📋 Zostało Ci 5 zadań na dziś');
    expect(composeUnfinishedMessage('xx', ['A']).title).toBe('📋 Zostało Ci 1 zadanie na dziś');
  });
});
