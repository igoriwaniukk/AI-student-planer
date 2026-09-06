import { useContext } from 'react';
import { LanguageContext } from './languageContextObject';

export function useLang() {
  return useContext(LanguageContext);
}
