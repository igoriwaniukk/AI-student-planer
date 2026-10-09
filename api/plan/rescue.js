import { handlePlanRescue } from '../_lib/rescue.js';
import { guardAiRequest } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const gate = await guardAiRequest(req, res, 'rescue');
  if (!gate) return;
  const { status, body } = await handlePlanRescue(req.body || {});
  if (status >= 400) await gate.release();
  res.status(status).json(body);
}
