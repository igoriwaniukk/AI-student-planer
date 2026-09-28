import { describe, it, expect, beforeEach, vi } from 'vitest';

// A tiny in-memory stand-in for the one Supabase table the sync uses.
const cloud = { row: null, fail: false, pg: false };
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
        // `pg`: the stamp comes back the way Postgres prints a timestamptz.
        cloud.row = { data: row.data, updated_at: cloud.pg ? row.updated_at.replace('Z', '+00:00') : row.updated_at };
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
  beforeEach(() => { mem.clear(); cloud.row = null; cloud.fail = false; cloud.pg = false; });

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

  it('a second edit on the same device is not mistaken for another device (Postgres stamp format)', async () => {
    cloud.pg = true;
    cloud.row = { data: { plannerData: { v: 'start' } }, updated_at: '2026-09-28T10:00:00.000+00:00' };
    await pullFromCloud('u');
    localStorage.setItem('sp_plannerData', JSON.stringify({ v: 'edit 1' }));
    expect(await pushToCloud('u')).toMatchObject({ ok: true, conflict: false });
    localStorage.setItem('sp_plannerData', JSON.stringify({ v: 'edit 2' }));
    expect(await pushToCloud('u')).toMatchObject({ ok: true, conflict: false, tookRemote: false });
    expect(JSON.parse(localStorage.getItem('sp_plannerData'))).toEqual({ v: 'edit 2' });
    expect(cloud.row.data.plannerData).toEqual({ v: 'edit 2' });
    expect(await cloudChangedSinceSync('u')).toBe(false);
  });

  it('in a real clash, this device keeps what it changed and takes the rest from the other device', async () => {
    cloud.row = { data: { name: 'Igor', plannerData: { v: 'start' } }, updated_at: '2026-09-28T10:00:00Z' };
    await pullFromCloud('u');
    // The laptop renames; this phone edits the plan.
    cloud.row = { data: { name: 'Igor W', plannerData: { v: 'start' } }, updated_at: '2026-09-28T10:05:00Z' };
    localStorage.setItem('sp_plannerData', JSON.stringify({ v: 'phone plan' }));
    const res = await pushToCloud('u');
    expect(res).toMatchObject({ ok: true, conflict: true, tookRemote: true });
    expect(cloud.row.data).toMatchObject({ name: 'Igor W', plannerData: { v: 'phone plan' } });
    expect(JSON.parse(localStorage.getItem('sp_plannerData'))).toEqual({ v: 'phone plan' });
    expect(JSON.parse(localStorage.getItem('sp_name'))).toBe('Igor W');
  });

  it('no reload is needed when the other device changed nothing this one lacks', async () => {
    cloud.row = { data: { name: 'Igor', plannerData: { v: 'start' } }, updated_at: '2026-09-28T10:00:00Z' };
    await pullFromCloud('u');
    // Another save happened, but with the same data.
    cloud.row = { ...cloud.row, updated_at: '2026-09-28T10:05:00Z' };
    localStorage.setItem('sp_plannerData', JSON.stringify({ v: 'phone plan' }));
    expect(await pushToCloud('u')).toMatchObject({ ok: true, conflict: true, tookRemote: false });
    expect(cloud.row.data.plannerData).toEqual({ v: 'phone plan' });
  });
});
