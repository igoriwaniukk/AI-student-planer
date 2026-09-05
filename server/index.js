import { config } from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { GOALS, IMPORTANCE_OPTIONS, ENERGY_OPTIONS, RECUR_DAYS } from '../src/lib/plannerData.js';

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
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const PORT = process.env.PORT || 8787;

const app = express();
app.use(express.json({ limit: '1mb' }));

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'add_exam',
        description:
          'Dodaje nowy sprawdzian/egzamin do planu ucznia razem z celem nauki. Użyj, gdy uczeń prosi o dodanie sprawdzianu, kartkówki lub egzaminu, który nie jest jeszcze na liście najbliższych sprawdzianów.',
        parameters: {
          type: 'OBJECT',
          properties: {
            subject: { type: 'STRING', description: 'Przedmiot, np. "Chemia".' },
            title: { type: 'STRING', description: 'Krótki opis, np. "Sprawdzian z kwasów". Jeśli nieznany, użyj "Sprawdzian".' },
            daysUntil: { type: 'INTEGER', description: 'Za ile dni jest sprawdzian, liczba całkowita (dziś = 0).' },
            grade: { type: 'STRING', enum: GOALS, description: 'Docelowa ocena/cel ucznia.' },
            importance: { type: 'STRING', enum: IMPORTANCE_OPTIONS, description: 'Jak ważny jest ten sprawdzian dla ucznia.' },
            studyMinutes: { type: 'INTEGER', description: 'Łączna liczba minut nauki, jaką zaplanować na ten sprawdzian.' },
          },
          required: ['subject', 'daysUntil', 'grade', 'importance', 'studyMinutes'],
        },
      },
      {
        name: 'update_exam_goal',
        description:
          'Zmienia cel (ocenę, ważność lub łączną liczbę minut nauki) dla sprawdzianu, który już istnieje na liście "Najbliższe sprawdziany" w danych ucznia. Podaj tylko pola, które mają się zmienić.',
        parameters: {
          type: 'OBJECT',
          properties: {
            examId: { type: 'STRING', description: 'Identyfikator sprawdzianu (id) z listy najbliższych sprawdzianów w danych ucznia.' },
            grade: { type: 'STRING', enum: GOALS },
            importance: { type: 'STRING', enum: IMPORTANCE_OPTIONS },
            studyMinutes: { type: 'INTEGER', description: 'Nowa łączna liczba minut nauki (wartość docelowa, nie różnica).' },
          },
          required: ['examId'],
        },
      },
      {
        name: 'complete_session',
        description:
          'Oznacza dzisiejszą sesję nauki jako wykonaną. Użyj, gdy uczeń mówi, że skończył albo zrobił daną sesję z listy "Dzisiejsze sesje nauki".',
        parameters: {
          type: 'OBJECT',
          properties: {
            sessionId: { type: 'STRING', description: 'Identyfikator sesji (id) z listy dzisiejszych sesji w danych ucznia.' },
            actualMinutes: { type: 'INTEGER', description: 'Ile minut faktycznie trwała sesja. Jeśli uczeń nie poda, pomiń to pole.' },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'reschedule_session',
        description:
          'Przekłada dzisiejszą sesję nauki na inną godzinę tego samego dnia. Użyj, gdy uczeń prosi o zmianę godziny konkretnej sesji z listy "Dzisiejsze sesje nauki".',
        parameters: {
          type: 'OBJECT',
          properties: {
            sessionId: { type: 'STRING', description: 'Identyfikator sesji (id) z listy dzisiejszych sesji w danych ucznia.' },
            newStart: { type: 'STRING', description: 'Nowa godzina rozpoczęcia w formacie GG:MM, np. "18:30".' },
          },
          required: ['sessionId', 'newStart'],
        },
      },
      {
        name: 'log_energy',
        description: 'Zapisuje aktualny poziom energii ucznia. Użyj, gdy uczeń mówi, jak się czuje/ile ma energii.',
        parameters: {
          type: 'OBJECT',
          properties: {
            level: { type: 'STRING', enum: ENERGY_OPTIONS, description: 'Poziom energii ucznia.' },
          },
          required: ['level'],
        },
      },
      {
        name: 'add_recurring_activity',
        description:
          'Dodaje cotygodniowe stałe zajęcie (np. basen, korepetycje) do planu ucznia, powtarzające się co tydzień w ten sam dzień i o tę samą godzinę.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'Nazwa zajęcia, np. "Basen".' },
            day: { type: 'STRING', enum: RECUR_DAYS, description: 'Dzień tygodnia, w który zajęcie się odbywa.' },
            start: { type: 'STRING', description: 'Godzina rozpoczęcia w formacie GG:MM, np. "18:00".' },
            durationMinutes: { type: 'INTEGER', description: 'Czas trwania zajęcia w minutach.' },
          },
          required: ['name', 'day', 'start', 'durationMinutes'],
        },
      },
    ],
  },
];

function buildSystemPrompt(context) {
  const lines = [
    'Jesteś asystentem AI w polskiej aplikacji Student Planner. Pomagasz uczniowi planować naukę, ' +
      'przygotowywać się do sprawdzianów i radzić sobie z napiętymi dniami.',
    'Odpowiadaj zawsze po polsku, konkretnie i zwięźle. Gdy to pomocne, odnoś się do danych ucznia podanych niżej.',
    'Gdy uczeń prosi o dodanie/zmianę sprawdzianu, oznaczenie sesji jako wykonanej, przełożenie sesji na inną ' +
      'godzinę, zapisanie poziomu energii albo dodanie cotygodniowego zajęcia — użyj odpowiedniej funkcji zamiast ' +
      'tylko opisywać to słowami. Aplikacja zawsze poprosi ucznia o potwierdzenie przed zapisaniem zmiany, więc ' +
      'możesz swobodnie proponować konkretne wartości, a nie tylko pytać co zrobić.',
  ];
  if (context) {
    lines.push('--- Dane ucznia ---');
    if (context.exams?.length) {
      lines.push(
        'Najbliższe sprawdziany: ' +
          context.exams
            .map((e) => `[id: ${e.id}] ${e.subject}${e.title ? ' (' + e.title + ')' : ''} za ${e.daysUntil} dni${e.goal ? ', cel: ' + e.goal : ''}`)
            .join('; ') +
          '.'
      );
    }
    if (context.todaySessions?.length) {
      lines.push(
        'Dzisiejsze sesje nauki: ' +
          context.todaySessions.map((s) => `[id: ${s.id}] ${s.label}, ${s.start}, ${s.durationMinutes} min, status: ${s.status}`).join('; ') +
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
        tools: TOOLS,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: data?.error?.message || 'Błąd po stronie Gemini.' });
      return;
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const reply = parts.map((p) => p.text).filter(Boolean).join('');
    const functionCall = parts.find((p) => p.functionCall)?.functionCall;
    const action = functionCall ? { name: functionCall.name, args: functionCall.args } : null;
    res.json({ reply, action });
  } catch (err) {
    res.status(502).json({ error: 'Nie udało się połączyć z Gemini: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Chat AI server listening on http://localhost:${PORT}`);
});
