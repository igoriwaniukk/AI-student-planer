import webpush from 'web-push';
import { saveSubscription, updateState, removeSubscription, allSubscriptions, bumpTick, setServerState } from './pushStore.js';
import { composeMessage, composeRestartMessage } from './pushMessages.js';

// `tzOffsetMinutes` (minutes east of UTC, synced from the client — see
// usePushNotifications.js) shifts the server's own clock to the
// subscriber's actual wall-clock time, so "afternoon" means their
// afternoon, not whatever timezone the server process happens to run in
// (Vercel functions run in UTC). Falls back to the server's own clock
// (treated as UTC, offset 0) for a subscription that hasn't synced this
// field yet, rather than crashing or silently never firing.
function localNow(tzOffsetMinutes) {
  const offset = Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0;
  const shifted = new Date(Date.now() + offset * 60000);
  return { hour: shifted.getUTCHours(), dateKey: shifted.toISOString().slice(0, 10) };
}

// True once it's 15:00 or later in the subscriber's own local time, today's
// plan still isn't approved (see noPlanToday, synced from Home/Settings),
// and this exact local day hasn't already gotten its one nudge — the whole
// point is a single afternoon reminder, not an hourly repeat.
function shouldSendRestartNudge(state) {
  if (!state?.noPlanToday) return false;
  const { hour, dateKey } = localNow(state.tzOffsetMinutes);
  return hour >= 15 && state.lastRestartNudgeDate !== dateKey;
}

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_CONTACT = process.env.VAPID_CONTACT || 'mailto:example@example.com';
export const pushEnabled = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushEnabled) {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function handleVapidPublicKey() {
  if (!pushEnabled) {
    return { status: 500, body: { error: 'Brak VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY na serwerze. Wygeneruj je: npx web-push generate-vapid-keys' } };
  }
  return { status: 200, body: { publicKey: VAPID_PUBLIC_KEY } };
}

export async function handleSubscribe({ subscription, state }) {
  if (!subscription?.endpoint) {
    return { status: 400, body: { error: 'Brak subskrypcji push.' } };
  }
  await saveSubscription(subscription, state);
  return { status: 200, body: { ok: true } };
}

export async function handlePushState({ endpoint, state }) {
  if (!endpoint) {
    return { status: 400, body: { error: 'Brak endpoint.' } };
  }
  await updateState(endpoint, state);
  return { status: 200, body: { ok: true } };
}

export async function handleUnsubscribe({ endpoint }) {
  if (endpoint) await removeSubscription(endpoint);
  return { status: 200, body: { ok: true } };
}

// Sends every subscribed device one push built from the state it last
// reported (streak, upcoming-exam flag, custom reminders) — the server
// never sees the app's localStorage directly, only this snapshot. Called on
// a timer locally (server/index.js) and by the Vercel Cron-triggered
// api/push/cron.js in production.
export async function sendScheduledPushes() {
  if (!pushEnabled) return;
  for (const { subscription, state, tick } of await allSubscriptions()) {
    const nextTick = await bumpTick(subscription.endpoint, tick);
    const s = state || {};
    let message;
    if (shouldSendRestartNudge(s)) {
      message = composeRestartMessage(s.lang);
      // Recorded directly (bypassing the client-merge path in updateState)
      // since this write is the server's own bookkeeping, not a client sync
      // — stamps today's local date so the nudge doesn't repeat again until
      // noPlanToday goes true on some later day.
      await setServerState(subscription.endpoint, { ...s, lastRestartNudgeDate: localNow(s.tzOffsetMinutes).dateKey });
    } else {
      message = composeMessage(s, nextTick);
    }
    try {
      await webpush.sendNotification(subscription, JSON.stringify(message));
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await removeSubscription(subscription.endpoint);
      } else {
        console.error('Push send failed:', err.message);
      }
    }
  }
}
