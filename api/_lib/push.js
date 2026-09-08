import webpush from 'web-push';
import { saveSubscription, updateState, removeSubscription, allSubscriptions, bumpTick } from './pushStore.js';
import { composeMessage } from './pushMessages.js';

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
    const message = composeMessage(state || {}, nextTick);
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
