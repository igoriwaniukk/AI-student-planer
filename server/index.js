// Minimal local backend used only for the optional Vulcan (UONET+) integration.
// Everything here is in-memory and dev-only — see server/vulcanSessions.js.
import express from 'express';
import * as vulcan from './vulcanSessions.js';

const app = express();
app.use(express.json());

app.post('/api/vulcan/pair', async (req, res) => {
  const { token, symbol, pin } = req.body || {};
  if (!token || !symbol || !pin) {
    return res.status(400).json({ error: 'Podaj token, symbol i PIN z panelu "Zarejestruj urządzenie mobilne".' });
  }
  try {
    const result = await vulcan.pair({ token, symbol, pin });
    res.json(result);
  } catch (err) {
    console.error('vulcan pair failed:', err.message);
    res.status(400).json({ error: 'Nie udało się połączyć. Token, symbol i PIN są ważne tylko kilka minut — wygeneruj nowe w panelu UONET+ i spróbuj ponownie.' });
  }
});

app.get('/api/vulcan/exams', async (req, res) => {
  try {
    const exams = await vulcan.getExams(req.query.sessionId);
    res.json({ exams });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/api/vulcan/lessons', async (req, res) => {
  try {
    const lessons = await vulcan.getLessons(req.query.sessionId);
    res.json({ lessons });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.post('/api/vulcan/disconnect', (req, res) => {
  vulcan.disconnect((req.body || {}).sessionId);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => {
  console.log(`Vulcan integration server listening on http://localhost:${PORT}`);
});
