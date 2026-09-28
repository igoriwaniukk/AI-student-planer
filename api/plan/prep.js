import { handlePlanPrep } from '../_lib/prep.js';
import { guardAiRequest } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!(await guardAiRequest(req, res))) return;
  const { status, body } = await handlePlanPrep(req.body || {});
  res.status(status).json(body);
}
