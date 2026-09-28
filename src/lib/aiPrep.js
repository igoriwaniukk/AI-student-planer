import { checkBlockConflict, fmt, timeStrToMinutes } from './plannerLogic';
import { getCurrentLang } from './i18n';
import { authedFetch } from './authFetch';

// Study sessions for a new exam, planned by the AI around the student's
// real days: free time, fixed activities, sessions already planned (other
// exams' prep, approved plans). Each proposed session is checked against
// its own day like any manual edit; one that doesn't fit is dropped. With
// nothing usable left, the caller falls back to the fixed prep template.
export const MAX_PREP_SESSIONS = 12;

// A session's start comes back as "HH:MM" (minutes after midnight also work).
function startMinutes(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(String(v || '').trim()) ? timeStrToMinutes(String(v).trim()) : null;
}

// `days`: [{ day, date, wakeMinutes, bedtimeMinutes, blocks, busy }] as sent.
export function toValidatedPrep(sessions, days) {
  if (!Array.isArray(sessions)) return null;
  const byDate = new Map(days.map((d) => [d.date, d]));
  // What's already taken on each day, as a schedule-shaped map for the
  // conflict check (existing sessions plus the ones accepted so far).
  const taken = new Map(days.map((d) => [d.date, Object.fromEntries((d.busy || []).map((b, i) => ['busy-' + i, { start: b.start, dur: b.end - b.start }]))]));
  const names = {};
  const out = [];
  for (const x of sessions) {
    if (out.length >= MAX_PREP_SESSIONS) break;
    const day = byDate.get(x?.date);
    const dur = Math.round(Number(x?.durationMinutes));
    const title = String(x?.title || '').trim().slice(0, 80);
    const start = startMinutes(x?.start);
    if (!day || start == null || !(dur >= 15 && dur <= 120) || !title) continue;
    const key = 'prep-' + out.length;
    const sched = taken.get(x.date);
    const conflict = checkBlockConflict(key, start, dur, sched, (id) => ({ subject: names[id] || '' }), { wakeMinutes: day.wakeMinutes, bedtimeMinutes: day.bedtimeMinutes, blocks: day.blocks || [] });
    if (conflict) continue;
    sched[key] = { start, dur };
    names[key] = title;
    out.push({
      day: day.day, start, dur, title,
      type: String(x.type || '').trim().slice(0, 40), why: String(x.why || '').trim().slice(0, 200),
    });
  }
  if (!out.length) return null;
  return out.sort((a, b) => a.day - b.day || a.start - b.start);
}

// In the Prep screen's own shape: { title, type, why, time: "HH:MM–HH:MM", dur: "N min" }.
export function toPrepCards(sessions) {
  return sessions.map((x) => ({ title: x.title, type: x.type, why: x.why, time: fmt(x.start) + '–' + fmt(x.start + x.dur), dur: x.dur + ' min' }));
}

export async function requestAIPrep({ exam, days, context }) {
  if (!days.length) return null;
  try {
    const res = await authedFetch('/api/plan/prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exam, days: days.map(({ day: _day, ...rest }) => rest), context, lang: getCurrentLang() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const sessions = toValidatedPrep(data.sessions, days);
    return sessions ? { sessions, rationale: data.rationale || null } : null;
  } catch {
    return null;
  }
}
