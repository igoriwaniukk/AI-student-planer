import { handlePlanPrep } from '../_lib/prep.js';
import { guardAiRequest } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const gate = await guardAiRequest(req, res, 'prep');
  if (!gate) return;
  const { status, body } = await handlePlanPrep(req.body || {});
  if (status >= 400) await gate.release();
  res.status(status).json(body);
}
