import { handleChat } from './_lib/chat.js';
import { guardAiRequest, authGateEnabled } from './_lib/auth.js';
import { aiStatus } from './_lib/anthropic.js';
import { handleReport } from './_lib/report.js';

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
  // "Report this answer" — saved for review, no AI call, not counted.
  if (req.body?.report) {
    const { status, body } = await handleReport(req.headers.authorization, req.body.report);
    res.status(status).json(body);
    return;
  }
  const gate = await guardAiRequest(req, res, 'chat');
  if (!gate) return;
  const { status, body } = await handleChat(req.body || {});
  if (status >= 400) await gate.release();
  res.status(status).json(body);
}
