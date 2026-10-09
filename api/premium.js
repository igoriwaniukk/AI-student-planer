import { getVerifiedUser } from './_lib/auth.js';
import { premiumEnabled, premiumStatus, syncFromRevenueCat, handleRevenueCatWebhook } from './_lib/premium.js';

// One function for everything Premium (Vercel's plan limits the number of
// functions):
//   GET                      → this user's Premium status and free allowance
//   POST { action: 'sync' }  → re-check with RevenueCat right after a purchase
//   POST { event: {...} }    → RevenueCat's webhook (its own secret header)
export async function handlePremium(req, res) {
  const body = req.body || {};
  if (req.method === 'POST' && body.event) {
    const { status, body: json } = await handleRevenueCatWebhook(req.headers.authorization, body);
    res.status(status).json(json);
    return;
  }
  if (req.method !== 'GET' && !(req.method === 'POST' && body.action === 'sync')) {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const user = await getVerifiedUser(req.headers.authorization);
  if (req.method === 'POST') {
    if (!premiumEnabled()) { res.status(200).json({ enabled: false }); return; }
    if (!user) { res.status(401).json({ error: 'not signed in' }); return; }
    try {
      await syncFromRevenueCat(user.id);
    } catch (e) {
      console.error('[premium] sync failed:', e?.message || e);
    }
  }
  res.status(200).json(await premiumStatus(user, req.headers['x-timezone']));
}

export default handlePremium;
