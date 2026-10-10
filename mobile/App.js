import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Linking, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OfflineScreen from './src/OfflineScreen';
import { APP_URL, APP_ORIGIN, APP_VERSION, COLORS } from './src/config';
import { STRINGS, deviceLang } from './src/strings';
import { scheduleReminders, cancelReminders, notificationStatus, requestNotifications, setupReminderChannel } from './src/reminders';
import { openSignInSheet, signInWithApple } from './src/auth';

// Pulgo on the iPhone: the real Pulgo website in a full-screen web view,
// plus what a website can't do by itself — the system sign-in sheet,
// reminders scheduled on the phone, haptics and an offline screen. The
// website finds out it's in here through window.PulgoNative and talks to
// us with postMessage (see src/lib/nativeBridge.js in the web app).

SplashScreen.preventAutoHideAsync().catch(() => {});

const LANG_KEY = 'pulgo.lang';

// safeArea: the status bar / home bar heights, so the page doesn't depend
// on iOS reporting them through CSS (see index.html in the web app).
const INSETS = initialWindowMetrics?.insets || {};
const BEFORE_LOAD = `
  window.PulgoNative = {
    platform: ${JSON.stringify(Platform.OS)},
    version: ${JSON.stringify(APP_VERSION)},
    safeArea: ${JSON.stringify({ top: Math.round(INSETS.top || 0), bottom: Math.round(INSETS.bottom || 0) })},
  };
  true;
`;
// No pinch zoom or zoom-on-focus, no long-press link previews/callouts.
// viewport-fit=cover keeps the page's safe-area insets (status bar, home bar).
const AFTER_LOAD = `
  (function () {
    var meta = document.querySelector('meta[name=viewport]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    var style = document.createElement('style');
    style.textContent = '*{-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}';
    document.head.appendChild(style);
  })();
  true;
`;

// iOS (NSURLError…) and Android (WebViewClient.ERROR_…) codes that mean
// "no internet / can't reach the server" rather than a broken page.
const OFFLINE_CODES = [-1001, -1003, -1004, -1005, -1009, -1018, -1020, -2, -6, -8];

function isAppUrl(url) {
  return url === APP_ORIGIN || url.startsWith(APP_ORIGIN + '/') || url.startsWith(APP_ORIGIN + '?') || url.startsWith(APP_ORIGIN + '#');
}

function openOutside(url) {
  if (/^https?:\/\//.test(url)) {
    WebBrowser.openBrowserAsync(url, { controlsColor: COLORS.purple, toolbarColor: COLORS.bg }).catch(() => Linking.openURL(url));
  } else {
    Linking.openURL(url).catch(() => {});
  }
}

