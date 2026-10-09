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
  es: {
    offlineTitle: 'Sin conexión',
    offlineBody: 'Pulgo necesita internet para cargar tu plan. Revisa el wifi o los datos móviles e inténtalo de nuevo.',
    errorTitle: 'Algo salió mal',
    errorBody: 'No se pudo cargar Pulgo. Inténtalo de nuevo en un momento.',
    retry: 'Reintentar',
    remindersChannel: 'Recordatorios',
  },
  pt: {
    offlineTitle: 'Sem ligação',
    offlineBody: 'O Pulgo precisa de internet para carregar o teu plano. Verifica o Wi-Fi ou os dados móveis e tenta outra vez.',
    errorTitle: 'Algo correu mal',
    errorBody: 'Não foi possível carregar o Pulgo. Tenta outra vez daqui a pouco.',
    retry: 'Tentar outra vez',
    remindersChannel: 'Lembretes',
  },
  de: {
    offlineTitle: 'Keine Verbindung',
    offlineBody: 'Pulgo braucht Internet, um deinen Plan zu laden. Prüf WLAN oder mobile Daten und versuch es noch einmal.',
    errorTitle: 'Etwas ist schiefgelaufen',
    errorBody: 'Pulgo konnte nicht geladen werden. Versuch es gleich noch einmal.',
    retry: 'Erneut versuchen',
    remindersChannel: 'Erinnerungen',
  },
  fr: {
    offlineTitle: 'Pas de connexion',
    offlineBody: 'Pulgo a besoin d’internet pour charger ton plan. Vérifie le Wi-Fi ou les données mobiles et réessaie.',
    errorTitle: 'Un problème est survenu',
    errorBody: 'Impossible de charger Pulgo. Réessaie dans un instant.',
    retry: 'Réessayer',
    remindersChannel: 'Rappels',
  },
  it: {
    offlineTitle: 'Nessuna connessione',
    offlineBody: 'Pulgo ha bisogno di internet per caricare il tuo piano. Controlla il Wi-Fi o i dati mobili e riprova.',
    errorTitle: 'Qualcosa è andato storto',
    errorBody: 'Impossibile caricare Pulgo. Riprova tra poco.',
    retry: 'Riprova',
    remindersChannel: 'Promemoria',
  },
  zh: {
    offlineTitle: '没有网络连接',
    offlineBody: 'Pulgo 需要联网才能加载你的计划。请检查 Wi-Fi 或移动数据后重试。',
    errorTitle: '出了点问题',
    errorBody: '无法加载 Pulgo，请稍后再试。',
    retry: '重试',
    remindersChannel: '提醒',
  },
  ja: {
    offlineTitle: '接続がありません',
    offlineBody: 'プランを読み込むには Pulgo にインターネット接続が必要です。Wi-Fi またはモバイルデータを確認して、もう一度お試しください。',
    errorTitle: '問題が発生しました',
    errorBody: 'Pulgo を読み込めませんでした。少ししてからもう一度お試しください。',
    retry: '再試行',
    remindersChannel: 'リマインダー',
  },
};

export function deviceLang() {
  const code = getLocales()[0]?.languageCode;
  return STRINGS[code] ? code : 'en';
}
