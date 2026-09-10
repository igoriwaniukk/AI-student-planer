import { handleAccountDelete } from '../_lib/account.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { status, body } = await handleAccountDelete(req.headers.authorization);
  res.status(status).json(body);
}
