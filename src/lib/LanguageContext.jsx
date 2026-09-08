import { useMemo } from 'react';
import { translate, setCurrentLang } from './i18n';
import { LanguageContext } from './languageContextObject';

export function LanguageProvider({ lang, setLang, children }) {
  // Set synchronously during render (not in an effect) so plain helpers
  // like hm() that read getCurrentLang() are already correct by the time
  // this render's children call them — an effect would apply one render late.
  setCurrentLang(lang);
  const value = useMemo(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
