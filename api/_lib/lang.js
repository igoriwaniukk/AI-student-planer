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
