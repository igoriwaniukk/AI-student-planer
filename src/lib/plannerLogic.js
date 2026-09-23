import { EXAMS, PRIORITIES, REFERENCE_DAY, NUM_TODAY, WEEKDAY_META, realDateForNum } from './plannerData';
import { getCurrentLang } from './i18n';

// Looks the weekday up directly from num's real date (via realDateForNum)
// rather than indexing into WEEK_DAYS by a fixed offset — WEEK_DAYS' own
// window shifts along with NUM_TODAY (which now genuinely advances by a
// real day at a time, see plannerData.js's day-anchor), so a formula
// assuming it always starts at a fixed constant would drift out of sync
// with which position actually holds which weekday. monthDay/monthIndex/
// year are the real calendar values for that num, via realDateForNum, so
// the day-of-month actually shown to the student wraps at real month/year
// boundaries instead of just being the raw (unbounded) num.
export function dayInfo(num) {
  const date = realDateForNum(num);
  return { ...WEEKDAY_META[date.getDay()], num, monthDay: date.getDate(), monthIndex: date.getMonth(), year: date.getFullYear() };
}

// Locale-aware "day-of-month + month name" (optionally + year) for a
// logical day index, via Intl so Polish gets the correct genitive month
// form (e.g. "22 września") instead of a month name hardcoded for whatever
// fixed demo month the app used to assume.
export function formatMonthDay(num, { year = false } = {}) {
  const lang = getCurrentLang();
  const opts = { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}) };
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pl-PL', opts).format(realDateForNum(num));
}

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

// Whole real-world days between today and an ISO "YYYY-MM-DD" date string
// (the Deadline screen's actual date input) — negative once the date has
// passed. Feeding this back into REFERENCE_DAY + daysUntil lets a real
// picked date reuse all the existing REFERENCE_DAY-relative date-label
// helpers (formatMonthDay, weekdayDateLabel) instead of duplicating them.
export function daysUntilFromISODate(isoDate) {
  if (!isoDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target - today) / 86400000);
}

export function zad(n) {
  return n + (n === 1 ? ' zadanie' : (n >= 2 && n <= 4 ? ' zadania' : ' zadań'));
}

// A task recurs on chosen weekdays (see the "Repeat" chip in TaskEditSheet)
// instead of a single fixed day-num — d.repeatDays, when set, is a list of
// RECUR_DAYS values (Polish weekday names, matching dayInfo(...).label and
// recurringActivities' own `day` field). `dayNum == null` means "don't
// filter by day at all" (used by the rescue flow, which salvages whatever
// was already active regardless of which day it was originally for) — kept
// identical to the old `dayNum == null || t.day == null || t.day === dayNum`
// behavior for a non-repeating task. A task with no `day` set (the original
// demo tasks, or anything saved before that field existed) still matches
// Today and Tomorrow specifically, not every day, matching how the day strip
// has always treated it (see Tasks.jsx).
export function taskDueOnDay(d, dayNum) {
  if (dayNum == null) return true;
  if (d.repeatDays && d.repeatDays.length) return d.repeatDays.includes(dayInfo(dayNum).label);
  if (d.day != null) return d.day === dayNum;
  return dayNum === NUM_TODAY || dayNum === REFERENCE_DAY;
}

// The key a repeating task's per-occurrence state (see `tasks`/`taskState`
// in usePlanner.js) is stored under for a given day — plain `d.id` for an
// ordinary task (unchanged, so nothing persisted before repeating tasks
// existed needs migrating), `id:dayNum` for a repeating one, so checking off
// Monday's occurrence doesn't also check off Tuesday's. `dayNum == null`
// (the rescue flow, which doesn't filter by day — see taskDueOnDay above)
// falls back to the plain id too, since there's no single day to key against.
export function taskKey(d, dayNum) {
  if (dayNum == null || !d.repeatDays || !d.repeatDays.length) return d.id;
  return d.id + ':' + dayNum;
}

