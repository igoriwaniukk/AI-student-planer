// Guesses whether a task is school-related (and which subject) or a
// personal errand, plus a topic emoji — all from the task's own name, so
// the student never has to pick School/Personal themselves. Deliberately a
// plain keyword heuristic rather than a real AI call: it needs to update on
// every keystroke with no latency, no network dependency and no per-call
// cost, and TaskEditSheet always lets the student flip a wrong guess by
// hand, so perfect accuracy isn't required — just a reasonable default.
// Keywords cover both Polish and English since the app is bilingual and a
// task's name isn't necessarily in the UI's current display language.
const SUBJECT_KEYWORDS = {
  Matematyka: ['math', 'matemat', 'algebra', 'geometr', 'calculus', 'equation', 'równani', 'liczb'],
  Biologia: ['biolog', 'genetic', 'genetyk', 'cell', 'komórk', 'ecosystem', 'ekosystem', 'photosynth', 'fotosyntez'],
  Angielski: ['english', 'angielsk', 'vocabulary', 'słówk', 'grammar', 'gramatyk'],
  Polski: ['polish', 'język polski', 'literatur', 'lektur', 'essay', 'wypracowani', 'poem', 'wiersz'],
  Historia: ['history', 'histori', 'ancient', 'starożytn', '=war', '=wars', 'wojn', '=king', '=kings', 'król'],
  Geografia: ['geograph', 'geografi', 'map', 'mapa', 'climate', 'klimat', 'continent', 'kontynent'],
  Fizyka: ['physics', 'fizyk', 'force', 'siła', 'motion', 'ruch', 'velocity', 'prędkoś'],
  Chemia: ['chemistry', 'chemi', 'reaction', 'reakcj', 'molecule', 'cząsteczk', 'acid', 'kwas'],
};

// Generic school words with no specific-subject match — still school (gets
// a subject picker + a scheduled session), just falls back to "Inny"/Other.
const GENERAL_SCHOOL_KEYWORDS = [
  'homework', 'praca domowa', 'zadanie domowe', 'exam', 'sprawdzian', 'quiz', 'kartkówka',
  'project', 'projekt', 'presentation', 'prezentacj', 'study', 'nauka', 'naucz', 'lesson', 'lekcj',
  'class', 'klasów', 'chapter', 'rozdział', 'assignment', 'test', 'notes', 'notatk', 'revise', 'powtórk',
  'textbook', 'podręcznik', 'worksheet', 'ćwiczeni',
];

// Ordered so a more specific match (e.g. "walk the dog") wins over a vaguer
// one — checked top to bottom, first hit wins.
const PERSONAL_ICON_ENTRIES = [
  ['🛒', ['shop', 'zakup', 'sklep', 'grocery', 'groceries']],
  ['🐕', ['dog', 'pies', 'psa']],
  ['🧹', ['clean', 'sprzątani', 'sprzątać', 'tidy', 'porządk']],
  ['🧺', ['laundry', 'pranie', 'washing']],
  ['📞', ['call', 'zadzwoń', 'phone']],
  ['🍳', ['cook', 'gotow', 'dinner', 'obiad', 'lunch', 'kolacj']],
  ['🩺', ['doctor', 'lekarz', 'dentist', 'dentyst', 'appointment', 'wizyta']],
  ['🏋️', ['gym', 'siłowni', 'workout', 'trening', 'exercise', 'ćwiczeni fizyczn']],
  ['🎁', ['birthday', 'urodziny', 'gift', 'prezent']],
  ['💳', ['bill', 'rachunek', '=pay', 'zapłać', 'payment']],
  ['🚗', ['=car', '=cars', 'samoch', 'drive']],
  ['🌱', ['plant', 'roślin', 'water the', 'podlej']],
  ['📦', ['package', 'paczk', 'delivery', 'dostaw']],
  ['📚', ['read', '=book', '=books', 'czyta', 'książk', 'ksiazk', 'lektur']],
];

const SUBJECT_ICON = {
  Matematyka: '📐', Biologia: '🧬', Angielski: '💬', Polski: '📖',
  Historia: '🏛️', Geografia: '🌍', Fizyka: '⚛️', Chemia: '🧪', Inny: '📘',
};

