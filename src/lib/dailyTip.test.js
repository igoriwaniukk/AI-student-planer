import { describe, it, expect } from 'vitest';
import { dailyTip } from './dailyTip';
import { NUM_TODAY } from './plannerData';

const state = (exams = []) => ({ customExams: exams });
const noon = new Date(2026, 10, 9, 12);

describe('dailyTip', () => {
  it('puts an exam in the next 3 days first', () => {
    const tip = dailyTip(state([{ title: 'Genetics test', subject: 'Biologia', day: NUM_TODAY + 3 }]), { streak: 4, now: noon });
    expect(tip.key).toBe('tip.examSoon');
    expect(tip.vars.days).toBe(3);
    expect(dailyTip(state([{ title: 'X', day: NUM_TODAY + 1 }]), { now: noon }).key).toBe('tip.examTomorrow');
    expect(dailyTip(state([{ title: 'X', day: NUM_TODAY }]), { now: noon }).key).toBe('tip.examToday');
  });
  it('then the streak, the day being done, and the evening', () => {
    expect(dailyTip(state([{ title: 'X', day: NUM_TODAY + 5 }]), { streak: 4, now: noon })).toMatchObject({ key: 'tip.keepStreak', vars: { n: 4 } });
    expect(dailyTip(state(), { streak: 4, doneToday: true, now: noon }).key).toBe('tip.doneToday');
    expect(dailyTip(state(), { now: new Date(2026, 10, 9, 22) }).key).toBe('tip.evening');
  });
  it('otherwise a general tip that changes by day', () => {
    const a = dailyTip(state(), { now: noon }).key;
    const b = dailyTip(state(), { now: new Date(2026, 10, 10, 12) }).key;
    expect(a).toMatch(/^tip\.general[0-4]$/);
    expect(a).not.toBe(b);
  });
});
