import { describe, it, expect } from 'vitest';
import { freshExamForm, initialState } from './usePlanner';

describe('add-exam form', () => {
  it('starts blank: no name, no topics, nothing marked as saved', () => {
    const f = freshExamForm();
    expect(f).toMatchObject({ nameValue: '', topics: [], topicErr: false, deadlineOnlySaved: false, prepSaved: false, onlyDeadlineAsk: false, autoPlan: true });
    expect(f.examDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is what the app starts with, so a reset gives the same form', () => {
    const s = initialState({}, null, null);
    const fresh = freshExamForm();
    for (const [key, value] of Object.entries(fresh)) expect(s[key]).toEqual(value);
  });
});
