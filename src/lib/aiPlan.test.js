import { describe, it, expect } from 'vitest';
import { toValidatedSchedule } from './aiPlan';

const taskDefs = [
  { id: 'math', subject: 'Matematyka', title: 'Funkcje', dur: 60, priority: 'Wysoki priorytet' },
  { id: 'bio', subject: 'Biologia', title: 'Genetyka', dur: 45, priority: 'Normalny priorytet' },
];
const ids = ['math', 'bio'];

describe('toValidatedSchedule (safety net for AI plan proposals)', () => {
  it('accepts a well-formed, non-conflicting proposal', () => {
    const blocks = [{ taskId: 'math', start: 930 }, { taskId: 'bio', start: 1000 }];
    const schedule = toValidatedSchedule(blocks, ids, taskDefs, {});
    expect(schedule).toEqual({ math: { start: 930, dur: 60 }, bio: { start: 1000, dur: 45 } });
  });

  it('rejects a proposal with a missing task', () => {
    const blocks = [{ taskId: 'math', start: 930 }];
    expect(toValidatedSchedule(blocks, ids, taskDefs, {})).toBeNull();
  });

  it('rejects a proposal with an unknown or duplicated task id', () => {
    const dup = [{ taskId: 'math', start: 930 }, { taskId: 'math', start: 1100 }];
    expect(toValidatedSchedule(dup, ids, taskDefs, {})).toBeNull();
    const unknown = [{ taskId: 'math', start: 930 }, { taskId: 'ghost', start: 1000 }];
    expect(toValidatedSchedule(unknown, ids, taskDefs, {})).toBeNull();
  });

  it('rejects overlapping blocks', () => {
    const overlap = [{ taskId: 'math', start: 930 }, { taskId: 'bio', start: 950 }];
    expect(toValidatedSchedule(overlap, ids, taskDefs, {})).toBeNull();
  });

  it('rejects a block that lands during school or after bedtime', () => {
    expect(toValidatedSchedule([{ taskId: 'math', start: 800 }, { taskId: 'bio', start: 1000 }], ids, taskDefs, {})).toBeNull();
    expect(toValidatedSchedule([{ taskId: 'math', start: 930 }, { taskId: 'bio', start: 1340 }], ids, taskDefs, {})).toBeNull();
  });

  it('rejects malformed input instead of throwing', () => {
    expect(toValidatedSchedule(null, ids, taskDefs, {})).toBeNull();
    expect(toValidatedSchedule([{ taskId: 'math', start: 'not a number' }], ids, taskDefs, {})).toBeNull();
  });

  it('uses durOverride when computing each block\'s duration', () => {
    const blocks = [{ taskId: 'math', start: 930 }, { taskId: 'bio', start: 1010 }];
    const schedule = toValidatedSchedule(blocks, ids, taskDefs, { math: 20 });
    expect(schedule.math.dur).toBe(20);
  });
});
