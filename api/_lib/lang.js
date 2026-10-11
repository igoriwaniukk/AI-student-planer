// The app's languages as the AI prompts name them. The prompts themselves
// are written in Polish; these lines tell the model which language to
// answer in. Anything unknown falls back to Polish, the app's default.
const NAMES = {
  pl: 'Polish', en: 'English', es: 'Spanish', pt: 'European Portuguese', de: 'German',
  fr: 'French', it: 'Italian', zh: 'Simplified Chinese', ja: 'Japanese',
};

export function langName(lang) {
  return NAMES[lang] || NAMES.pl;
}

export function isKnownLang(lang) {
  return Object.prototype.hasOwnProperty.call(NAMES, lang);
}

// A rough guess of which app language a short chat message is in, or null
// when it's unclear (an emoji, a name, a number). Script decides Chinese and
// Japanese; for the rest, Polish letters or the most common little words.
const WORDS = {
  pl: 'i w z na nie to się jest że do co jak mi mam mnie czy ale jestem dzisiaj jutro proszę dzięki chcę możesz mój moja kiedy',
  en: 'the a an is are am i you to and of in it my me that this what how can do will with for not have tell please want be so much make today tomorrow help when',
  es: 'el la los las es y de que en un una por para no me mi qué cómo puedes quiero tengo hoy mañana ayuda con estoy',
  pt: 'o os as é e de que em um uma para não me meu minha você como posso quero tenho hoje amanhã ajuda com estou',
  de: 'der die das ist und ich du nicht ein eine zu mit mir mein meine was wie kannst bitte heute morgen hilfe habe bin',
  fr: 'le la les est et je tu de que un une pour pas me mon ma moi quoi comment peux veux ai aujourd demain aide avec suis',
  it: 'il lo la gli le è e di che un una per non mi mio mia cosa come puoi voglio ho oggi domani aiuto con sono',
};
const WORD_SETS = Object.fromEntries(Object.entries(WORDS).map(([k, v]) => [k, new Set(v.split(' '))]));

export function detectLang(text) {
  const s = String(text || '').toLowerCase();
  if (/[぀-ヿ]/.test(s)) return 'ja';
  if (/[一-鿿]/.test(s)) return 'zh';
  if (/[ąćęłńśźż]/.test(s)) return 'pl';
  const tokens = s.match(/\p{L}+/gu) || [];
  const scores = Object.entries(WORD_SETS)
    .map(([lang, set]) => [lang, tokens.filter((w) => set.has(w)).length])
    .sort((a, b) => b[1] - a[1]);
  const [[best, top], [, second]] = scores;
  return top >= 2 && top > second ? best : null;
}
