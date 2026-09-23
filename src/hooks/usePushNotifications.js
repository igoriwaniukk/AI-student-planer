import { useEffect, useState } from 'react';
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush, syncPushState } from '../lib/pushNotifications';

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
export function usePushNotifications({ streak, hasUpcomingExam, reminders, lang, noPlanToday }) {
  // idle | subscribed | denied | error | unsupported
  const [pushStatus, setPushStatus] = useState(() => (isPushSupported() ? 'idle' : 'unsupported'));
  const tzOffsetMinutes = -new Date().getTimezoneOffset();

  useEffect(() => {
    if (!isPushSupported()) return;
    getExistingSubscription().then((sub) => setPushStatus(sub ? 'subscribed' : 'idle'));
  }, []);

  // Keeps the server's last-known snapshot fresh so its scheduled push text
  // (streak / exam / reminder / restart nudge) stays accurate — a no-op
  // until subscribed.
  useEffect(() => {
    if (pushStatus !== 'subscribed') return;
    syncPushState({ streak, hasUpcomingExam, reminders, lang, noPlanToday, tzOffsetMinutes });
  }, [pushStatus, streak, hasUpcomingExam, reminders, lang, noPlanToday, tzOffsetMinutes]);

  async function togglePush() {
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

  return { pushStatus, togglePush };
}

// Mounted once for the whole app (the bell/settings callers above only sync
// while those screens are open), so the server learns right away that
// today's streak is secured or which session is next. The server merges
// partial state, so this doesn't clobber reminders/exam synced elsewhere.
// Dates are the device's local YYYY-MM-DD, so a stale snapshot from
// yesterday is ignored instead of being read as "today".
export function useStreakPushSync({ streak, studiedTodayDate, nextSessionTitle, nextSessionDate }) {
  useEffect(() => {
    if (!isPushSupported()) return;
    syncPushState({ streak, studiedTodayDate, nextSessionTitle, nextSessionDate, tzOffsetMinutes: -new Date().getTimezoneOffset() });
  }, [streak, studiedTodayDate, nextSessionTitle, nextSessionDate]);
}
