import { sendScheduledPushes } from '../_lib/push.js';

// Triggered on a schedule by Vercel Cron (see vercel.json) instead of the
// setInterval loop server/index.js uses for local dev — serverless
// functions don't stay alive between requests, so nothing could run a
// timer. Vercel signs cron requests with `Authorization: Bearer
// $CRON_SECRET` when that env var is set; check it so this endpoint can't
// be triggered by anyone who finds the URL.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  await sendScheduledPushes();
  res.status(200).json({ ok: true });
}
