import { describe, it, expect } from 'vitest';
import { chatHistory } from './useChat';

describe('chatHistory', () => {
  it('sends the earlier conversation, without the limit messages', () => {
    const msgs = [
      { role: 'user', content: 'Give me a wake-up call' },
      { role: 'assistant', content: 'Imagine waking up one day…' },
      { role: 'user', content: 'Hi', skip: true },
      { role: 'assistant', content: 'Free messages used up', limit: true, skip: true },
      { role: 'user', content: 'Copy the last one again' },
    ];
    expect(chatHistory(msgs)).toEqual([
      { role: 'user', content: 'Give me a wake-up call' },
      { role: 'assistant', content: 'Imagine waking up one day…' },
      { role: 'user', content: 'Copy the last one again' },
    ]);
  });

  it('keeps only the newest messages and starts with the student', () => {
    const msgs = Array.from({ length: 41 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: String(i) }));
    const history = chatHistory(msgs);
    expect(history.length).toBeLessThanOrEqual(30);
    expect(history[0].role).toBe('user');
    expect(history.at(-1).content).toBe('40');
  });
});
