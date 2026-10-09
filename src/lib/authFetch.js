import { supabase, isSupabaseConfigured } from './supabaseClient';

// Attaches the current Supabase session's access token so the server's AI
// endpoints (see api/_lib/auth.js) can verify the caller is a signed-in
// user before spending any Anthropic API budget on their request. A no-op
// wrapper around fetch when Supabase isn't configured (local demo mode has
// no session to attach), matching the server's matching no-op gate.
// Also sends the device's time zone, so the free AI allowance resets at the
// student's own midnight, and announces a used-up allowance (429
// limit_reached, see api/_lib/premium.js) so the app can offer Premium.
export const AI_LIMIT_EVENT = 'pulgo-ai-limit';

function timeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }
}

export async function authedFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const tz = timeZone();
  if (tz) headers['X-Timezone'] = tz;
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 429) {
    res.clone().json().then((body) => {
      if (body?.code === 'limit_reached') window.dispatchEvent(new CustomEvent(AI_LIMIT_EVENT, { detail: { feature: body.feature } }));
    }, () => {});
  }
  return res;
}
