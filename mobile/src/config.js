import Constants from 'expo-constants';

// The Pulgo website this app shows. Change it in app.json → expo.extra.appUrl.
export const APP_URL = (Constants.expoConfig?.extra?.appUrl || '').replace(/\/+$/, '');
export const APP_ORIGIN = APP_URL.match(/^https?:\/\/[^/]+/)?.[0] || APP_URL;
export const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export const COLORS = {
  bg: '#08080c',
  purple: '#7c5cff',
  purpleLight: '#c9baff',
  text: '#f4f4f8',
  muted: '#8a8a99',
};
