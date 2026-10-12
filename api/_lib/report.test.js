import { describe, it, expect } from 'vitest';
import handler from '../chat.js';
import { cleanReport } from './report.js';
import { authGateEnabled } from './auth.js';

describe('Report this answer', () => {
  it('accepts the three reasons and trims what it stores', () => {
    expect(cleanReport({ reason: 'harmful', answer: ' Bad answer ', question: 'Q', lang: 'en' })).toEqual({ reason: 'harmful', answer: 'Bad answer', question: 'Q', lang: 'en' });
    expect(cleanReport({ reason: 'wrong', answer: 'x'.repeat(9000) }).answer).toHaveLength(8000);
    expect(cleanReport({ reason: 'spam', answer: 'x' })).toBeNull();
    expect(cleanReport({ reason: 'other', answer: '   ' })).toBeNull();
  });

  it('goes through /api/chat without asking the AI', async () => {
    const out = {};
    const res = { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } };
    await handler({ method: 'POST', headers: {}, body: { report: { reason: 'wrong', answer: 'x' } } }, res);
    // Signed out (accounts on) → 401; no database here → 503. Never an AI reply.
    expect([401, 503]).toContain(out.status);
    expect(out.body.reply).toBeUndefined();
    if (authGateEnabled) expect(out.status).toBe(401);
  });
});
