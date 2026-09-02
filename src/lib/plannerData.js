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

export const SUBJECTS = ['Matematyka', 'Biologia', 'Angielski', 'Polski', 'Historia', 'Geografia', 'Fizyka', 'Chemia', 'Inny'];
export const GOALS = ['Zaliczyć', 'Ocena co najmniej 3', 'Ocena co najmniej 4', 'Ocena co najmniej 5', 'Bez konkretnego celu'];
export const LEVELS = ['Nie znam', 'Znam podstawy', 'Średnio', 'Dobrze', 'Bardzo dobrze'];
export const KINDS = ['Sprawdzian', 'Kartkówka', 'Praca domowa', 'Projekt', 'Prezentacja', 'Egzamin próbny'];

export const PREP_LABELS = ['Sprawdzam Twój kalendarz', 'Dzielę materiał na etapy', 'Dodaję powtórki', 'Planuję samosprawdzenie', 'Plan przygotowania jest gotowy'];
export const RESCUE_LABELS = ['Sprawdzam pozostały czas', 'Chronię najważniejsze zadanie', 'Skracam mniej ważne bloki', 'Przenoszę to, co się nie zmieści', 'Nowy plan jest gotowy'];
export const PLAN_LABELS = ['Sprawdzam wolny czas...', 'Ustalam priorytety...', 'Dodaję przerwy i bufor...', 'Plan jest gotowy'];

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
export const REASON_OPTIONS = ['Mam mniej czasu', 'Mam mniej energii', 'Plan się opóźnił', 'Pojawiło się coś pilnego'];
export const RESCUE_TIME_OPTIONS = ['45 min', '1 godz. 30 min', '2 godz.', 'Własny czas'];
