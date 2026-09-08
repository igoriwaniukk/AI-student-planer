import { handlePlanGenerate } from '../_lib/plan.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { status, body } = await handlePlanGenerate(req.body || {});
  res.status(status).json(body);
}
