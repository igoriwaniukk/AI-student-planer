import { describe, it, expect, beforeEach, vi } from 'vitest';

// A tiny in-memory stand-in for the one Supabase table the sync uses.
const cloud = { row: null, fail: false };
vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => (cloud.fail ? { data: null, error: new Error('offline') } : { data: cloud.row, error: null }),
        }),
      }),
      upsert: async (row) => {
        if (cloud.fail) return { error: new Error('offline') };
        cloud.row = { data: row.data, updated_at: row.updated_at };
        return { error: null };
      },
    }),
  },
}));

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};

const { pullFromCloud, pushToCloud, cloudChangedSinceSync } = await import('./cloudSync');

describe('cloud sync', () => {
  beforeEach(() => { mem.clear(); cloud.row = null; cloud.fail = false; });

  it('a failed pull reports failure, not "no data"', async () => {
    cloud.fail = true;
    expect(await pullFromCloud('u')).toMatchObject({ ok: false, hadData: false });
  });

  it('merges study history instead of overwriting a newer copy from another device', async () => {
    cloud.row = { data: { name: 'Igor', studyHistory: { '2026-09-26': { completed: true } } }, updated_at: '2026-09-26T10:00:00Z' };
    await pullFromCloud('u');
    // Another device saves later with a new study day.
    cloud.row = { data: { name: 'Igor', studyHistory: { '2026-09-26': { completed: true }, '2026-09-27': { completed: true } } }, updated_at: '2026-09-27T09:00:00Z' };
    expect(await cloudChangedSinceSync('u')).toBe(true);
    // This device, still on its old copy, logs its own day and uploads.
    localStorage.setItem('sp_studyHistory', JSON.stringify({ '2026-09-26': { completed: true }, '2026-09-25': { completed: true } }));
    const res = await pushToCloud('u');
    expect(res).toMatchObject({ ok: true, conflict: true });
    expect(Object.keys(cloud.row.data.studyHistory).sort()).toEqual(['2026-09-25', '2026-09-26', '2026-09-27']);
  });

  it('uploads normally when nothing else changed', async () => {
    cloud.row = { data: { name: 'Igor' }, updated_at: '2026-09-26T10:00:00Z' };
    await pullFromCloud('u');
    localStorage.setItem('sp_name', JSON.stringify('Igor W'));
    expect(await pushToCloud('u')).toMatchObject({ ok: true, conflict: false });
    expect(cloud.row.data.name).toBe('Igor W');
    expect(await cloudChangedSinceSync('u')).toBe(false);
  });
});
