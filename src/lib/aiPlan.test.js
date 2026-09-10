import { describe, it, expect } from 'vitest';
import { toValidatedSchedule } from './aiPlan';

const taskDefs = [
  { id: 'math', subject: 'Matematyka', title: 'Funkcje', dur: 60, priority: 'Wysoki priorytet' },
  { id: 'bio', subject: 'Biologia', title: 'Genetyka', dur: 45, priority: 'Normalny priorytet' },
];
const ids = ['math', 'bio'];

// A fixed constraints fixture (rather than the app's real dayConstraints(),
// which reads the student's own bedtime/wake/recurring activities) so these
// tests describe an explicit, stable scenario.
const constraints = { wakeMinutes: 930, bedtimeMinutes: 1350, blocks: [] };

describe('toValidatedSchedule (safety net for AI plan proposals)', () => {
  it('accepts a well-formed, non-conflicting proposal', () => {
    const blocks = [{ taskId: 'math', start: 930 }, { taskId: 'bio', start: 1000 }];
    const schedule = toValidatedSchedule(blocks, ids, taskDefs, {}, constraints);
    expect(schedule).toEqual({ math: { start: 930, dur: 60 }, bio: { start: 1000, dur: 45 } });
  });

  it('rejects a proposal with a missing task', () => {
    const blocks = [{ taskId: 'math', start: 930 }];
    expect(toValidatedSchedule(blocks, ids, taskDefs, {}, constraints)).toBeNull();
  });

  it('rejects a proposal with an unknown or duplicated task id', () => {
    const dup = [{ taskId: 'math', start: 930 }, { taskId: 'math', start: 1100 }];
    expect(toValidatedSchedule(dup, ids, taskDefs, {}, constraints)).toBeNull();
    const unknown = [{ taskId: 'math', start: 930 }, { taskId: 'ghost', start: 1000 }];
    expect(toValidatedSchedule(unknown, ids, taskDefs, {}, constraints)).toBeNull();
  });

  it('rejects overlapping blocks', () => {
    const overlap = [{ taskId: 'math', start: 930 }, { taskId: 'bio', start: 950 }];
    expect(toValidatedSchedule(overlap, ids, taskDefs, {}, constraints)).toBeNull();
  });

  it('rejects a block that lands before wake or after bedtime', () => {
    expect(toValidatedSchedule([{ taskId: 'math', start: 800 }, { taskId: 'bio', start: 1000 }], ids, taskDefs, {}, constraints)).toBeNull();
    expect(toValidatedSchedule([{ taskId: 'math', start: 930 }, { taskId: 'bio', start: 1340 }], ids, taskDefs, {}, constraints)).toBeNull();
  });

  it('rejects malformed input instead of throwing', () => {
    expect(toValidatedSchedule(null, ids, taskDefs, {}, constraints)).toBeNull();
    expect(toValidatedSchedule([{ taskId: 'math', start: 'not a number' }], ids, taskDefs, {}, constraints)).toBeNull();
  });

  it('uses durOverride when computing each block\'s duration', () => {
    const blocks = [{ taskId: 'math', start: 930 }, { taskId: 'bio', start: 1010 }];
    const schedule = toValidatedSchedule(blocks, ids, taskDefs, { math: 20 }, constraints);
    expect(schedule.math.dur).toBe(20);
  });
});
