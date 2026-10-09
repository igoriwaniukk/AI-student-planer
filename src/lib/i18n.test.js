import { describe, it, expect, afterEach } from 'vitest';
import { dict, LANGS, LANG_NAMES, translate, setCurrentLang } from './i18n';
import { pluralForm, zad, formatMonthDay, weekdayName } from './plannerLogic';
import { NUM_TODAY } from './plannerData';

const placeholders = (s) => (s.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort().join(',');

afterEach(() => setCurrentLang('pl'));

describe('every language', () => {
  // A translation may use the English or the Polish placeholders (Polish
  // sometimes needs an extra one, e.g. {word} for "dzień/dni").
  it('has a name and every English text, with the same placeholders', () => {
    const keys = Object.keys(dict.en);
    for (const lang of LANGS) {
      expect(LANG_NAMES[lang]).toBeTruthy();
      const table = dict[lang];
      const missing = keys.filter((k) => typeof table[k] !== 'string');
      expect(missing, lang + ' is missing texts').toEqual([]);
      const wrong = keys.filter((k) => placeholders(table[k]) !== placeholders(dict.en[k]) && placeholders(table[k]) !== placeholders(dict.pl[k]));
      expect(wrong, lang + ' has changed placeholders').toEqual([]);
    }
  });

  it('falls back to English for a text a language lacks', () => {
    expect(translate('es', 'no.such.key')).toBe('no.such.key');
    expect(translate('xx', 'settings.title')).toBe(dict.pl['settings.title']);
  });
});

describe('counting and dates follow the language', () => {
  it('uses each language’s plural rules', () => {
    setCurrentLang('pl');
    expect([1, 2, 5, 12, 22].map(pluralForm)).toEqual(['one', 'few', 'many', 'many', 'few']);
    expect(zad(3)).toBe('3 zadania');
    setCurrentLang('fr');
    expect(pluralForm(0)).toBe('one');
    setCurrentLang('ja');
    expect(pluralForm(1)).toBe('many');
    setCurrentLang('en');
    expect(zad(1)).toBe('1 task');
  });

  it('names days and months in the app language', () => {
    setCurrentLang('de');
    expect(['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']).toContain(weekdayName(NUM_TODAY));
    expect(formatMonthDay(NUM_TODAY)).toMatch(/^\d+\. \S+/);
  });
});
