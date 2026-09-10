import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

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
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google' }),
    signInWithApple: () => supabase.auth.signInWithOAuth({ provider: 'apple' }),
    resetPassword: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }),
    updatePassword: (password) => supabase.auth.updateUser({ password }),
    signOut: () => supabase.auth.signOut(),
  };
}
