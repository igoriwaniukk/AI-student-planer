import { handleSubscribe } from '../_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { status, body } = await handleSubscribe(req.body || {});
  res.status(status).json(body);
}
