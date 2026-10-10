import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isNativeApp, askApp, parseAuthCallback, APP_AUTH_REDIRECT } from './nativeBridge';

// Inside the iPhone app Google refuses to sign in within the web view, so
// Google (and Apple, if the native sheet isn't available) open in the
// phone's own sign-in sheet instead, which hands back a return address with
// the session in it. Resolves like signInWithOAuth: { error }, plus
// `cancelled` when the student closed the sheet.
async function signInThroughAppSheet(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: APP_AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error) return { error };
  const reply = await askApp('oauth', { url: data.url, redirect: APP_AUTH_REDIRECT });
  if (reply.cancelled || reply.timeout) return { error: null, cancelled: true };
  if (reply.error) return { error: new Error(reply.error) };
  const { code, accessToken, refreshToken, error: callbackError } = parseAuthCallback(reply.url);
  if (callbackError) return { error: new Error(callbackError) };
  if (code) return supabase.auth.exchangeCodeForSession(code);
  if (accessToken && refreshToken) return supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  return { error: null, cancelled: true };
}

// Apple's native sheet (Face ID) where the app offers it; falls back to the
// sign-in sheet above when it's unavailable or Supabase rejects the token
// (e.g. the app's bundle ID isn't added to the Apple provider yet).
async function signInWithAppleInApp() {
  const reply = await askApp('apple-signin');
  if (reply.cancelled) return { error: null, cancelled: true };
  if (reply.identityToken) {
    const res = await supabase.auth.signInWithIdToken({ provider: 'apple', token: reply.identityToken, nonce: reply.rawNonce });
    if (!res.error) return res;
  }
  return signInThroughAppSheet('apple');
}

// No-op everywhere until real Supabase credentials are configured, so the
// app's existing localStorage-only behavior is unaffected until then.
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  // Set once Supabase reports the PASSWORD_RECOVERY event — fired when the
  // student lands back on the app from the link in a reset-password email.
  // App.jsx uses this to show a "choose a new password" screen instead of
  // the normal signed-in app, even though a session already exists at that
  // point (Supabase signs the recovery link into a real, if temporary,
  // session so updateUser() below has something to act on).
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return {
    session,
    loading,
    passwordRecovery,
    clearPasswordRecovery: () => setPasswordRecovery(false),
    // The confirmation email's link comes back to this site (Pulgo), not to
    // whatever Site URL is set in Supabase. The address must be listed under
    // Supabase → Authentication → URL Configuration → Redirect URLs.
    signUp: (email, password) => supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => (isNativeApp() ? signInThroughAppSheet('google') : supabase.auth.signInWithOAuth({ provider: 'google' })),
    signInWithApple: () => (isNativeApp() ? signInWithAppleInApp() : supabase.auth.signInWithOAuth({ provider: 'apple' })),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
    signOut: () => supabase.auth.signOut(),
    // Deleting an auth.users row needs the service-role key, which never
    // reaches the browser — so this calls the server (api/account/delete.js
    // in production, the matching Express route locally), passing the
    // caller's own access token so the server can verify who's asking
    // instead of trusting a client-supplied id.
    deleteAccount: async () => {
      const token = session?.access_token;
      if (!token) return { error: new Error('Nie jesteś zalogowany.') };
      try {
        const res = await fetch('/api/account/delete', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) return { error: new Error(body.error || 'Nie udało się usunąć konta.') };
        return { error: null };
      } catch (error) {
        return { error };
      }
    },
  };
}
