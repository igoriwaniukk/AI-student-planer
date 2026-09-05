import { useMemo } from 'react';
import { translate } from './i18n';
import { LanguageContext } from './languageContextObject';

export function LanguageProvider({ lang, setLang, children }) {
  const value = useMemo(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
