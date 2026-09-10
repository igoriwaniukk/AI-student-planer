import { createClient } from '@supabase/supabase-js';

// Validates the caller's Supabase session before an AI endpoint (chat,
// plan/generate, plan/rescue) is allowed to spend Anthropic API budget on
// their request — without this, anyone who finds the deployed URL could
// hit these endpoints anonymously and run up the bill. Uses the anon key
// (same one the browser already has) since verifying a bearer token this
// way doesn't need the service-role key at all.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// When Supabase isn't configured at all (local demo mode, no accounts —
// same isSupabaseConfigured feature flag the rest of the app uses), there's
// no session concept to check, so every AI endpoint stays open.
export const authGateEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

const authClient = authGateEnabled ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// Verifies the Authorization header's Supabase access token and returns the
// user it belongs to (or null if the gate is off, the header is missing, or
// the token doesn't check out) — the one place account-deletion and the AI
// guard below both derive "who is this request actually for" from, instead
// of trusting anything the client body claims.
export async function getVerifiedUser(authorizationHeader) {
  if (!authGateEnabled) return null;
  const token = authorizationHeader && authorizationHeader.startsWith('Bearer ') ? authorizationHeader.slice(7) : null;
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  return !error && data?.user ? data.user : null;
}

// Returns true if the request is allowed to proceed: either the auth gate
// is off, or the Authorization header carries a valid Supabase access
// token. Framework-agnostic (takes the header value, not a req/res object)
// so both server/index.js and the Vercel functions under api/ can share it.
export async function isAuthorized(authorizationHeader) {
  if (!authGateEnabled) return true;
  return !!(await getVerifiedUser(authorizationHeader));
}

// Express's and Vercel's (req, res) shapes are compatible enough (headers,
// status().json()) that one guard works for both runtimes — writes the 401
// itself and returns false so the caller can just `if (!(await guard)) return;`.
export async function guardAiRequest(req, res) {
  if (await isAuthorized(req.headers.authorization)) return true;
  res.status(401).json({ error: 'Musisz być zalogowany, aby korzystać z tej funkcji.' });
  return false;
}
