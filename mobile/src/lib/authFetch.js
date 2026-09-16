// The web app's authedFetch attaches a Supabase session token; the mobile
// app doesn't have Supabase wired up yet, so this is a plain fetch — a
// relative '/api/...' URL has no origin in React Native and throws, which
// aiPlan.js/aiRescue.js already catch and treat as "AI unavailable", falling
// back to the deterministic scheduler. Swap this for a real authed fetch
// once the mobile app talks to the backend.
export async function authedFetch(url, options = {}) {
  return fetch(url, options);
}
