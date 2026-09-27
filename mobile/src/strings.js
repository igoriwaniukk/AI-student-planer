import { getLocales } from 'expo-localization';

// The few texts the app shows by itself (before the website loads).
// Everything else comes from the website, in the language chosen there.
export const STRINGS = {
  pl: {
    offlineTitle: 'Brak połączenia',
    offlineBody: 'Pulgo potrzebuje internetu, żeby wczytać Twój plan. Sprawdź Wi-Fi lub dane komórkowe i spróbuj ponownie.',
    errorTitle: 'Coś poszło nie tak',
    errorBody: 'Nie udało się wczytać Pulgo. Spróbuj ponownie za chwilę.',
    retry: 'Spróbuj ponownie',
    remindersChannel: 'Przypomnienia',
  },
  en: {
    offlineTitle: 'No connection',
    offlineBody: 'Pulgo needs the internet to load your plan. Check your Wi-Fi or mobile data and try again.',
    errorTitle: 'Something went wrong',
    errorBody: "Pulgo couldn't load. Please try again in a moment.",
    retry: 'Try again',
    remindersChannel: 'Reminders',
  },
};

export function deviceLang() {
  const code = getLocales()[0]?.languageCode;
  return code === 'pl' ? 'pl' : 'en';
}
