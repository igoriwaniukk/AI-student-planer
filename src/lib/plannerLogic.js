import { EXAMS, PRIORITIES, REFERENCE_DAY, NUM_TODAY, WEEKDAY_META, RECUR_DAYS, realDateForNum } from './plannerData';
import { getCurrentLang, VALUE_KEY, TASK_TEXT_KEY, DAY_KEY, translate, localeOf } from './i18n';

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
export function formatMonthDay(num, { year = false, short = false } = {}) {
  const lang = getCurrentLang();
  const opts = { day: 'numeric', month: short ? 'short' : 'long', ...(year ? { year: 'numeric' } : {}) };
  return new Intl.DateTimeFormat(localeOf(lang), opts).format(realDateForNum(num));
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
  const hUnit = translate(getCurrentLang(), 'unit.hr');
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
// passed. NUM_TODAY + daysUntil is that date's day-num, so a picked date can
// reuse the day-num date-label helpers (formatMonthDay, weekdayDateLabel).
// (Exams used to be stored as REFERENCE_DAY + daysUntil — one day late,
// since REFERENCE_DAY is tomorrow; see the migration in usePlanner.)
export function daysUntilFromISODate(isoDate) {
  if (!isoDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + 'T00:00:00');
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target - today) / 86400000);
}

// Which plural form a count takes, as the dictionary's ".one/.few/.many"
// keys name them: the language's own rules (Polish 1 / 2–4 but not 12–14 /
// the rest; French counts 0 as "one"; Chinese and Japanese don't change).
export function pluralForm(n) {
  const cat = new Intl.PluralRules(localeOf(getCurrentLang())).select(Math.abs(n));
  return cat === 'one' || cat === 'few' ? cat : 'many';
}

