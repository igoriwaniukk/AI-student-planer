import { supabase, isSupabaseConfigured } from './supabaseClient';

// Attaches the current Supabase session's access token so the server's AI
// endpoints (see api/_lib/auth.js) can verify the caller is a signed-in
// user before spending any Anthropic API budget on their request. A no-op
// wrapper around fetch when Supabase isn't configured (local demo mode has
// no session to attach), matching the server's matching no-op gate.
export async function authedFetch(url, options = {}) {
  if (!isSupabaseConfigured) return fetch(url, options);
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
