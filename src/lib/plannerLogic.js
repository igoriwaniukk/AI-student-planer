import { DEFAULT_START, EXAMS, REFERENCE_DAY } from './plannerData';
import { getCurrentLang } from './i18n';

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
  const hUnit = getCurrentLang() === 'en' ? 'hr' : 'godz.';
  if (h && m) return h + ' ' + hUnit + ' ' + m + ' min';
  if (h) return h + ' ' + hUnit;
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

// At low energy, sessions the student hasn't manually resized are
// automatically shortened a bit instead of forcing a full normal-length load.
function lightenForEnergy(dur, energy) {
  if (energy !== 'Niska') return dur;
  return Math.max(15, Math.round((dur * 0.8) / 5) * 5);
}

export function buildSchedule({ taskDefs, tasks, taskState, energy, pref, durOverride, startOverride }) {
  const brk = (pref === 'Więcej krótkich przerw' || energy === 'Niska') ? 15 : 10;
  const sched = {};
  let cur = 930;
  const ids = activeIds(taskDefs, tasks, taskState);
  ids.forEach((id, i) => {
    const d = taskDefs.find((t) => t.id === id);
    const dur = (durOverride && durOverride[id]) || lightenForEnergy(d.dur, energy);
    if (i > 0) cur += brk;
    if (cur < 1140 && cur + dur > 1080) cur = 1170;
    const ov = startOverride ? startOverride[id] : null;
    const start = ov == null ? cur : ov;
    sched[id] = { start, dur };
    cur = start + dur;
  });
  return sched;
}

const TIMELINE_TEXT = {
  pl: {
    school: 'Szkoła', fixedEvent: 'Stałe wydarzenie', tennis: 'Tenis', sleep: 'Sen', fixedTime: 'Stała godzina',
    gap: 'Przerwa', restMin: (n) => n + ' min odpoczynku',
    bufferTitle: 'Bufor przed treningiem', bufferSub: 'Przygotowanie i dotarcie na tenis.',
    dinnerTitle: 'Kolacja i odpoczynek', rest: 'Odpoczynek',
    lunchTitle: 'Powrót i obiad',
    eveningTitle: 'Wolny wieczór', freeTime: 'Czas wolny',
  },
  en: {
    school: 'School', fixedEvent: 'Fixed event', tennis: 'Tennis', sleep: 'Sleep', fixedTime: 'Fixed time',
    gap: 'Break', restMin: (n) => n + ' min rest',
    bufferTitle: 'Buffer before training', bufferSub: 'Getting ready and traveling to tennis.',
    dinnerTitle: 'Dinner and rest', rest: 'Rest',
    lunchTitle: 'Back home and lunch',
    eveningTitle: 'Free evening', freeTime: 'Free time',
  },
};

