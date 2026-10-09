import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const db = vi.hoisted(() => ({ ent: null, usage: [], rpcResult: 0, rpcError: null, calls: [], saved: [] }));
vi.mock('./supabaseAdmin.js', () => ({
  supabaseAdminConfigured: true,
  supabaseAdmin: {
    from: () => {
      const q = {
        select: () => q, eq: () => q, in: () => q,
        maybeSingle: async () => ({ data: db.ent, error: null }),
        upsert: async (row) => { db.saved.push(row); return { error: null }; },
        then: (resolve) => resolve({ data: db.usage, error: null }),
      };
      return q;
    },
    rpc: async (name, args) => {
      db.calls.push([name, args]);
      return db.rpcError ? { data: null, error: db.rpcError } : { data: db.rpcResult, error: null };
    },
  },
}));

const { localDay, periodKey, consumeAi, premiumStatus, handleRevenueCatWebhook, syncFromRevenueCat } = await import('./premium.js');

const USER = { id: '6f1c2a3b-1111-4222-8333-944455556666', created_at: '2026-10-01T10:00:00Z' };
const future = () => new Date(Date.now() + 86400000).toISOString();

beforeEach(() => {
  Object.assign(db, { ent: null, usage: [], rpcResult: 0, rpcError: null, calls: [], saved: [] });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  process.env.PREMIUM_ENABLED = 'true';
});
afterEach(() => {
  delete process.env.PREMIUM_ENABLED;
  delete process.env.REVENUECAT_WEBHOOK_AUTH;
  delete process.env.REVENUECAT_SECRET_KEY;
  vi.restoreAllMocks();
});

describe('allowance periods', () => {
  it("uses the student's own date, and UTC for a bad time zone", () => {
    const now = new Date('2026-10-09T23:30:00Z');
    expect(localDay('Europe/Warsaw', now)).toBe('2026-10-10');
    expect(localDay('America/Los_Angeles', now)).toBe('2026-10-09');
    expect(localDay('Not/AZone', now)).toBe('2026-10-09');
  });

  it('daily keys are the date, weekly keys the Monday of that week', () => {
    expect(periodKey('day', '2026-10-09')).toBe('d2026-10-09');
    expect(periodKey('week', '2026-10-09')).toBe('w2026-10-05');
    expect(periodKey('week', '2026-10-11')).toBe('w2026-10-05');
    expect(periodKey('week', '2026-10-12')).toBe('w2026-10-12');
  });
});

describe('consumeAi', () => {
  it('lets everything through while Premium is switched off', async () => {
    delete process.env.PREMIUM_ENABLED;
    expect((await consumeAi(USER, 'chat', 'UTC')).allowed).toBe(true);
    expect(db.calls).toEqual([]);
  });

  it('Premium users are never counted', async () => {
    db.ent = { premium: true, expires_at: future() };
    const r = await consumeAi(USER, 'chat', 'UTC');
    expect(r).toMatchObject({ allowed: true, premium: true });
    expect(db.calls).toEqual([]);
  });

  it('an expired Premium counts as free', async () => {
    db.ent = { premium: true, expires_at: '2020-01-01T00:00:00Z' };
    db.rpcResult = 1;
    expect((await consumeAi(USER, 'plan', 'UTC')).allowed).toBe(true);
    expect(db.calls[0][0]).toBe('consume_ai_usage');
  });

  it('stops a free user at the limit', async () => {
    db.rpcResult = -1;
    expect(await consumeAi(USER, 'chat', 'UTC')).toEqual({ allowed: false, feature: 'chat', limit: 10, per: 'day' });
    expect(db.calls[0][1]).toMatchObject({ p_user: USER.id, p_feature: 'chat', p_limit: 10 });
  });

  it('counts exam prep per week and can give a use back', async () => {
    db.rpcResult = 1;
    const r = await consumeAi(USER, 'prep', 'UTC');
    expect(r.allowed).toBe(true);
    expect(db.calls[0][1].p_period).toMatch(/^w\d{4}-\d{2}-\d{2}$/);
    await r.release();
    expect(db.calls[1][0]).toBe('release_ai_usage');
  });

  it('lets the request through if the database fails', async () => {
    db.rpcError = new Error('relation "ai_usage" does not exist');
    expect((await consumeAi(USER, 'chat', 'UTC')).allowed).toBe(true);
  });
});

describe('premiumStatus', () => {
  it('says only "off" while Premium is switched off', async () => {
    delete process.env.PREMIUM_ENABLED;
    expect(await premiumStatus(USER, 'UTC')).toEqual({ enabled: false });
  });

  it('shows what a free user has left', async () => {
    db.usage = [{ feature: 'chat', period: periodKey('day', localDay('UTC')), count: 4 }];
    const s = await premiumStatus(USER, 'UTC');
    expect(s).toMatchObject({ enabled: true, premium: false, createdAt: USER.created_at });
    expect(s.usage.chat).toEqual({ used: 4, limit: 10, per: 'day' });
    expect(s.usage.prep).toEqual({ used: 0, limit: 1, per: 'week' });
  });
});

describe('RevenueCat', () => {
  it('refuses a webhook without the right secret', async () => {
    process.env.REVENUECAT_WEBHOOK_AUTH = 'Bearer right';
    expect((await handleRevenueCatWebhook('Bearer wrong', { event: {} })).status).toBe(401);
    delete process.env.REVENUECAT_WEBHOOK_AUTH;
    expect((await handleRevenueCatWebhook('', { event: {} })).status).toBe(401);
  });

  it('stores a purchase and an expiry from the webhook event', async () => {
    process.env.REVENUECAT_WEBHOOK_AUTH = 'Bearer right';
    const ms = Date.now() + 7 * 86400000;
    const ok = await handleRevenueCatWebhook('Bearer right', { event: { type: 'INITIAL_PURCHASE', app_user_id: USER.id, aliases: ['$RCAnonymousID:abc'], entitlement_ids: ['premium'], expiration_at_ms: ms, product_id: 'pulgo_premium_yearly' } });
    expect(ok.status).toBe(200);
    expect(db.saved[0]).toMatchObject({ user_id: USER.id, premium: true, product_id: 'pulgo_premium_yearly' });
    await handleRevenueCatWebhook('Bearer right', { event: { type: 'EXPIRATION', app_user_id: USER.id, entitlement_ids: ['premium'], expiration_at_ms: Date.now() - 1000 } });
    expect(db.saved[1]).toMatchObject({ user_id: USER.id, premium: false });
  });

  it('reads the subscriber from RevenueCat when a secret key is set', async () => {
    process.env.REVENUECAT_SECRET_KEY = 'sk_test';
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ subscriber: { entitlements: { premium: { expires_date: future(), product_identifier: 'pulgo_premium_monthly' } } } }) }));
    expect(await syncFromRevenueCat(USER.id, fetchImpl)).toMatchObject({ premium: true });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.revenuecat.com/v1/subscribers/' + USER.id);
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer sk_test');
    expect(db.saved[0]).toMatchObject({ premium: true, product_id: 'pulgo_premium_monthly' });
    expect(await syncFromRevenueCat('not-a-user', fetchImpl)).toBeNull();
  });
});
