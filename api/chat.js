import { handleChat } from './_lib/chat.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { status, body } = await handleChat(req.body || {});
  res.status(status).json(body);
}