function Shell() {
  const webRef = useRef(null);
  const canGoBack = useRef(false);
  const splashHidden = useRef(false);
  const [lang, setLang] = useState(deviceLang());
  // null | 'offline' | 'server'
  const [failure, setFailure] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [webKey, setWebKey] = useState(0);
  // A tapped reminder can ask for a screen (Restart your day). It's handed to
  // the website once the page says it's ready (its 'pending-open' request),
  // or straight away if it already is.
  const pendingOpen = useRef(null);
  const webReady = useRef(false);
  const handledResponse = useRef(null);

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((saved) => { if (STRINGS[saved]) setLang(saved); }).catch(() => {});
    // Never leave the splash up if the page hangs.
    const t = setTimeout(hideSplash, 10000);
    return () => clearTimeout(t);
  }, [hideSplash]);

  useEffect(() => { setupReminderChannel((STRINGS[lang] || STRINGS.en).remindersChannel).catch(() => {}); }, [lang]);

  const send = useCallback((msg) => {
    const js = `window.dispatchEvent(new CustomEvent('pulgo-native', { detail: ${JSON.stringify(msg)} })); true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  const handleResponse = useCallback((response) => {
    if (!response) return;
    const id = response.notification.request.identifier + ':' + response.notification.date;
    const screen = response.notification.request.content.data?.open;
    if (!screen || handledResponse.current === id) return;
    handledResponse.current = id;
    if (webReady.current) send({ type: 'open', screen });
    else pendingOpen.current = screen;
  }, [send]);

  useEffect(() => {
    // Opened by tapping a reminder while the app was closed…
    Notifications.getLastNotificationResponseAsync().then(handleResponse).catch(() => {});
    // …or while it was running in the background.
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [handleResponse]);

  const retry = useCallback(() => {
    setRetrying(true);
    setFailure(null);
    setWebKey((k) => k + 1);
  }, []);

  // Back from the background with the error screen up: try again by itself.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active' && failure) retry(); });
    return () => sub.remove();
  }, [failure, retry]);

  // Android's back button walks back through the site before leaving.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current && webRef.current) { webRef.current.goBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, []);

  const onMessage = useCallback(async (event) => {
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }
    if (!msg || typeof msg.type !== 'string') return;
    const reply = (data) => { if (msg.requestId) send({ ...data, replyTo: msg.requestId }); };
    switch (msg.type) {
      case 'web-state':
        if (STRINGS[msg.lang]) {
          setLang(msg.lang);
          AsyncStorage.setItem(LANG_KEY, msg.lang).catch(() => {});
        }
        if (msg.signedIn === false) cancelReminders();
        break;
      case 'signed-out':
        cancelReminders();
        break;
      case 'reminders':
        scheduleReminders(msg.reminders, (status) => send({ type: 'notif-status', status }));
        break;
      case 'notif-status':
        reply({ status: await notificationStatus() });
        break;
      case 'notif-request':
        reply({ status: await requestNotifications() });
        break;
      case 'open-settings':
        Linking.openSettings().catch(() => {});
        break;
      case 'oauth':
        reply(await openSignInSheet(msg.url, msg.redirect));
        break;
      case 'apple-signin':
        reply(await signInWithApple());
        break;
      case 'pending-open':
        webReady.current = true;
        reply({ screen: pendingOpen.current });
        pendingOpen.current = null;
        break;
      case 'haptic':
        Haptics.notificationAsync(msg.kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
        break;
      default:
        reply({ error: 'unknown' });
    }
  }, [send]);

  // Pulgo's own pages load here; anything else (a link to another site,
  // mailto:) opens outside the app.
  const onShouldStart = useCallback((req) => {
    const url = req.url || '';
    if (isAppUrl(url) || /^(about|blob|data):/.test(url)) return true;
    if (Platform.OS === 'ios' && req.isTopFrame === false) return true;
    openOutside(url);
    return false;
  }, []);

  return (
    // On iPhone the site is drawn edge to edge (under the status bar and the
    // home bar) and keeps clear of them itself with CSS safe-area insets;
    // Android and the offline screen keep the system margins.
    <SafeAreaView style={styles.shell} edges={failure || Platform.OS !== 'ios' ? ['top', 'bottom'] : []}>
      <StatusBar style="light" />
      {failure ? (
        <OfflineScreen lang={lang} kind={failure} retrying={retrying} onRetry={retry} />
      ) : (
        <WebView
          key={webKey}
          ref={webRef}
          source={{ uri: APP_URL }}
          style={styles.web}
          containerStyle={styles.web}
          originWhitelist={['*']}
          injectedJavaScriptBeforeContentLoaded={BEFORE_LOAD}
          injectedJavaScript={AFTER_LOAD}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={onShouldStart}
          onOpenWindow={(e) => openOutside(e.nativeEvent.targetUrl)}
          setSupportMultipleWindows={false}
          onNavigationStateChange={(nav) => { canGoBack.current = nav.canGoBack; }}
          onLoadStart={() => { webReady.current = false; }}
          onLoadEnd={() => { setRetrying(false); hideSplash(); }}
          onError={(e) => {
            const code = e.nativeEvent.code;
            // A navigation we cancelled ourselves (a link opened outside).
            if (code === -999 || code === 102) return;
            setFailure(OFFLINE_CODES.includes(code) ? 'offline' : 'server');
            setRetrying(false);
            hideSplash();
          }}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500 && isAppUrl(e.nativeEvent.url || APP_URL)) {
              setFailure('server');
              setRetrying(false);
              hideSplash();
            }
          }}
          onContentProcessDidTerminate={() => webRef.current?.reload()}
          onRenderProcessGone={() => setWebKey((k) => k + 1)}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          bounces={false}
          overScrollMode="never"
          allowsBackForwardNavigationGestures={false}
          allowsLinkPreview={false}
          dataDetectorTypes="none"
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          keyboardDisplayRequiresUserAction={false}
          textZoom={100}
          applicationNameForUserAgent={'PulgoApp/' + APP_VERSION}
          webviewDebuggingEnabled={__DEV__}
          startInLoadingState={false}
          decelerationRate="normal"
        />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={{ backgroundColor: COLORS.bg }}>
      <View style={styles.shell}>
        <Shell />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.bg },
  web: { flex: 1, backgroundColor: COLORS.bg },
});
