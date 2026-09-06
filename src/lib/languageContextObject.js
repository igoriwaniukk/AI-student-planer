import { createContext } from 'react';

export const LanguageContext = createContext({ lang: 'pl', setLang: () => {}, t: (key) => key });
