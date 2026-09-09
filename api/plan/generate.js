import { handlePlanGenerate } from '../_lib/plan.js';
import { guardAiRequest } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!(await guardAiRequest(req, res))) return;
  const { status, body } = await handlePlanGenerate(req.body || {});
  res.status(status).json(body);
}
