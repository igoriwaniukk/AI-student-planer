import { describe, it, expect } from 'vitest';
import { toValidatedRescue } from './aiRescue';

const taskDefs = [
  { id: 'math', subject: 'Matematyka', title: 'Funkcje', dur: 60, priority: 'Wysoki priorytet' },
  { id: 'bio', subject: 'Biologia', title: 'Genetyka', dur: 45, priority: 'Normalny priorytet' },
  { id: 'eng', subject: 'Angielski', title: 'Słówka', dur: 30, priority: 'Niższy priorytet' },
];
const ids = ['math', 'bio', 'eng'];

// A fixed constraints fixture (rather than the app's real dayConstraints(),
// which reads the student's own bedtime/wake/recurring activities) so these
// tests describe an explicit, stable scenario.
const constraints = { wakeMinutes: 930, bedtimeMinutes: 1350, blocks: [] };

describe('toValidatedRescue (safety net for AI rescue proposals)', () => {
  it('accepts a well-formed proposal that stays within budget', () => {
    const blocks = [{ taskId: 'math', start: 930, dur: 60 }, { taskId: 'bio', start: 1000, dur: 20 }];
    const result = toValidatedRescue(blocks, ['eng'], ids, taskDefs, {}, 90, constraints);
    expect(result).toEqual({
      schedule: { math: { start: 930, dur: 60 }, bio: { start: 1000, dur: 20 } },
      decisions: { math: 'kept', bio: 'shortened', eng: 'moved' },
    });
  });

  it('rejects a proposal that exceeds the available time budget', () => {
    const blocks = [{ taskId: 'math', start: 930, dur: 60 }, { taskId: 'bio', start: 1000, dur: 45 }];
    expect(toValidatedRescue(blocks, ['eng'], ids, taskDefs, {}, 90, constraints)).toBeNull();
  });

  it('rejects a block whose duration was lengthened beyond the original', () => {
    const blocks = [{ taskId: 'math', start: 930, dur: 90 }];
    expect(toValidatedRescue(blocks, ['bio', 'eng'], ids, taskDefs, {}, 200, constraints)).toBeNull();
  });

  it('rejects a proposal that leaves a task neither scheduled nor moved', () => {
    const blocks = [{ taskId: 'math', start: 930, dur: 60 }];
    expect(toValidatedRescue(blocks, ['bio'], ids, taskDefs, {}, 200, constraints)).toBeNull();
  });

  it('rejects a task appearing in both blocks and moved', () => {
    const blocks = [{ taskId: 'math', start: 930, dur: 60 }];
    expect(toValidatedRescue(blocks, ['math', 'bio', 'eng'], ids, taskDefs, {}, 200, constraints)).toBeNull();
  });

  it('rejects overlapping blocks even if the total duration is within budget', () => {
    const blocks = [{ taskId: 'math', start: 930, dur: 60 }, { taskId: 'bio', start: 950, dur: 20 }];
    expect(toValidatedRescue(blocks, ['eng'], ids, taskDefs, {}, 200, constraints)).toBeNull();
  });

  it('rejects malformed input instead of throwing', () => {
    expect(toValidatedRescue(null, [], ids, taskDefs, {}, 90, constraints)).toBeNull();
    expect(toValidatedRescue([{ taskId: 'math', start: 930, dur: 'soon' }], ['bio', 'eng'], ids, taskDefs, {}, 90, constraints)).toBeNull();
  });
});