// Fixed calendar events for the demo day: school, tennis, sleep.
export function timeline(schedule) {
  const sched = schedule || {};
  const tx = TIMELINE_TEXT[getCurrentLang() === 'en' ? 'en' : 'pl'];
  const items = [{ k: 'fixed', kind: 'school', start: 480, end: 880, title: tx.school, sub: tx.fixedEvent }];
  Object.keys(sched).forEach((id) => items.push({ k: 'study', id, start: sched[id].start, end: sched[id].start + sched[id].dur }));
  items.push({ k: 'fixed', kind: 'tennis', start: 1080, end: 1140, title: tx.tennis, sub: tx.fixedEvent });
  items.push({ k: 'sleep', kind: 'sleep', start: 1350, end: 1350, title: tx.sleep, sub: tx.fixedTime });
  items.sort((a, b) => a.start - b.start);
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const prev = out.length ? out[out.length - 1] : null;
    const it = items[i];
    if (prev && it.start > prev.end) {
      let title = tx.gap;
      let sub = tx.restMin(it.start - prev.end);
      if (it.k === 'fixed') { title = tx.bufferTitle; sub = tx.bufferSub; }
      else if (prev.k === 'fixed' && prev.kind === 'tennis') { title = tx.dinnerTitle; sub = tx.rest; }
      else if (prev.k === 'fixed' && prev.kind === 'school') { title = tx.lunchTitle; sub = tx.rest; }
      else if (it.k === 'sleep') { title = tx.eveningTitle; sub = tx.freeTime; }
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

const PREP_DIFFICULTY_DUR = { 'Łatwy': 25, 'Średni': 35, 'Trudny': 40 };
const WEEKDAYS = { pl: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };

function prepDayLabel(day) {
  const idx = (((1 + (day - REFERENCE_DAY)) % 7) + 7) % 7;
  const lang = getCurrentLang();
  const monthName = lang === 'en' ? 'July' : 'lipca';
  return WEEKDAYS[lang === 'en' ? 'en' : 'pl'][idx] + ', ' + (lang === 'en' ? monthName + ' ' + day : day + ' ' + monthName);
}

// Turns whatever topics the student actually entered on the Deadline screen
// into a concrete, ordered study plan — instead of a fixed, unrelated example.
export function buildPrepSessions(topics, difficulty) {
  const baseDur = PREP_DIFFICULTY_DUR[difficulty] || 35;
  const en = getCurrentLang() === 'en';
  const list = topics && topics.length ? topics : [en ? 'Exam material' : 'Materiał do sprawdzianu'];
  const sessions = list.map((topic, i) => {
    if (i === 0) {
      return {
        title: topic + (en ? ' — basics' : ' — podstawy'), type: en ? 'First contact' : 'Pierwszy kontakt', dur: Math.max(20, baseDur - 5),
        why: en
          ? "First we'll sort out the basic concepts needed for the following topics."
          : 'Najpierw uporządkujemy podstawowe pojęcia potrzebne do kolejnych tematów.',
      };
    }
    const last = i === list.length - 1;
    return {
      title: topic + (last ? (en ? ' — exercises' : ' — ćwiczenia') : (en ? ' — introduction' : ' — wprowadzenie')),
      type: last ? (en ? 'New material and exercises' : 'Nowy materiał i ćwiczenia') : (en ? 'Exercises' : 'Ćwiczenia'),
      dur: baseDur,
      why: last
        ? (en ? 'We combine the last topic with practical examples.' : 'Łączymy ostatni temat z praktycznymi przykładami.')
        : (en ? 'The first exercises come right after learning this topic.' : 'Pierwsze zadania pojawiają się po poznaniu tego tematu.'),
    };
  });
  sessions.push({
    title: en ? 'Mixed exercises from ' + list.length + (list.length === 1 ? ' topic' : ' topics') : 'Zadania mieszane z ' + zad(list.length),
    type: en ? 'Reinforcement' : 'Utrwalenie', dur: baseDur,
    why: en
      ? 'Exercises covering every topic will show which parts need more work.'
      : 'Ćwiczenia ze wszystkich tematów pokażą, które elementy wymagają poprawy.',
  });
  sessions.push({
    title: en ? 'Review of harder areas' : 'Powtórka trudniejszych obszarów',
    type: en ? 'Review' : 'Powtórka', dur: Math.max(20, baseDur - 5),
    why: en
      ? 'We go back to the topics that scored weakest in earlier exercises.'
      : 'Wracamy do tematów ocenionych najsłabiej podczas wcześniejszych ćwiczeń.',
  });
  sessions.push({
    title: en ? 'Short test before the exam' : 'Krótki test przed sprawdzianem',
    type: en ? 'Self-check' : 'Samosprawdzenie', dur: Math.max(20, baseDur - 10),
    why: en
      ? "On the last day you'll check your readiness without overloading the evening."
      : 'Ostatniego dnia sprawdzisz gotowość bez przeciążania wieczoru.',
  });
  return sessions.map((sx) => ({ ...sx, time: range('17:00', sx.dur), dur: sx.dur + ' min' }));
}

export function buildPrepDates(count, examDay = 31) {
  const startDay = REFERENCE_DAY + 1;
  const endDay = examDay - 1;
  const dates = [];
  for (let i = 0; i < count; i++) {
    const day = count === 1 ? endDay : Math.round(startDay + ((endDay - startDay) * i) / (count - 1));
    dates.push(prepDayLabel(day));
  }
  return dates;
}

// Actual minutes logged toward an exam so far. Only 'math'/'bio' currently
// have a real scheduled+completed session tied to the same id; custom exams
// simply have nothing logged yet.
export function examProgressMinutes(state, examId) {
  const st = state.taskState[examId];
  return st && st.status === 'completed' ? st.actual : 0;
}

// A rough capacity heuristic: a student can't realistically dedicate more
// than ~90 min/day to a single exam once other subjects and life are
// accounted for. Flags goals that don't fit the remaining days at that rate.
export function examAtRisk(state, exam, goal) {
  if (exam.daysUntil <= 0 || !goal) return false;
  const logged = examProgressMinutes(state, exam.id);
  const remaining = Math.max(0, goal.studyMinutes - logged);
  return remaining > exam.daysUntil * 90;
}

export function upcomingExams(state) {
  const builtIn = EXAMS.filter((e) => !e.requires || state[e.requires]);
  const all = builtIn.concat(state.customExams || []);
  return all
    .map((e) => ({ ...e, daysUntil: e.day - REFERENCE_DAY }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// Consecutive real-world days (ending today or yesterday) with a fully
// completed study day recorded in studyHistory (keyed by real ISO date).
export function computeStreak(studyHistory) {
  const d = new Date();
  if (!studyHistory[d.toISOString().slice(0, 10)]?.completed) {
    d.setDate(d.getDate() - 1); // today not logged yet — count from yesterday instead
  }
  let streak = 0;
  for (;;) {
    const entry = studyHistory[d.toISOString().slice(0, 10)];
    if (!entry || !entry.completed) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// A simple, transparent points score derived from real persisted history —
// not a separately mutable counter — so it never drifts out of sync with
// what actually happened: 20 pts per fully-completed study day, 2 pts per
// energy check-in.
export function computeTotalPoints(studyHistory, energyLog) {
  const completedDays = Object.values(studyHistory || {}).filter((e) => e.completed).length;
  const checkins = (energyLog || []).length;
  return completedDays * 20 + checkins * 2;
}

// Planned vs. actual study time over the last 7 real-world days.
export function weeklyReview(studyHistory) {
  const entries = [];
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const entry = studyHistory[d.toISOString().slice(0, 10)];
    if (entry) entries.push(entry);
    d.setDate(d.getDate() - 1);
  }
  const plannedMin = entries.reduce((a, e) => a + (e.plannedMin || 0), 0);
  const actualMin = entries.reduce((a, e) => a + (e.actualMin || 0), 0);
  const completedDays = entries.filter((e) => e.completed).length;
  const rate = entries.length ? Math.round((completedDays / entries.length) * 100) : 0;
  return { plannedMin, actualMin, completedDays, trackedDays: entries.length, rate };
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
