import 'dotenv/config';
import express from 'express';

// Uses raw HTTPS calls to OpenAI's Chat Completions endpoint instead of the
// official `openai` npm package: that SDK's exact method signatures could
// not be verified from this environment (network access to openai.com is
// blocked here), while the Chat Completions wire format itself has been
// stable and documented for years.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const PORT = process.env.PORT || 8787;

const app = express();
app.use(express.json({ limit: '1mb' }));

function buildSystemPrompt(context) {
  const lines = [
    'Jesteś asystentem AI w polskiej aplikacji Student Planner. Pomagasz uczniowi planować naukę, ' +
      'przygotowywać się do sprawdzianów i radzić sobie z napiętymi dniami.',
    'Odpowiadaj zawsze po polsku, konkretnie i zwięźle. Gdy to pomocne, odnoś się do danych ucznia podanych niżej.',
  ];
  if (context) {
    lines.push('--- Dane ucznia ---');
    if (context.exams?.length) {
      lines.push(
        'Najbliższe sprawdziany: ' +
          context.exams
            .map((e) => `${e.subject}${e.title ? ' (' + e.title + ')' : ''} za ${e.daysUntil} dni${e.goal ? ', cel: ' + e.goal : ''}`)
            .join('; ') +
          '.'
      );
    }
    if (context.weeklyCapacityMinutes != null) {
      lines.push(`Tygodniowy limit nauki: ${context.weeklyCapacityMinutes} min, obecnie zaplanowane cele na ten tydzień: ${context.weekGoalMinutes || 0} min.`);
    }
    if (context.streak != null) lines.push(`Seria dni z rzędu z w pełni ukończonym planem: ${context.streak}.`);
    if (context.energy) lines.push(`Aktualny poziom energii: ${context.energy}.`);
    if (context.studyTime) lines.push(`Uczeń najlepiej uczy się: ${context.studyTime}.`);
    if (context.prioritySubjects?.length) lines.push('Priorytetowe przedmioty: ' + context.prioritySubjects.join(', ') + '.');
  }
  return lines.join('\n');
}

app.post('/api/chat', async (req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: 'Brak klucza OPENAI_API_KEY na serwerze. Ustaw go w server/.env i uruchom serwer ponownie.' });
    return;
  }

  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Brak wiadomości do wysłania.' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'system', content: buildSystemPrompt(context) }, ...messages],
        temperature: 0.6,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data?.error?.message || 'Błąd po stronie OpenAI.' });
      return;
    }

    const reply = data.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (err) {
    res.status(502).json({ error: 'Nie udało się połączyć z OpenAI: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Chat AI server listening on http://localhost:${PORT}`);
});
