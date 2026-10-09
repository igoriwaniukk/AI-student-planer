import { handlePlanGenerate } from '../_lib/plan.js';
import { guardAiRequest } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const gate = await guardAiRequest(req, res, 'plan');
  if (!gate) return;
  const { status, body } = await handlePlanGenerate(req.body || {});
  if (status >= 400) await gate.release();
  res.status(status).json(body);
}
