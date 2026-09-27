import { useEffect, useState } from 'react';
import { isNativeApp, postToApp, appRemindersEnabled, REMINDERS_PREF_EVENT } from '../lib/nativeBridge';
import { buildAppReminders } from '../lib/appReminders';
import { translate } from '../lib/i18n';

// Hands the iPhone app the full, current list of reminders to schedule on
// the phone (see appReminders.js) whenever it changes — an empty list when
// the student switched reminders off. Does nothing on the website.
export function useAppReminders({ state, studyHistory, bedtime, unfinishedTitles, titleOf, lang }) {
  const native = isNativeApp();
  const [enabled, setEnabled] = useState(appRemindersEnabled);
  useEffect(() => {
    const onPref = () => setEnabled(appRemindersEnabled());
    window.addEventListener(REMINDERS_PREF_EVENT, onPref);
    return () => window.removeEventListener(REMINDERS_PREF_EVENT, onPref);
  }, []);

  const reminders = native && enabled
    ? buildAppReminders({ state, studyHistory, bedtime, unfinishedTitles, titleOf, t: (key, vars) => translate(lang, key, vars) })
    : [];
  const key = JSON.stringify(reminders);
  useEffect(() => {
    if (!native) return undefined;
    // Batches a burst of edits (ticking off several tasks) into one update.
    const id = setTimeout(() => postToApp('reminders', { reminders: JSON.parse(key) }), 800);
    return () => clearTimeout(id);
  }, [native, key]);
}