// Whether a task's occurrence on `dayNum` is switched on (included in the
// plan for a school task, or checked-done for a personal one) — defaults to
// the same thing a freshly saved task starts as (see saveTaskEdit in
// usePlanner.js: on for school, off for personal) whenever this exact
// occurrence hasn't been toggled yet, rather than requiring every future
// day of a repeating task to be pre-seeded into `tasks` up front.
export function isTaskOn(tasks, d, dayNum) {
  const key = taskKey(d, dayNum);
  return key in tasks ? tasks[key] : d.category !== 'personal';
}

// Personal tasks (see TaskEditSheet's category toggle) never get a
// study-time block, so they're excluded here regardless of day.
export function activeIds(taskDefs, tasks, taskState, dayNum) {
  return taskDefs
    .filter((t) => isTaskOn(tasks, t, dayNum) && ['moved', 'skipped'].indexOf((taskState[taskKey(t, dayNum)] || {}).status) < 0)
    .filter((t) => t.category !== 'personal' && taskDueOnDay(t, dayNum))
    .map((t) => t.id);
}

// At low energy, sessions the student hasn't manually resized are
// automatically shortened a bit instead of forcing a full normal-length load.
export function lightenForEnergy(dur, energy) {
  if (energy !== 'Niska') return dur;
  return Math.max(15, Math.round((dur * 0.8) / 5) * 5);
}

