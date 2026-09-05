import { config } from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load server/.env explicitly by file location, not by resolving against
// process.cwd() (dotenv's default) — `npm run server` runs with cwd set to
// the project root, so the default lookup would miss a .env placed here.
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

// Uses raw HTTPS calls to Google's Gemini REST API instead of an official
// SDK: SDK method signatures could not be verified from this environment
// (network access to Google's own docs is blocked here), while the
// generateContent REST endpoint's wire format has been stable and
// documented for a long time.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
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

// Gemini has no separate "system" message role: it takes systemInstruction
// once, and turn history as {role: 'user'|'model', parts: [{text}]}
// (our frontend uses OpenAI-style 'assistant', which needs mapping to 'model').
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

app.post('/api/chat', async (req, res) => {
  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'Brak klucza GEMINI_API_KEY na serwerze. Ustaw go w server/.env i uruchom serwer ponownie.' });
    return;
  }

  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Brak wiadomości do wysłania.' });
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: toGeminiContents(messages),
        systemInstruction: { parts: [{ text: buildSystemPrompt(context) }] },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data?.error?.message || 'Błąd po stronie Gemini.' });
      return;
    }

    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    res.json({ reply });
  } catch (err) {
    res.status(502).json({ error: 'Nie udało się połączyć z Gemini: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Chat AI server listening on http://localhost:${PORT}`);
});
