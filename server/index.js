import './loadEnv.js';
import express from 'express';
import { handleChat } from '../api/_lib/chat.js';
import { handlePlanGenerate } from '../api/_lib/plan.js';
import { handlePlanRescue } from '../api/_lib/rescue.js';
import { pushEnabled, handleVapidPublicKey, handleSubscribe, handlePushState, handleUnsubscribe, sendScheduledPushes } from '../api/_lib/push.js';

const PORT = process.env.PORT || 8787;
const PUSH_INTERVAL_MINUTES = Number(process.env.PUSH_INTERVAL_MINUTES) || 60;

const app = express();
app.use(express.json({ limit: '1mb' }));

// Every route below just adapts Express's (req, res) to the framework-agnostic
// handle*() functions in api/_lib/ — the same functions the Vercel
// serverless functions under api/ call in production, so local dev and
// production never drift apart.
async function respond(res, handler, body) {
  const { status, body: json } = await handler(body);
  res.status(status).json(json);
}

app.post('/api/chat', (req, res) => respond(res, handleChat, req.body || {}));
app.post('/api/plan/generate', (req, res) => respond(res, handlePlanGenerate, req.body || {}));
app.post('/api/plan/rescue', (req, res) => respond(res, handlePlanRescue, req.body || {}));

app.get('/api/push/vapid-public-key', (req, res) => respond(res, handleVapidPublicKey, undefined));
app.post('/api/push/subscribe', (req, res) => respond(res, handleSubscribe, req.body || {}));
app.post('/api/push/state', (req, res) => respond(res, handlePushState, req.body || {}));
app.post('/api/push/unsubscribe', (req, res) => respond(res, handleUnsubscribe, req.body || {}));

// Production has no long-running process to run a timer in, so Vercel Cron
// hits api/push/cron.js on a schedule instead (see vercel.json) — this
// setInterval is local-dev-only, and can be set much shorter (down to 1
// minute) via PUSH_INTERVAL_MINUTES for testing.
if (pushEnabled) {
  setInterval(sendScheduledPushes, PUSH_INTERVAL_MINUTES * 60 * 1000);
}

app.listen(PORT, () => {
  console.log(`Chat AI server listening on http://localhost:${PORT}`);
  console.log(pushEnabled
    ? `Push notifications enabled, checking every ${PUSH_INTERVAL_MINUTES} min.`
    : 'Push notifications disabled (set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY in server/.env to enable).');
});
