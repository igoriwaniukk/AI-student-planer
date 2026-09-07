export const TASK_DEFS = [
  {
    id: 'math', subject: 'Matematyka', title: 'Przygotowanie do sprawdzianu', dur: 60,
    priority: 'Wysoki priorytet', color: '#a58cff', deadline: 'Sprawdzian za 2 dni', short: 'Matematyka — sprawdzian',
    why: 'Najważniejszy blok, ponieważ sprawdzian jest za 2 dni. Trudniejsze zadanie zostało zaplanowane najwcześniej.',
    note: '',
  },
  {
    id: 'bio', subject: 'Biologia', title: 'Powtórka z fotosyntezy', dur: 45,
    priority: 'Normalny priorytet', color: '#2ee6c5', short: 'Biologia — powtórka',
    why: 'Materiał jest jeszcze świeży, dlatego powtórka została zaplanowana przed tenisem.',
    note: '',
  },
  {
    id: 'eng', subject: 'Angielski', title: 'Nauka słówek', dur: 30,
    priority: 'Niższy priorytet', color: '#a58cff', short: 'Angielski — słówka',
    why: 'Lżejsze zadanie zostało zaplanowane po treningu, gdy energia może być niższa.',
    note: '',
  },
];

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
export const DEFAULT_START = { math: 930, bio: 1000, eng: 1170 };

// Day numbers throughout the app are a logical index, not a literal
// day-of-month: num 19 is anchored to whatever real day the app happens to
// be running on ("today"), 20 is the day after ("jutro" — deadlines are
// phrased "za N dni" relative to it), and so on. Anything that needs an
// actual day-of-month, weekday name, or month name converts a num through
// realDateForNum()/dayInfo() (see plannerLogic.js) instead of treating the
// raw num as a calendar date — so paging weeks forward in the UI rolls over
// month/year boundaries correctly instead of drifting into numbers like 40.
const NUM_TODAY = 19;
const TODAY_REAL = new Date();
TODAY_REAL.setHours(0, 0, 0, 0);

export function realDateForNum(num) {
  const d = new Date(TODAY_REAL);
  d.setDate(d.getDate() + (num - NUM_TODAY));
  return d;
}

export const REFERENCE_DAY = NUM_TODAY + 1;
export const TENIS_DAY = REFERENCE_DAY;

const WEEKDAY_META = [
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
export const EXAMS = [
  { id: 'math', subject: 'Matematyka', title: 'Sprawdzian', color: '#a58cff', day: REFERENCE_DAY + 2 },
  { id: 'bio', subject: 'Biologia', title: 'Sprawdzian', color: '#2ee6c5', day: REFERENCE_DAY + 11, requires: 'bioDeadlineSaved' },
];

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

export const SESSION_DATES = ['Wtorek, 21 lipca', 'Czwartek, 23 lipca', 'Sobota, 25 lipca', 'Poniedziałek, 27 lipca', 'Środa, 29 lipca', 'Czwartek, 30 lipca'];
export const SESSIONS = [
  { time: '17:00–17:35', dur: '35 min', title: 'Prawa Mendla — podstawy', type: 'Pierwszy kontakt', why: 'Najpierw uporządkujemy podstawowe pojęcia potrzebne do kolejnych tematów.' },
  { time: '16:30–17:10', dur: '40 min', title: 'Krzyżówki genetyczne — wprowadzenie', type: 'Ćwiczenia', why: 'Pierwsze zadania pojawiają się po poznaniu zasad dziedziczenia.' },
  { time: '11:00–11:40', dur: '40 min', title: 'Grupy krwi i krzyżówki', type: 'Nowy materiał i ćwiczenia', why: 'Łączymy drugi temat z praktycznymi przykładami.' },
  { time: '16:30–17:10', dur: '40 min', title: 'Zadania mieszane z genetyki', type: 'Utrwalenie', why: 'Ćwiczenia ze wszystkich tematów pokażą, które elementy wymagają poprawy.' },
  { time: '17:00–17:30', dur: '30 min', title: 'Powtórka trudniejszych obszarów', type: 'Powtórka', why: 'Wracamy do tematów ocenionych najsłabiej podczas wcześniejszych ćwiczeń.' },
  { time: '16:30–16:55', dur: '25 min', title: 'Krótki test przed sprawdzianem', type: 'Samosprawdzenie', why: 'Ostatniego dnia sprawdzisz gotowość bez przeciążania wieczoru.' },
];

export const HARD_OPTIONS = ['Łatwa', 'W sam raz', 'Trudna'];
export const KNOW_OPTIONS = ['Nie umiem', 'Częściowo umiem', 'Dobrze umiem', 'Opanowane'];
export const DAY_HARD_OPTIONS = ['Lekki', 'W sam raz', 'Trudny', 'Bardzo trudny'];
export const ENERGY_OPTIONS = ['Niska', 'Normalna', 'Wysoka'];
export const PREF_OPTIONS = ['Wolny wieczór', 'Najpierw najtrudniejsze', 'Więcej krótkich przerw'];
export const STUDY_TIME_OPTIONS = ['Rano', 'Popołudniu', 'Wieczorem'];
export const RECUR_DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
export const REASON_OPTIONS = ['Mam mniej czasu', 'Mam mniej energii', 'Plan się opóźnił', 'Pojawiło się coś pilnego'];
export const RESCUE_TIME_OPTIONS = ['45 min', '1 godz. 30 min', '2 godz.', 'Własny czas'];
