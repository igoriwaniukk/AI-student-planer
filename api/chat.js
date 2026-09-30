import { handleChat } from './_lib/chat.js';
import { guardAiRequest, authGateEnabled } from './_lib/auth.js';
import { aiStatus } from './_lib/anthropic.js';

export default async function handler(req, res) {
  // Opening /api/chat in a browser shows whether the AI and accounts are set up.
  if (req.method === 'GET') {
    res.status(200).json({ ...aiStatus(), accounts: authGateEnabled });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!(await guardAiRequest(req, res))) return;
  const { status, body } = await handleChat(req.body || {});
  res.status(status).json(body);
}
