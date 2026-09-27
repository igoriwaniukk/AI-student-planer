// The link between this website and the Pulgo iPhone app (mobile/), which
// shows this same site in a web view. The app announces itself by setting
// window.PulgoNative before the page loads; messages go to the app through
// window.ReactNativeWebView.postMessage and come back as a 'pulgo-native'
// window event. Everywhere outside the app all of this is a no-op.

export const APP_MESSAGE_EVENT = 'pulgo-native';
// Where Google/Apple send the student back after the system sign-in sheet.
// Must be listed under Supabase → Authentication → URL Configuration →
// Redirect URLs (see APP_STORE_READINESS.md).
export const APP_AUTH_REDIRECT = 'pulgo://auth-callback';

export function isNativeApp() {
  return typeof window !== 'undefined' && !!window.ReactNativeWebView && !!window.PulgoNative;
}

export function postToApp(type, payload = {}) {
  if (!isNativeApp()) return;
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify({ ...payload, type }));
  } catch { /* the app went away mid-send */ }
}

const listeners = new Set();
const pending = new Map();
let seq = 0;

if (typeof window !== 'undefined') {
  window.addEventListener(APP_MESSAGE_EVENT, (e) => {
    const msg = e.detail || {};
    if (msg.replyTo && pending.has(msg.replyTo)) {
      pending.get(msg.replyTo)(msg);
      pending.delete(msg.replyTo);
      return;
    }
    listeners.forEach((fn) => fn(msg));
  });
}

// Sends a request and waits for the app's reply (e.g. the result of the
// sign-in sheet). Resolves with { timeout: true } if the app never answers.
export function askApp(type, payload = {}, timeoutMs = 10 * 60 * 1000) {
  if (!isNativeApp()) return Promise.resolve({ unavailable: true });
  const id = 'r' + (++seq) + '-' + Date.now();
  return new Promise((resolve) => {
    const timer = setTimeout(() => { pending.delete(id); resolve({ timeout: true }); }, timeoutMs);
    pending.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
    postToApp(type, { ...payload, requestId: id });
  });
}

export function onAppMessage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// The student's own on/off switch for the app's reminders (Settings and the
// bell). On by default; the phone's permission is asked for separately.
const REMINDERS_PREF_KEY = 'sp_appReminders';
export const REMINDERS_PREF_EVENT = 'pulgo-reminders-pref';

export function appRemindersEnabled() {
  try { return localStorage.getItem(REMINDERS_PREF_KEY) !== 'off'; } catch { return true; }
}

export function setAppRemindersEnabled(on) {
  try { localStorage.setItem(REMINDERS_PREF_KEY, on ? 'on' : 'off'); } catch { /* storage blocked */ }
  window.dispatchEvent(new Event(REMINDERS_PREF_EVENT));
}

// Everything Supabase can put in the return address after the sign-in
// sheet: ?code= (PKCE), #access_token=… (implicit) or an error.
export function parseAuthCallback(url) {
  let u;
  try { u = new URL(url); } catch { return {}; }
  const params = new URLSearchParams(u.search);
  new URLSearchParams(u.hash.replace(/^#/, '')).forEach((v, k) => params.set(k, v));
  return {
    code: params.get('code'),
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    error: params.get('error_description') || params.get('error'),
  };
}