// { category: 'school'|'personal', subject: string|null }
// Keywords match the start of a word ("biolog" → "biologia"), never the
// middle of one — "king" used to match "cooking"/"parking" and "war"
// "warzywa"/"Warszawa", turning chores into History. "=word" must be the
// whole word; a keyword with a space matches that phrase from a word start.
function hasKeyword(text, keywords) {
  const words = (text || '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const phrase = ' ' + words.join(' ');
  return keywords.some((k) => {
    if (k.startsWith('=')) return words.includes(k.slice(1));
    if (k.includes(' ')) return phrase.includes(' ' + k.trim());
    return words.some((w) => w.startsWith(k));
  });
}

export function detectTaskMeta(name) {
  if ((name || '').trim()) {
    for (const subject of Object.keys(SUBJECT_KEYWORDS)) {
      if (hasKeyword(name, SUBJECT_KEYWORDS[subject])) return { category: 'school', subject };
    }
    if (hasKeyword(name, GENERAL_SCHOOL_KEYWORDS)) return { category: 'school', subject: 'Inny' };
  }
  return { category: 'personal', subject: null };
}

// A topic-relevant emoji for a saved task — subject-based for school tasks,
// keyword-based (falling back to a generic note icon) for personal ones.
// Which animated focus-ring icon each subject gets (see SubjectArt.jsx).
export const SUBJECT_ART = {
  Matematyka: 'math', Biologia: 'dna', Angielski: 'speech', Polski: 'book', Historia: 'scroll',
  Geografia: 'globe', Fizyka: 'atom', Chemia: 'tube', Inny: 'book',
};

export function iconForSubject(subject) {
  return SUBJECT_ICON[subject] || '📘';
}

// A topic emoji for a weekly activity, from its name.
const ACTIVITY_ICON_ENTRIES = [
  ['⚽', ['football', 'soccer', 'piłk', 'nożn']],
  ['🏀', ['basket', 'kosz']],
  ['🏐', ['volley', 'siatk']],
  ['🎾', ['tennis', 'tenis']],
  ['🏊', ['swim', 'pływ', 'basen', 'pool']],
  ['🎹', ['piano', 'pianin', 'fortepian', 'keyboard']],
  ['🎸', ['guitar', 'gitar']],
  ['🎻', ['violin', 'skrzyp']],
  ['🎤', ['sing', 'śpiew', 'choir', 'chór', 'vocal', 'wokal']],
  ['🎵', ['music', 'muzy']],
  ['💃', ['dance', 'taniec', 'tańc', 'balet', 'ballet']],
  ['🥋', ['karate', 'judo', 'taekwondo', 'boks', '=box', 'boxing', 'martial', 'mma']],
  ['🏃', ['=run', 'running', 'biega', 'bieg', 'athlet', 'lekkoatlet']],
  ['🚴', ['bike', 'cycl', 'rower']],
  ['🏋️', ['gym', 'siłowni', 'workout', 'trening', 'fitness']],
  ['♟️', ['chess', 'szach']],
  ['🎨', ['=art', '=arts', 'plasty', 'rysun', 'draw', 'paint', 'malow']],
  ['🗣️', ['language', 'język', 'spanish', 'hiszpań', 'german', 'niemieck', 'french', 'francusk']],
  ['📚', ['tutor', 'korepet', 'extra class', 'dodatkow']],
  ['💻', ['coding', 'program', 'robot', 'informaty']],
  // Last, so "lekcja gitary" or "school football" still get their own icon.
  ['🏫', ['school', 'szkoł', 'szkol', 'lekcj', 'liceum', 'technikum', '=class', '=classes']],
];

// null when nothing matches — the Plans screen then draws its own weekly
// icon (🔁 renders as a flat blue box on iPhone).
export function iconForActivity(name) {
  const hit = ACTIVITY_ICON_ENTRIES.find(([, keywords]) => hasKeyword(name, keywords));
  return hit ? hit[0] : null;
}

export function iconForTask(d) {
  if (d.category === 'personal') {
    const hit = PERSONAL_ICON_ENTRIES.find(([, keywords]) => hasKeyword(d.title, keywords));
    return hit ? hit[0] : '📝';
  }
  return SUBJECT_ICON[d.subject] || '📘';
}
