import { useEffect, useState } from 'react';
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush, syncPushState } from '../lib/pushNotifications';

// Shared by the notification bell and the profile settings toggle, so both
// entry points reflect (and drive) the same underlying browser push
// subscription instead of tracking their own, possibly-drifting state.
export function usePushNotifications({ streak, hasUpcomingExam, reminders, lang }) {
  // idle | subscribed | denied | error | unsupported
  const [pushStatus, setPushStatus] = useState(() => (isPushSupported() ? 'idle' : 'unsupported'));

  useEffect(() => {
    if (!isPushSupported()) return;
    getExistingSubscription().then((sub) => setPushStatus(sub ? 'subscribed' : 'idle'));
  }, []);

  // Keeps the server's last-known snapshot fresh so its scheduled push text
  // (streak / exam / reminder) stays accurate — a no-op until subscribed.
  useEffect(() => {
    if (pushStatus !== 'subscribed') return;
    syncPushState({ streak, hasUpcomingExam, reminders, lang });
  }, [pushStatus, streak, hasUpcomingExam, reminders, lang]);

  async function togglePush() {
    if (pushStatus === 'subscribed') {
      await unsubscribeFromPush();
      setPushStatus('idle');
      return;
    }
    try {
      await subscribeToPush({ streak, hasUpcomingExam, reminders, lang });
      setPushStatus('subscribed');
    } catch (err) {
      setPushStatus(err.message === 'denied' ? 'denied' : 'error');
    }
  }

  return { pushStatus, togglePush };
}
