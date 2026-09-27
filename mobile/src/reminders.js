import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Local notifications scheduled on the phone. The website works out the
// full list (see src/lib/appReminders.js in the web app) and sends it
// whenever it changes; this replaces whatever was scheduled before.
const CHANNEL_ID = 'reminders';
let lastKey = null;
let queue = Promise.resolve();

// Shown as a banner even while the app is open, except "time's up" for a
// focus session: the focus screen already shows and buzzes that.
Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    const show = n.request.identifier !== 'focus-end';
    return { shouldShowBanner: show, shouldShowList: true, shouldPlaySound: show, shouldSetBadge: false };
  },
});

export async function setupReminderChannel(name) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name,
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function statusOf(perm) {
  if (perm.granted) return 'granted';
  return perm.status === 'denied' ? 'denied' : 'undetermined';
}

export async function notificationStatus() {
  return statusOf(await Notifications.getPermissionsAsync());
}

export async function requestNotifications() {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.granted || !perm.canAskAgain) return statusOf(perm);
  return statusOf(await Notifications.requestPermissionsAsync());
}

// `onAsked` gets the answer when this had to ask for permission first (the
// first time there's something to remind about).
export function scheduleReminders(list, onAsked) {
  queue = queue.then(() => replaceAll(list, onAsked)).catch(() => {});
  return queue;
}

export function cancelReminders() {
  return scheduleReminders([]);
}

async function replaceAll(list, onAsked) {
  const now = Date.now();
  const items = (Array.isArray(list) ? list : []).filter((r) => r && r.id && r.at > now && r.title);
  const key = JSON.stringify(items);
  if (key === lastKey) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  lastKey = key;
  if (!items.length) return;

  let perm = await Notifications.getPermissionsAsync();
  if (!perm.granted && perm.canAskAgain && statusOf(perm) === 'undetermined') {
    perm = await Notifications.requestPermissionsAsync();
    onAsked?.(statusOf(perm));
  }
  if (!perm.granted) {
    lastKey = null; // try again once permission is given
    return;
  }
  for (const r of items) {
    await Notifications.scheduleNotificationAsync({
      identifier: String(r.id),
      content: { title: String(r.title), body: r.body ? String(r.body) : undefined, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL_ID },
    });
  }
}
