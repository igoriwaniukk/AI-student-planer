import { KEYS } from './store';

export const STATUS_LABEL = {
  planned: 'Zaplanowane', in_progress: 'W trakcie', paused: 'Wstrzymane',
  completed: 'Wykonane', moved: 'Przeniesione', skipped: 'Pominięte',
};
export const STATUS_COLOR = {
  planned: '#9a9aab', in_progress: '#c9baff', paused: '#f5a524',
  completed: '#35d07f', moved: '#8fbaff', skipped: '#8a8a99',
};

export const PRIORITIES = ['Wysoki priorytet', 'Normalny priorytet', 'Niższy priorytet'];
export const PRIO_STYLE = {
  'Wysoki priorytet': { color: '#c9baff', bg: 'rgba(124,92,255,.2)' },
  'Normalny priorytet': { color: '#8ff0de', bg: 'rgba(46,230,197,.14)' },
  'Niższy priorytet': { color: '#9a9aab', bg: 'rgba(255,255,255,.07)' },
};
// Day numbers throughout the app are a logical index, not a literal
// day-of-month: num 19 is "today", 20 is the day after ("jutro" —
// deadlines are phrased "za N dni" relative to it), and so on. Anything
// that needs an actual day-of-month, weekday name, or month name converts a
// num through realDateForNum()/dayInfo() (see plannerLogic.js) instead of
// treating the raw num as a calendar date — so paging weeks forward in the
// UI rolls over month/year boundaries correctly instead of drifting into
// numbers like 40.
//
// NUM_TODAY has to actually advance by one every real day, not just mean
// "whatever day it is right now" — otherwise a task saved as "today"
// (day: 19) on Monday would silently become "today" again when the app is
// reopened Tuesday (19 redefined as "now" all over again), reappearing with
// its old completed status forever instead of correctly becoming
// "yesterday". So a real anchor date is persisted once — synced like any
// other durable field via cloudSync.js/store.js's KEYS, so every device
// agrees on what day 19 actually was — and NUM_TODAY is computed as that
// fixed anchor's day-num plus however many real days have elapsed since,
// instead of being pinned at 19 forever.
const ANCHOR_NUM = 19;

function loadOrCreateAnchor() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const fresh = { num: ANCHOR_NUM, dateISO: todayISO };
  if (typeof localStorage === 'undefined') return fresh;
  try {
    const raw = localStorage.getItem(KEYS.dayAnchor);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.dateISO === 'string' && Number.isFinite(parsed.num)) return parsed;
    }
    localStorage.setItem(KEYS.dayAnchor, JSON.stringify(fresh));
  } catch {
    // Storage unavailable/corrupted — fall back to an in-memory anchor for
    // this load; NUM_TODAY just won't persist across reloads here, no worse
    // than before this fix existed.
  }
  return fresh;
}

const ANCHOR = loadOrCreateAnchor();
const ANCHOR_DATE = new Date(ANCHOR.dateISO + 'T00:00:00');
const TODAY_MIDNIGHT = new Date();
TODAY_MIDNIGHT.setHours(0, 0, 0, 0);
const ELAPSED_DAYS_SINCE_ANCHOR = Math.round((TODAY_MIDNIGHT - ANCHOR_DATE) / 86400000);

export const NUM_TODAY = ANCHOR.num + ELAPSED_DAYS_SINCE_ANCHOR;
// Kept as the anchor's own real date (not "now") — realDateForNum below
// measures every num relative to it, so num values that predate today
// (like an old task's day: 19) keep resolving to the same fixed calendar
// date they always have, instead of drifting forward with NUM_TODAY.
const TODAY_REAL = ANCHOR_DATE;

export function realDateForNum(num) {
  const d = new Date(TODAY_REAL);
  d.setDate(d.getDate() + (num - ANCHOR.num));
  return d;
}

export const REFERENCE_DAY = NUM_TODAY + 1;

export const WEEKDAY_META = [
  { label: 'Niedziela', short: 'ND', school: false },
  { label: 'Poniedziałek', short: 'PN', school: true },
  { label: 'Wtorek', short: 'WT', school: true },
  { label: 'Środa', short: 'ŚR', school: true },
  { label: 'Czwartek', short: 'CZW', school: true },
  { label: 'Piątek', short: 'PT', school: true },
  { label: 'Sobota', short: 'SOB', school: false },
];
export const WEEK_DAYS = Array.from({ length: 7 }, (_, i) => {
  const num = NUM_TODAY - 3 + i;
  return { num, ...WEEKDAY_META[realDateForNum(num).getDay()] };
});
// Real exams/deadlines come entirely from state.customExams (see
// upcomingExams in plannerLogic.js) — a new account starts with none, rather
// than a demo exam nobody actually entered.
export const EXAMS = [];

export const SUBJECTS = ['Matematyka', 'Biologia', 'Angielski', 'Polski', 'Historia', 'Geografia', 'Fizyka', 'Chemia', 'Inny'];
export const PRIORITY_SUBJECT_OPTIONS = SUBJECTS.filter((s) => s !== 'Inny');
export const GOALS = ['Zaliczyć', 'Ocena co najmniej 3', 'Ocena co najmniej 4', 'Ocena co najmniej 5', 'Bez konkretnego celu'];
export const IMPORTANCE_OPTIONS = ['Niski', 'Średni', 'Wysoki'];
export const LEVELS = ['Nie znam', 'Znam podstawy', 'Średnio', 'Dobrze', 'Bardzo dobrze'];
export const KINDS = ['Sprawdzian', 'Kartkówka', 'Praca domowa', 'Projekt', 'Prezentacja', 'Egzamin próbny'];

// Loading-step captions for GeneratingOverlay — i18n keys, not raw text,
// since they're translated at render time (see GeneratingOverlay in ui.jsx).
export const PREP_LABELS = ['gen.prep.1', 'gen.prep.2', 'gen.prep.3', 'gen.prep.4', 'gen.prep.5'];
export const RESCUE_LABELS = ['gen.rescue.1', 'gen.rescue.2', 'gen.rescue.3', 'gen.rescue.4', 'gen.rescue.5'];
export const PLAN_LABELS = ['gen.plan.1', 'gen.plan.2', 'gen.plan.3', 'gen.plan.4'];

export const HARD_OPTIONS = ['Łatwa', 'W sam raz', 'Trudna'];
export const KNOW_OPTIONS = ['Nie umiem', 'Częściowo umiem', 'Dobrze umiem', 'Opanowane'];
export const DAY_HARD_OPTIONS = ['Lekki', 'W sam raz', 'Trudny', 'Bardzo trudny'];
export const ENERGY_OPTIONS = ['Niska', 'Normalna', 'Wysoka'];
export const PREF_OPTIONS = ['Wolny wieczór', 'Najpierw najtrudniejsze', 'Więcej krótkich przerw'];
export const STUDY_TIME_OPTIONS = ['Rano', 'Popołudniu', 'Wieczorem'];
export const RECUR_DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
export const REASON_OPTIONS = ['Mam mniej czasu', 'Mam mniej energii', 'Plan się opóźnił', 'Pojawiło się coś pilnego'];
export const RESCUE_TIME_OPTIONS = ['45 min', '1 godz. 30 min', '2 godz.', 'Własny czas'];
// Minutes of real study time each option promises — the rescue planner's
// hard budget ceiling. "Własny czas" has no picker of its own yet, so it
// falls back to a reasonable middle-ground guess.
export const RESCUE_TIME_MINUTES = { '45 min': 45, '1 godz. 30 min': 90, '2 godz.': 120, 'Własny czas': 90 };