export function zad(n) {
  return translate(getCurrentLang(), 'count.tasks.' + pluralForm(n), { n });
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
// A task "moved" off a day by Restart-your-day only leaves that one day
// (its recorded `day`); a skipped/let-go task stays out.
export function activeIds(taskDefs, tasks, taskState, dayNum) {
  const out = (st) => st.status === 'skipped' || (st.status === 'moved' && (dayNum == null || st.day === dayNum));
  return taskDefs
    .filter((t) => isTaskOn(tasks, t, dayNum) && !out(taskState[taskKey(t, dayNum)] || {}))
    .filter((t) => t.category !== 'personal' && taskDueOnDay(t, dayNum))
    .map((t) => t.id);
}

// Minutes after midnight right now, rounded up to the next 5 — the earliest
// a session planned for today can still start.
export function roundedNowMinutes() {
  const d = new Date();
  return Math.ceil((d.getHours() * 60 + d.getMinutes()) / 5) * 5;
}

// What Restart-your-day may rearrange: today's tasks that aren't finished
// or already running — never other days' tasks.
export function rescueCandidates(taskDefs, tasks, taskState) {
  return activeIds(taskDefs, tasks, taskState, NUM_TODAY).filter((id) => {
    const d = taskDefs.find((t) => t.id === id);
    return !['completed', 'in_progress', 'paused'].includes((taskState[taskKey(d, NUM_TODAY)] || {}).status);
  });
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
// A to-do given a set time (e.g. the gym 18:00–19:30, see the "At a set
// time" switch in TaskEditSheet) takes that time out of its day just like a
// weekly activity. Only one with its own day or weekdays — an undated to-do
// would otherwise block every day.
export function timedTodoBlocks(taskDefs, dayNum) {
  return (taskDefs || [])
    .filter((d) => d.category === 'personal' && d.at && d.dur && (d.day != null || (d.repeatDays && d.repeatDays.length)) && taskDueOnDay(d, dayNum))
    .map((d) => {
      const start = timeStrToMinutes(d.at);
      return { start, end: start + d.dur, label: d.title, kind: 'todo', taskId: d.id };
    });
}

// "18:00–19:30" for a to-do with a set time, otherwise null.
export function todoTimeLabel(d) {
  return d && d.category === 'personal' && d.at && d.dur ? d.at + '–' + fmt(timeStrToMinutes(d.at) + d.dur) : null;
}

export function dayConstraints({ wake, bedtime, recurringActivities, dayNum = REFERENCE_DAY, extraBlocks = [] } = {}) {
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
    .concat(extraBlocks)
    .sort((a, b) => a.start - b.start);
  const wakeMinutes = timeStrToMinutes(wake || '06:30');
  let bedtimeMinutes = timeStrToMinutes(bedtime || '22:30');
  // A bedtime after midnight (e.g. 00:30) ends the same evening, not the
  // start of the day — otherwise there'd be no free time at all.
  if (bedtimeMinutes <= wakeMinutes) bedtimeMinutes += 24 * 60;
  return { wakeMinutes, bedtimeMinutes, blocks };
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
  // Planning today in the afternoon starts now, not back at wake time.
  let cur = dayNum === NUM_TODAY ? Math.max(c.wakeMinutes, roundedNowMinutes()) : c.wakeMinutes;
  const ids = activeIds(taskDefs, tasks, taskState, dayNum);
  let placed = 0;
  ids.forEach((id) => {
    const d = taskDefs.find((t) => t.id === id);
    const dur = (durOverride && durOverride[id]) || lightenForEnergy(d.dur, energy);
    if (placed > 0) cur += brk;
    cur = skipBlockedWindows(cur, dur, c.blocks);
    // A chosen start is a preference: it still steps past fixed activities,
    // and a session that would run past bedtime is left unplanned.
    const ov = startOverride ? startOverride[id] : null;
    const start = ov == null ? cur : skipBlockedWindows(ov, dur, c.blocks);
    if (start + dur > c.bedtimeMinutes) return;
    sched[id] = { start, dur };
    cur = start + dur;
    placed++;
  });
  return sched;
}

// Deterministic fallback for "Uratuj mój dzień" when AI is unavailable or
// proposes something invalid: fits as many tasks as possible (highest
// priority first) into the time actually available, shortening down to a
// 15-minute floor before giving up on a task and marking it 'moved'.
export function buildRescueSchedule({ taskDefs, tasks, taskState, energy, durOverride, availableMinutes, constraints }) {
  const c = constraints || dayConstraints();
  const ids = rescueCandidates(taskDefs, tasks, taskState);
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

// Calendar events for the day: the student's own recurring activities (if
// any land today) plus their real bedtime — no invented school/tennis block.
export function timeline(schedule, constraints) {
  const c = constraints || dayConstraints();
  const sched = schedule || {};
  const lang = getCurrentLang();
  const tx = (key, vars) => translate(lang, 'tl.' + key, vars);
  const items = (c.blocks || []).map((b) => ({ k: 'fixed', kind: 'activity', start: b.start, end: b.end, title: b.label, sub: tx(b.kind === 'todo' ? 'todo' : 'fixedEvent') }));
  Object.keys(sched).forEach((id) => items.push({ k: 'study', id, start: sched[id].start, end: sched[id].start + sched[id].dur }));
  items.push({ k: 'sleep', kind: 'sleep', start: c.bedtimeMinutes, end: c.bedtimeMinutes, title: tx('sleep'), sub: tx('fixedTime') });
  items.sort((a, b) => a.start - b.start);
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const prev = out.length ? out[out.length - 1] : null;
    const it = items[i];
    if (prev && it.start > prev.end) {
      let title = tx('gap');
      let sub = tx('restMin', { n: it.start - prev.end });
      if (it.k === 'fixed') { title = tx('bufferTitle'); sub = tx('bufferSub'); }
      else if (prev.k === 'fixed') { title = tx('afterActivityTitle'); sub = tx('rest'); }
      else if (it.k === 'sleep') { title = tx('eveningTitle'); sub = tx('freeTime'); }
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

// Just the weekday word for a logical day index — for copy that names a
// weekday inline (e.g. "Plan na {weekday}") without a full date, so it
// still tracks the real day instead of being stuck on a fixed weekday.
export function weekdayName(num) {
  const label = RECUR_DAYS[(realDateForNum(num).getDay() + 6) % 7];
  return translate(getCurrentLang(), DAY_KEY[label]);
}

// The weekday as it sits inside a sentence ("Plan na {środę}"): Polish
// declines środa/sobota/niedziela to the accusative, and Spanish,
// Portuguese, French and Italian write weekdays in lower case mid-sentence.
const WEEKDAY_ACCUSATIVE_PL = ['niedzielę', 'poniedziałek', 'wtorek', 'środę', 'czwartek', 'piątek', 'sobotę'];
const LOWERCASE_WEEKDAYS = ['es', 'pt', 'fr', 'it'];

export function weekdayOn(num) {
  const lang = getCurrentLang();
  if (lang === 'pl') return WEEKDAY_ACCUSATIVE_PL[realDateForNum(num).getDay()];
  const name = weekdayName(num);
  return LOWERCASE_WEEKDAYS.includes(lang) ? name.toLowerCase() : name;
}

// Full "Weekday, day month[, year]" label for a logical day index — shared
// by every screen/default that shows a specific demo date, so they all
// move together with the real "today" instead of drifting out of sync
// (a fixed weekday name paired with a date that no longer falls on it).
export function weekdayDateLabel(num, { year = false } = {}) {
  return weekdayName(num) + ', ' + formatMonthDay(num, { year });
}

export function prepDayLabel(day) {
  return weekdayName(day) + ', ' + formatMonthDay(day);
}

// Turns whatever topics the student actually entered on the Deadline screen
// into a concrete, ordered study plan — instead of a fixed, unrelated example.
export function buildPrepSessions(topics, difficulty) {
  const baseDur = PREP_DIFFICULTY_DUR[difficulty] || 35;
  const t = (key, vars) => translate(getCurrentLang(), 'prepDef.' + key, vars);
  const list = topics && topics.length ? topics : [t('material')];
  const sessions = list.map((topic, i) => {
    if (i === 0) return { title: topic + t('basicsSuffix'), type: t('basicsType'), dur: Math.max(20, baseDur - 5), why: t('basicsWhy') };
    const last = i === list.length - 1;
    return {
      title: topic + (last ? t('exercisesSuffix') : t('introSuffix')),
      type: last ? t('lastType') : t('exercisesType'),
      dur: baseDur,
      why: last ? t('lastWhy') : t('exercisesWhy'),
    };
  });
  sessions.push({ title: t('mixedTitle.' + pluralForm(list.length), { n: list.length }), type: t('mixedType'), dur: baseDur, why: t('mixedWhy') });
  sessions.push({ title: t('reviewTitle'), type: t('reviewType'), dur: Math.max(20, baseDur - 5), why: t('reviewWhy') });
  sessions.push({ title: t('testTitle'), type: t('testType'), dur: Math.max(20, baseDur - 10), why: t('testWhy') });
  return sessions.map((sx) => ({ ...sx, time: range('17:00', sx.dur), dur: sx.dur + ' min' }));
}

// The actual day-num behind each of buildPrepDates' labels below — needed
// so a confirmed prep session can become a real task on the right day
// (see confirmPrep in usePlanner.js), not just a label on the Prep screen.
// Sessions are spread from tomorrow to the day before the exam — or all on
// today when the exam is tomorrow — so none lands on or after the exam; with
// more sessions than days, some days get two.
export function buildPrepDayNums(count, examDay = NUM_TODAY + 11) {
  const lastDay = Math.max(NUM_TODAY, examDay - 1);
  const firstDay = Math.min(REFERENCE_DAY, lastDay);
  const days = [];
  for (let i = 0; i < count; i++) {
    days.push(count === 1 ? lastDay : Math.round(firstDay + ((lastDay - firstDay) * i) / (count - 1)));
  }
  return days;
}

export function buildPrepDates(count, examDay = NUM_TODAY + 11) {
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
    .map((e) => ({ ...e, daysUntil: e.day - NUM_TODAY }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// Consecutive real-world days (ending today or yesterday) with a fully
// completed study day recorded in studyHistory — keyed by the local
// calendar date (localDateKey), stepping back one calendar day at a time,
// so studying at 00:30 counts for the new day and clock changes can't skip
// or repeat a day.
export function computeStreak(studyHistory) {
  const d = new Date();
  if (!studyHistory[localDateKey(d)]?.completed) {
    d.setDate(d.getDate() - 1); // today not logged yet — count from yesterday instead
  }
  let streak = 0;
  for (;;) {
    const entry = studyHistory[localDateKey(d)];
    if (!entry || !entry.completed) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// Approved plans are kept per day (state.plans[dayNum]), so today's and
// tomorrow's live side by side; a plan built but not approved yet waits in
// state.drafts[dayNum] and doesn't count until it is.
export function planFor(state, dayNum) {
  return (state.plans && state.plans[dayNum]) || null;
}
export function draftFor(state, dayNum) {
  return (state.drafts && state.drafts[dayNum]) || null;
}
// What the review screen shows and edits for a day: its draft if there is
// one, otherwise its approved plan.
export function workingPlan(state, dayNum) {
  return draftFor(state, dayNum) || planFor(state, dayNum) || {};
}
// A one-off task already in another upcoming day's approved plan belongs to
// that day, so it isn't planned (or listed as open) anywhere else. Each
// occurrence of a repeating task is its own thing.
export function plannedElsewhere(state, d, dayNum) {
  if (d.repeatDays && d.repeatDays.length) return false;
  return Object.keys(state.plans || {}).some((k) => +k !== dayNum && +k >= NUM_TODAY && state.plans[k] && state.plans[k][d.id]);
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
  const sched = planFor(state, dayNum) || {};
  const school = (id) => state.taskDefs.some((d) => d.id === id && d.category !== 'personal');
  const planned = Object.keys(sched).filter(school).sort((a, b) => sched[a].start - sched[b].start);
  const done = planned.filter((id) => statusOn(state, id, dayNum) === 'completed');
  const open = planned.filter((id) => ['planned', 'in_progress', 'paused'].includes(statusOn(state, id, dayNum)));
  const moved = state.taskDefs
    .filter((d) => d.category !== 'personal' && !sched[d.id] && taskDueOnDay(d, dayNum) && statusOn(state, d.id, dayNum) === 'moved')
    .map((d) => d.id);
  // Sessions finished that day while today's plan wasn't the active one
  // (e.g. tomorrow's plan was already approved) — still real work done.
  const offPlanDone = state.taskDefs
    .filter((d) => d.category !== 'personal' && !sched[d.id])
    .filter((d) => {
      const st = state.taskState[taskKey(d, dayNum)] || {};
      return st.status === 'completed' && (st.day != null ? st.day === dayNum : taskDueOnDay(d, dayNum));
    })
    .map((d) => d.id);
  return { planned, done, offPlanDone, unfinished: open.concat(moved), lastEnd: planned.reduce((m, id) => Math.max(m, sched[id].start + sched[id].dur), 0) };
}

// When a task is planned for, as the task list shows it: repeating, today,
// tomorrow (also a task with no fixed day), or its date.
export function taskDayLabel(t, d) {
  if (d.repeatDays && d.repeatDays.length) return t('taskEdit.dayRepeat');
  if (d.day == null || d.day === REFERENCE_DAY) return t('taskEdit.dayTomorrow');
  if (d.day === NUM_TODAY) return t('taskEdit.dayToday');
  return formatMonthDay(d.day);
}

// The Monday–Sunday week containing today, as day-nums.
export function currentWeekNums() {
  const monday = NUM_TODAY - ((realDateForNum(NUM_TODAY).getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => monday + i);
}

// Minutes studied per day, finished tasks and time per subject for this
// week, read straight off taskState: every finished session records its day
// and real minutes, and a ticked to-do its doneDay.
export function weekStats(state) {
  const nums = currentWeekNums();
  const minutes = Object.fromEntries(nums.map((n) => [n, 0]));
  const bySubject = {};
  let tasksDone = 0;
  const defs = new Map(state.taskDefs.map((d) => [d.id, d]));
  Object.entries(state.taskState || {}).forEach(([key, st]) => {
    const d = defs.get(key.split(':')[0]);
    if (!d || !st) return;
    if (d.category === 'personal') {
      if (st.doneDay in minutes && isTaskOn(state.tasks, d, st.doneDay)) tasksDone++;
      return;
    }
    if (st.status !== 'completed' || !(st.day in minutes)) return;
    const mins = Math.max(0, Math.round(st.actual ?? d.dur ?? 0));
    minutes[st.day] += mins;
    tasksDone++;
    const subject = d.subject || 'Inny';
    if (!bySubject[subject]) bySubject[subject] = { subject, minutes: 0, color: d.color };
    bySubject[subject].minutes += mins;
  });
  const total = nums.reduce((a, n) => a + minutes[n], 0);
  const subjects = Object.values(bySubject)
    .filter((x) => x.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
    .map((x) => ({ ...x, pct: Math.round((x.minutes / total) * 100) }));
  return { days: nums.map((num) => ({ num, minutes: minutes[num] })), total, tasksDone, subjects };
}

// How far an exam's prep plan has got: its prep sessions (see confirmPrep in
// usePlanner.js) are real tasks, so a session counts once it's completed —
// or ticked off on the exam itself.
export function examPrepProgress(state, examId) {
  const sessions = state.examSessions?.[examId] || [];
  const done = sessions.filter((sess, i) => sess.done || (state.taskState['examsession-' + examId + '-' + i] || {}).status === 'completed').length;
  return { done, total: sessions.length, pct: sessions.length ? Math.round((done / sessions.length) * 100) : 0 };
}

// For a floating one-off task (no fixed day, no repeat — its done-state is
// shared by every day it's due on): the day it was finished, null while
// it's still open, or undefined when it was finished before that day
// started being recorded.
export function finishedOnDay(state, d) {
  const st = state.taskState[d.id] || {};
  if (d.category === 'personal') {
    if (st.status === 'skipped') return st.day ?? undefined;
    return isTaskOn(state.tasks, d, null) ? st.doneDay ?? undefined : null;
  }
  return ['completed', 'skipped'].includes(st.status) ? st.day ?? undefined : null;
}

export function studiedToday(studyHistory) {
  return !!studyHistory?.[localDateKey()]?.completed;
}

// YYYY-MM-DD in the device's own timezone — what the push server compares
// against its tz-shifted clock (see localNow in api/_lib/push.js).
export function localDateKey(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Planned vs. actual study time over the last 7 real-world days.
export function weeklyReview(studyHistory) {
  const entries = [];
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const entry = studyHistory[localDateKey(d)];
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

// The running session's clock, shared by the focus screen, the running bar
// and Home: its length is the planned block plus any "+1 min" taps, and a
// pause stops the clock (sessionStart is null while paused).
export function sessionDur(state) {
  const id = state.activeTask;
  if (!id) return 0;
  return planFor(state, NUM_TODAY)?.[id]?.dur || state.taskDefs.find((d) => d.id === id)?.dur || 30;
}

export function sessionClock(state, now = Date.now()) {
  const paused = !state.sessionStart;
  const elapsedMs = (state.sessionElapsedMs || 0) + (paused ? 0 : now - state.sessionStart);
  const totalMin = sessionDur(state) + (state.sessionExtraMin || 0);
  const totalMs = totalMin * 60000;
  const remainingMs = totalMs - elapsedMs;
  const overtime = remainingMs < 0;
  const abs = Math.abs(remainingMs);
  const label = (overtime ? '+' : '') + Math.floor(abs / 60000) + ':' + String(Math.floor((abs % 60000) / 1000)).padStart(2, '0');
  return {
    paused, overtime, elapsedMs, totalMin, remainingMs, label,
    remainingFrac: Math.min(1, Math.max(0, remainingMs / totalMs)),
    beganAt: state.sessionBeganAt || now - elapsedMs,
    // Moves later with every pause and "+1 min", so it's the real finish time.
    endsAt: now + Math.max(0, remainingMs),
  };
}

// What's still open on a day besides its planned sessions: unticked to-dos
// and school tasks that never got a session. Any of these means the day
// isn't done yet (Home's "all done" card, the automatic summary). A task
// already in another day's approved plan belongs to that day instead.
export function dayOpenTasks(state, dayNum = NUM_TODAY) {
  const sched = planFor(state, dayNum) || {};
  return state.taskDefs.filter((d) => {
    if (!taskDueOnDay(d, dayNum) || sched[d.id] || plannedElsewhere(state, d, dayNum)) return false;
    const st = state.taskState[taskKey(d, dayNum)] || {};
    if (d.category === 'personal') return !isTaskOn(state.tasks, d, dayNum) && st.status !== 'skipped';
    return (st.status || 'planned') === 'planned' && isTaskOn(state.tasks, d, dayNum);
  });
}

// Minutes after midnight when an unfinished day gets wrapped up anyway: an
// hour before bedtime (a bedtime after midnight counts as 23:00) — the same
// moment the end-of-day push goes out (see api/_lib/push.js).
export function wrapUpMinutes(bedtime) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(bedtime || '22:30');
  const bed = m ? (+m[1]) * 60 + (+m[2]) : 22 * 60 + 30;
  return bed < 6 * 60 ? 23 * 60 : bed - 60;
}

// "Subject — title" for a task row, always in the current language: the
// stored `short` text froze the subject name in whichever language the task
// was created in ("Inny — Homework"). The student's own title stays as typed.
export function taskShortLabel(t, d) {
  const fixed = t(TASK_TEXT_KEY[d.id]?.short);
  if (fixed) return fixed;
  const title = t(TASK_TEXT_KEY[d.id]?.title) || d.title;
  if (d.category === 'personal' || !d.subject) return title;
  return (t(VALUE_KEY[d.subject]) || d.subject) + ' — ' + title;
}

// "Today" / "Tomorrow" / "In N days" for an exam countdown pill.
export function daysPill(t, n) {
  if (n === 0) return t('cal.todayPill');
  if (n === 1) return t('cal.tomorrowPill');
  return t('cal.inDaysPill', { n });
}

// Why today needs a restart right now, if it does — the one rule behind the
// Home card and the phone reminders:
// - missed: a session in today's approved plan wasn't started by its end
//   time (the latest such session is named);
// - noPlan: from 14:00, today has no approved plan while tasks are still due.
// Nothing while a session runs, once the day is summarized, or with nothing
// left to do. `key` changes with each new reason, so "Not now" only hides
// the card until something new goes off track.
export const NO_PLAN_NUDGE_MINUTES = 14 * 60;
export function offTrackReason(state, nowMinutes) {
  if (state.activeTask || state.daySummaries?.[localDateKey()]) return null;
  const plan = planFor(state, NUM_TODAY) || {};
  const def = (id) => state.taskDefs.find((d) => d.id === id);
  const sessions = Object.keys(plan).filter((id) => def(id));
  const open = dayOpenTasks(state, NUM_TODAY);
  if (sessions.length) {
    const missed = sessions
      .filter((id) => statusOn(state, id, NUM_TODAY) === 'planned' && nowMinutes > plan[id].start + plan[id].dur)
      .sort((a, b) => plan[a].start - plan[b].start);
    if (!missed.length) return null;
    const id = missed[missed.length - 1];
    const pending = sessions.filter((x) => ['planned', 'paused'].includes(statusOn(state, x, NUM_TODAY)));
    return { kind: 'missed', key: 'missed:' + id + ':' + NUM_TODAY, id, count: missed.length, start: plan[id].start, end: plan[id].start + plan[id].dur, left: pending.length + open.length };
  }
  if (nowMinutes >= NO_PLAN_NUDGE_MINUTES && open.length) return { kind: 'noPlan', key: 'noplan:' + NUM_TODAY, left: open.length };
  return null;
}
