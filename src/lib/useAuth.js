import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// No-op everywhere until real Supabase credentials are configured, so the
// app's existing localStorage-only behavior is unaffected until then.
export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  return {
    session,
    loading,
    signUp: (email, password) => supabase.auth.signUp({ email, password }),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google' }),
    signInWithApple: () => supabase.auth.signInWithOAuth({ provider: 'apple' }),
    signOut: () => supabase.auth.signOut(),
  };
}
