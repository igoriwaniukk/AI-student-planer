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
  Historia: ['history', 'histori', 'ancient', 'starożytn', 'war', 'wojn', 'king', 'król'],
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
  ['💳', ['bill', 'rachunek', 'pay ', 'zapłać', 'payment']],
  ['🚗', ['car', 'samoch', 'drive']],
  ['🌱', ['plant', 'roślin', 'water the', 'podlej']],
  ['📦', ['package', 'paczk', 'delivery', 'dostaw']],
];

const SUBJECT_ICON = {
  Matematyka: '📐', Biologia: '🧬', Angielski: '🔤', Polski: '📖',
  Historia: '🏛️', Geografia: '🌍', Fizyka: '⚛️', Chemia: '🧪', Inny: '📘',
};

// { category: 'school'|'personal', subject: string|null }
export function detectTaskMeta(name) {
  const n = (name || '').toLowerCase();
  if (n.trim()) {
    for (const subject of Object.keys(SUBJECT_KEYWORDS)) {
      if (SUBJECT_KEYWORDS[subject].some((k) => n.includes(k))) return { category: 'school', subject };
    }
    if (GENERAL_SCHOOL_KEYWORDS.some((k) => n.includes(k))) return { category: 'school', subject: 'Inny' };
  }
  return { category: 'personal', subject: null };
}

// A topic-relevant emoji for a saved task — subject-based for school tasks,
// keyword-based (falling back to a generic note icon) for personal ones.
export function iconForTask(d) {
  if (d.category === 'personal') {
    const n = (d.title || '').toLowerCase();
    const hit = PERSONAL_ICON_ENTRIES.find(([, keywords]) => keywords.some((k) => n.includes(k)));
    return hit ? hit[0] : '📝';
  }
  return SUBJECT_ICON[d.subject] || '📘';
}
