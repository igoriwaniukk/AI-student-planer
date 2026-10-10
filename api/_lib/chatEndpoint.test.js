import { describe, it, expect } from 'vitest';
import handler from '../chat.js';
import { handleChat } from './chat.js';
import { authGateEnabled } from './auth.js';

function call(method, body) {
  const out = {};
  const res = { status(code) { out.status = code; return this; }, json(data) { out.body = data; return this; } };
  return handler({ method, body, headers: {} }, res).then(() => out);
}

describe('/api/chat setup checks', () => {
  it('GET shows what is set up, without secrets', async () => {
    const r = await call('GET');
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ai: !!process.env.ANTHROPIC_API_KEY, accounts: authGateEnabled });
  });

  it('without an AI key, a message gets a clear "no key" answer the app can translate', async () => {
    if (process.env.ANTHROPIC_API_KEY) return;
    const r = await handleChat({ messages: [{ role: 'user', content: 'hi' }] });
    expect(r.status).toBe(503);
    expect(r.body.code).toBe('no_key');
  });

  it('with accounts on, a request without sign-in is refused before any AI call', async () => {
    if (!authGateEnabled) return;
    const r = await call('POST', { messages: [{ role: 'user', content: 'hi' }] });
    expect(r.status).toBe(401);
  });
});
