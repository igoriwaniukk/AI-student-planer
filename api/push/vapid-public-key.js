import { handleVapidPublicKey } from '../_lib/push.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { status, body } = await handleVapidPublicKey();
  res.status(status).json(body);
}
