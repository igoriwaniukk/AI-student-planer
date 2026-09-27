import { useEffect, useState } from 'react';
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush, syncPushState } from '../lib/pushNotifications';
import { isNativeApp, askApp, postToApp, onAppMessage, appRemindersEnabled, setAppRemindersEnabled } from '../lib/nativeBridge';

// Shared by the notification bell and the profile settings toggle, so both
// entry points reflect (and drive) the same underlying browser push
// subscription instead of tracking their own, possibly-drifting state.
// `noPlanToday`, when given, lets the server's scheduled push override its
// usual streak/exam/reminder rotation with a "restart your day" nudge (see
// api/_lib/pushMessages.js) once it's afternoon and nothing's been planned —
// the server has no way to know this on its own, since it only ever sees
// whatever snapshot the client last synced. `tzOffsetMinutes` (minutes east
// of UTC, i.e. the negation of Date#getTimezoneOffset()) is synced
// alongside it so the server can work out the subscriber's actual local
// time instead of assuming its own clock's timezone.
//
// Inside the iPhone app there's no web push at all: the same switch turns
// the app's own reminders on/off (see useAppReminders) and asks the phone
// for notification permission; `native` tells the screens which notes to show.
export function usePushNotifications({ streak, hasUpcomingExam, reminders, lang, noPlanToday }) {
  const native = isNativeApp();
  // idle | subscribed | denied | error | unsupported
  const [pushStatus, setPushStatus] = useState(() => (native || isPushSupported() ? 'idle' : 'unsupported'));
  const tzOffsetMinutes = -new Date().getTimezoneOffset();

  useEffect(() => {
    if (native) {
      // Re-checked on coming back, e.g. after turning notifications on in
      // the iPhone's Settings.
      const apply = (status) => {
        if (status === 'denied') setPushStatus('denied');
        else setPushStatus(status === 'granted' && appRemindersEnabled() ? 'subscribed' : 'idle');
      };
      const check = () => askApp('notif-status', {}, 5000).then((r) => apply(r.status));
      check();
      const onVisible = () => { if (document.visibilityState === 'visible') check(); };
      document.addEventListener('visibilitychange', onVisible);
      // The app asks for permission by itself the first time it has a
      // reminder to schedule, then tells us the answer.
      const off = onAppMessage((msg) => { if (msg.type === 'notif-status') apply(msg.status); });
      return () => { document.removeEventListener('visibilitychange', onVisible); off(); };
    }
    if (!isPushSupported()) return undefined;
    getExistingSubscription().then((sub) => setPushStatus(sub ? 'subscribed' : 'idle'));
    return undefined;
  }, [native]);

  // Keeps the server's last-known snapshot fresh so its scheduled push text
  // (streak / exam / reminder / restart nudge) stays accurate — a no-op
  // until subscribed.
  useEffect(() => {
    if (native || pushStatus !== 'subscribed') return;
    syncPushState({ streak, hasUpcomingExam, reminders, lang, noPlanToday, tzOffsetMinutes });
  }, [native, pushStatus, streak, hasUpcomingExam, reminders, lang, noPlanToday, tzOffsetMinutes]);

  async function togglePush() {
    if (native) {
      if (pushStatus === 'subscribed') {
        setAppRemindersEnabled(false);
        setPushStatus('idle');
        return;
      }
      if (pushStatus === 'denied') {
        postToApp('open-settings');
        return;
      }
      const r = await askApp('notif-request', {}, 60000);
      if (r.status === 'granted') {
        setAppRemindersEnabled(true);
        setPushStatus('subscribed');
      } else {
        setPushStatus('denied');
      }
      return;
    }
    if (pushStatus === 'subscribed') {
      await unsubscribeFromPush();
      setPushStatus('idle');
      return;
    }
    try {
      await subscribeToPush({ streak, hasUpcomingExam, reminders, lang, noPlanToday, tzOffsetMinutes });
      setPushStatus('subscribed');
    } catch (err) {
      setPushStatus(err.message === 'denied' ? 'denied' : 'error');
    }
  }

  return { pushStatus, togglePush, native };
}

// Mounted once for the whole app (the bell/settings callers above only sync
// while those screens are open), so the server learns right away that
// today's streak is secured or which session is next. The server merges
// partial state, so this doesn't clobber reminders/exam synced elsewhere.
// Dates are the device's local YYYY-MM-DD, so a stale snapshot from
// yesterday is ignored instead of being read as "today".
export function useStreakPushSync({ streak, studiedTodayDate, nextSessionTitle, nextSessionDate, unfinishedTitles, unfinishedDate, bedtime }) {
  const unfinishedKey = JSON.stringify(unfinishedTitles || []);
  useEffect(() => {
    if (!isPushSupported()) return;
    syncPushState({
      streak, studiedTodayDate, nextSessionTitle, nextSessionDate,
      unfinishedTitles: JSON.parse(unfinishedKey), unfinishedDate, bedtime,
      tzOffsetMinutes: -new Date().getTimezoneOffset(),
    });
  }, [streak, studiedTodayDate, nextSessionTitle, nextSessionDate, unfinishedKey, unfinishedDate, bedtime]);
}