// Converts a "H:MM"/"HH:MM" time-of-day string (as collected at onboarding —
// see Onboarding.jsx step3's bedtime/wake inputs) into minutes since
// midnight, the unit the rest of the scheduler works in.
export function timeStrToMinutes(t) {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// The hard boundaries + blocked windows for a given day, derived entirely
// from the student's own real settings instead of a fixed, invented school/
// tennis schedule: wake/bedtime come from onboarding, and blocked windows
// come from whichever of the student's own recurring activities (see
// QuickAddSheet.jsx — each has a day/start/dur) land on that weekday.
export function dayConstraints({ wake, bedtime, recurringActivities, dayNum = REFERENCE_DAY } = {}) {
  // dayInfo(...).label (not weekdayName(...)) since it's the same
  // language-independent Polish weekday name recurringActivities' own `day`
  // field is stored in (see QuickAddSheet.jsx's RECUR_DAYS) — weekdayName
  // switches to English for an English UI and would never match.
  const weekday = dayInfo(dayNum).label;
  const blocks = (recurringActivities || [])
    .filter((a) => a.day === weekday)
    .map((a) => {
      // QuickAddSheet stores each activity's time as a "HH:MM" string (a
      // plain <input type="time"> value), not minutes — convert it here.
      const start = timeStrToMinutes(a.start);
      return { start, end: start + a.dur, label: a.name };
    })
    .sort((a, b) => a.start - b.start);
  return {
    wakeMinutes: timeStrToMinutes(wake || '06:30'),
    bedtimeMinutes: timeStrToMinutes(bedtime || '22:30'),
    blocks,
  };
}

// The real gaps between wake and bedtime once the day's blocked activities
// are carved out — replaces a fixed "15:30–18:00 and 19:00–21:30" that
// assumed every student shared the same school/tennis schedule. `blocks`
// is assumed sorted by start (dayConstraints already returns it that way).
export function freeWindows({ wakeMinutes, bedtimeMinutes, blocks }) {
  const windows = [];
  let cur = wakeMinutes;
  (blocks || []).forEach((b) => {
    const start = Math.max(b.start, wakeMinutes);
    const end = Math.min(b.end, bedtimeMinutes);
    if (start > cur) windows.push({ start: cur, end: start });
    if (end > cur) cur = end;
  });
  if (cur < bedtimeMinutes) windows.push({ start: cur, end: bedtimeMinutes });
  return windows;
}

// Pushes a candidate start time past any blocked window it would overlap,
// re-checking afterward since the new position might land inside another
// one — the generic replacement for the old single hardcoded tennis check.
function skipBlockedWindows(start, dur, blocks) {
  let cur = start;
  let moved = true;
  while (moved) {
    moved = false;
    for (const b of blocks || []) {
      if (cur < b.end && cur + dur > b.start) {
        cur = b.end;
        moved = true;
      }
    }
  }
  return cur;
}

export function buildSchedule({ taskDefs, tasks, taskState, energy, pref, durOverride, startOverride, constraints, dayNum }) {
  const c = constraints || dayConstraints();
  const brk = (pref === 'Więcej krótkich przerw' || energy === 'Niska') ? 15 : 10;
  const sched = {};
  let cur = c.wakeMinutes;
  const ids = activeIds(taskDefs, tasks, taskState, dayNum);
  ids.forEach((id, i) => {
    const d = taskDefs.find((t) => t.id === id);
    const dur = (durOverride && durOverride[id]) || lightenForEnergy(d.dur, energy);
    if (i > 0) cur += brk;
    cur = skipBlockedWindows(cur, dur, c.blocks);
    const ov = startOverride ? startOverride[id] : null;
    const start = ov == null ? cur : ov;
    sched[id] = { start, dur };
    cur = start + dur;
  });
  return sched;
}

// Deterministic fallback for "Uratuj mój dzień" when AI is unavailable or
// proposes something invalid: fits as many tasks as possible (highest
// priority first) into the time actually available, shortening down to a
// 15-minute floor before giving up on a task and marking it 'moved'.
export function buildRescueSchedule({ taskDefs, tasks, taskState, energy, durOverride, availableMinutes, constraints }) {
  const c = constraints || dayConstraints();
  const ids = activeIds(taskDefs, tasks, taskState);
  const ordered = [...ids].sort((a, b) => {
    const rank = (id) => {
      const i = PRIORITIES.indexOf(taskDefs.find((t) => t.id === id).priority);
      return i < 0 ? 1 : i;
    };
    return rank(a) - rank(b);
  });
  const brk = energy === 'Niska' ? 15 : 10;
  const schedule = {};
  const decisions = {};
  let cur = c.wakeMinutes;
  let remaining = availableMinutes;
  let placed = 0;
  ordered.forEach((id) => {
    const original = lightenForEnergy(durOf(id, taskDefs, durOverride), energy);
    if (remaining < 15) { decisions[id] = 'moved'; return; }
    const dur = Math.min(original, remaining);
    if (placed > 0) cur += brk;
    cur = skipBlockedWindows(cur, dur, c.blocks);
    if (cur + dur > c.bedtimeMinutes) { decisions[id] = 'moved'; return; }
    schedule[id] = { start: cur, dur };
    decisions[id] = dur < original ? 'shortened' : 'kept';
    cur += dur;
    remaining -= dur;
    placed++;
  });
  return { schedule, decisions };
}

const TIMELINE_TEXT = {
  pl: {
    fixedEvent: 'Zajęcia', sleep: 'Sen', fixedTime: 'Stała godzina',
    gap: 'Przerwa', restMin: (n) => n + ' min odpoczynku',
    bufferTitle: 'Bufor przed zajęciami', bufferSub: 'Przygotowanie i dotarcie na miejsce.',
    afterActivityTitle: 'Po zajęciach', rest: 'Odpoczynek',
    eveningTitle: 'Wolny wieczór', freeTime: 'Czas wolny',
  },
  en: {
    fixedEvent: 'Activity', sleep: 'Sleep', fixedTime: 'Fixed time',
    gap: 'Break', restMin: (n) => n + ' min rest',
    bufferTitle: 'Buffer before activity', bufferSub: 'Getting ready and traveling there.',
    afterActivityTitle: 'After activity', rest: 'Rest',
    eveningTitle: 'Free evening', freeTime: 'Free time',
  },
};

// Calendar events for the day: the student's own recurring activities (if
// any land today) plus their real bedtime — no invented school/tennis block.
export function timeline(schedule, constraints) {
  const c = constraints || dayConstraints();
  const sched = schedule || {};
  const tx = TIMELINE_TEXT[getCurrentLang() === 'en' ? 'en' : 'pl'];
  const items = (c.blocks || []).map((b) => ({ k: 'fixed', kind: 'activity', start: b.start, end: b.end, title: b.label, sub: tx.fixedEvent }));
  Object.keys(sched).forEach((id) => items.push({ k: 'study', id, start: sched[id].start, end: sched[id].start + sched[id].dur }));
  items.push({ k: 'sleep', kind: 'sleep', start: c.bedtimeMinutes, end: c.bedtimeMinutes, title: tx.sleep, sub: tx.fixedTime });
  items.sort((a, b) => a.start - b.start);
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const prev = out.length ? out[out.length - 1] : null;
    const it = items[i];
    if (prev && it.start > prev.end) {
      let title = tx.gap;
      let sub = tx.restMin(it.start - prev.end);
      if (it.k === 'fixed') { title = tx.bufferTitle; sub = tx.bufferSub; }
      else if (prev.k === 'fixed') { title = tx.afterActivityTitle; sub = tx.rest; }
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
  return 930;
}

const PREP_DIFFICULTY_DUR = { 'Łatwy': 25, 'Średni': 35, 'Trudny': 40 };
const WEEKDAYS = { pl: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };

// Just the weekday word for a logical day index — for copy that names a
// weekday inline (e.g. "Plan na {weekday}") without a full date, so it
// still tracks the real day instead of being stuck on a fixed weekday.
export function weekdayName(num) {
  const lang = getCurrentLang();
  return WEEKDAYS[lang === 'en' ? 'en' : 'pl'][realDateForNum(num).getDay()];
}

// Polish "na {środę/sobotę/niedzielę}" declines those three weekdays to the
// accusative — unlike English, so this isn't just a lowercased weekdayName.
const WEEKDAY_ACCUSATIVE_PL = ['niedzielę', 'poniedziałek', 'wtorek', 'środę', 'czwartek', 'piątek', 'sobotę'];

export function weekdayOn(num) {
  if (getCurrentLang() === 'en') return weekdayName(num);
  return WEEKDAY_ACCUSATIVE_PL[realDateForNum(num).getDay()];
}

// Full "Weekday, day month[, year]" label for a logical day index — shared
// by every screen/default that shows a specific demo date, so they all
// move together with the real "today" instead of drifting out of sync
// (a fixed weekday name paired with a date that no longer falls on it).
export function weekdayDateLabel(num, { year = false } = {}) {
  return weekdayName(num) + ', ' + formatMonthDay(num, { year });
}

function prepDayLabel(day) {
  const lang = getCurrentLang();
  const idx = realDateForNum(day).getDay();
  return WEEKDAYS[lang === 'en' ? 'en' : 'pl'][idx] + ', ' + formatMonthDay(day);
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

// The actual day-num behind each of buildPrepDates' labels below — needed
// so a confirmed prep session can become a real task on the right day
// (see confirmPrep in usePlanner.js), not just a label on the Prep screen.
export function buildPrepDayNums(count, examDay = REFERENCE_DAY + 11) {
  const startDay = REFERENCE_DAY + 1;
  const endDay = examDay - 1;
  const days = [];
  for (let i = 0; i < count; i++) {
    days.push(count === 1 ? endDay : Math.round(startDay + ((endDay - startDay) * i) / (count - 1)));
  }
  return days;
}

export function buildPrepDates(count, examDay = REFERENCE_DAY + 11) {
  return buildPrepDayNums(count, examDay).map(prepDayLabel);
}

// Actual minutes logged toward an exam so far — the sum of every prep
// session (see confirmPrep in usePlanner.js) the student has actually
// checked off in state.examSessions, not just a guess. An exam with no
// prep plan (added straight from Goals, or "save deadline only") simply
// has nothing to log yet.
export function examProgressMinutes(state, examId) {
  const sessions = state.examSessions?.[examId];
  if (!sessions) return 0;
  return sessions.reduce((a, s) => a + (s.done ? s.dur : 0), 0);
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

// state.schedule has no date of its own — it belongs to the approved plan's
// day (selectedDay), or, before anything is approved, to today's draft.
export function scheduleIsFor(state, dayNum) {
  return state.planApproved ? state.selectedDay === dayNum : dayNum === NUM_TODAY;
}

export function statusOn(state, id, dayNum) {
  const d = state.taskDefs.find((t) => t.id === id);
  return (state.taskState[d ? taskKey(d, dayNum) : id] || {}).status || 'planned';
}

// Today's study sessions split by outcome — the single source for the day
// summary, the auto-summary trigger and the end-of-day push. "unfinished"
// also includes a task Restart-your-day moved off today's plan, since
// nothing had rescheduled it anywhere yet.
export function daySessionBreakdown(state, dayNum = NUM_TODAY) {
  const sched = scheduleIsFor(state, dayNum) ? state.schedule || {} : {};
  const school = (id) => state.taskDefs.some((d) => d.id === id && d.category !== 'personal');
  const planned = Object.keys(sched).filter(school).sort((a, b) => sched[a].start - sched[b].start);
  const done = planned.filter((id) => statusOn(state, id, dayNum) === 'completed');
  const open = planned.filter((id) => ['planned', 'in_progress', 'paused'].includes(statusOn(state, id, dayNum)));
  const moved = state.taskDefs
    .filter((d) => d.category !== 'personal' && !sched[d.id] && taskDueOnDay(d, dayNum) && statusOn(state, d.id, dayNum) === 'moved')
    .map((d) => d.id);
  return { planned, done, unfinished: open.concat(moved), lastEnd: planned.reduce((m, id) => Math.max(m, sched[id].start + sched[id].dur), 0) };
}

// For a floating one-off task (no fixed day, no repeat — its done-state is
// shared by every day it's due on): the day it was finished, null while
// it's still open, or undefined when it was finished before that day
// started being recorded.
export function finishedOnDay(state, d) {
  const st = state.taskState[d.id] || {};
  if (d.category === 'personal') return isTaskOn(state.tasks, d, null) ? st.doneDay ?? undefined : null;
  return ['completed', 'skipped'].includes(st.status) ? st.day ?? undefined : null;
}

export function studiedToday(studyHistory) {
  return !!studyHistory?.[new Date().toISOString().slice(0, 10)]?.completed;
}

// YYYY-MM-DD in the device's own timezone — what the push server compares
// against its tz-shifted clock (see localNow in api/_lib/push.js).
export function localDateKey(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
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

// Returns null when the proposed time is fine, or {key, vars} for the
// translated conflict message shown in BlockEditSheet — not a prebuilt
// string, since this is plain logic with no access to the UI's language.
export function checkBlockConflict(id, start, dur, schedule, def, constraints) {
  const c = constraints || dayConstraints();
  const end = start + dur;
  if (start < c.wakeMinutes) return { key: 'block.conflictWake', vars: { time: fmt(c.wakeMinutes) } };
  const hitBlock = (c.blocks || []).find((b) => start < b.end && end > b.start);
  if (hitBlock) return { key: 'block.conflictActivity', vars: { name: hitBlock.label } };
  if (end > c.bedtimeMinutes) return { key: 'block.conflictSleep', vars: { time: fmt(c.bedtimeMinutes) } };
  const sched = schedule || {};
  const clash = Object.keys(sched).filter((k) => k !== id && start < sched[k].start + sched[k].dur && end > sched[k].start);
  if (clash.length) return { key: 'block.conflictOther', vars: { subject: def(clash[0]).subject } };
  return null;
}
