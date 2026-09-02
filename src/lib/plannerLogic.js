import { DEFAULT_START } from './plannerData';

export function fmt(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

export function span(a, b) {
  return fmt(a) + '–' + fmt(b);
}

export function hm(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return h + ' godz. ' + m + ' min';
  if (h) return h + ' godz.';
  return m + ' min';
}

export function toMinutes(t) {
  const p = t.split(':');
  return (+p[0]) * 60 + (+p[1]);
}

export function range(start, durMinutes) {
  const s = toMinutes(start);
  return start + '–' + fmt(s + durMinutes);
}

export function zad(n) {
  return n + (n === 1 ? ' zadanie' : (n >= 2 && n <= 4 ? ' zadania' : ' zadań'));
}

export function activeIds(taskDefs, tasks, taskState) {
  return taskDefs
    .filter((t, i) => tasks[i] && ['moved', 'skipped'].indexOf((taskState[t.id] || {}).status) < 0)
    .map((t) => t.id);
}

export function buildSchedule({ taskDefs, tasks, taskState, energy, pref, durOverride, startOverride }) {
  const brk = (pref === 'Więcej krótkich przerw' || energy === 'Niska') ? 15 : 10;
  const sched = {};
  let cur = 930;
  const ids = activeIds(taskDefs, tasks, taskState);
  ids.forEach((id, i) => {
    const d = taskDefs.find((t) => t.id === id);
    const dur = (durOverride && durOverride[id]) || d.dur;
    if (i > 0) cur += brk;
    if (cur < 1140 && cur + dur > 1080) cur = 1170;
    const ov = startOverride ? startOverride[id] : null;
    const start = ov == null ? cur : ov;
    sched[id] = { start, dur };
    cur = start + dur;
  });
  return sched;
}

// Fixed calendar events for the demo day: school, tennis, sleep.
export function timeline(schedule) {
  const sched = schedule || {};
  const items = [{ k: 'fixed', start: 480, end: 880, title: 'Szkoła', sub: 'Stałe wydarzenie' }];
  Object.keys(sched).forEach((id) => items.push({ k: 'study', id, start: sched[id].start, end: sched[id].start + sched[id].dur }));
  items.push({ k: 'fixed', start: 1080, end: 1140, title: 'Tenis', sub: 'Stałe wydarzenie' });
  items.push({ k: 'sleep', start: 1350, end: 1350, title: 'Sen', sub: 'Stała godzina' });
  items.sort((a, b) => a.start - b.start);
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const prev = out.length ? out[out.length - 1] : null;
    const it = items[i];
    if (prev && it.start > prev.end) {
      let title = 'Przerwa';
      let sub = (it.start - prev.end) + ' min odpoczynku';
      if (it.k === 'fixed') { title = 'Bufor przed treningiem'; sub = 'Przygotowanie i dotarcie na tenis.'; }
      else if (prev.k === 'fixed' && prev.title === 'Tenis') { title = 'Kolacja i odpoczynek'; sub = 'Odpoczynek'; }
      else if (prev.k === 'fixed' && prev.title === 'Szkoła') { title = 'Powrót i obiad'; sub = 'Odpoczynek'; }
      else if (it.k === 'sleep') { title = 'Wolny wieczór'; sub = 'Czas wolny'; }
      out.push({ k: 'gap', start: prev.end, end: it.start, title, sub });
    }
    out.push(it);
  }
  return out;
}

export function durOf(id, taskDefs, durOverride) {
  return (durOverride && durOverride[id]) || taskDefs.find((t) => t.id === id).dur;
}

export function startOf(id, { schedule, startOverride }) {
  if (startOverride && startOverride[id] != null) return startOverride[id];
  if (schedule && schedule[id]) return schedule[id].start;
  return DEFAULT_START[id] || 930;
}

export function checkBlockConflict(id, start, dur, schedule, def) {
  const end = start + dur;
  if (start < 880) return 'Ten czas koliduje ze szkołą 8:00–14:40. Wybierz późniejszą godzinę.';
  if (start < 1140 && end > 1080) return 'Ten czas koliduje z tenisem 18:00–19:00. Wybierz inną godzinę.';
  if (end > 1350) return 'Ta zmiana skróciłaby sen o 22:30. Wybierz wcześniejszą godzinę lub krótszy blok.';
  const sched = schedule || {};
  const clash = Object.keys(sched).filter((k) => k !== id && start < sched[k].start + sched[k].dur && end > sched[k].start);
  if (clash.length) return 'Ten blok nachodzi na inny blok nauki (' + def(clash[0]).subject + '). Wybierz inną godzinę.';
  return '';
}
