import { config } from 'dotenv';
import express from 'express';
import webpush from 'web-push';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { GOALS, IMPORTANCE_OPTIONS, ENERGY_OPTIONS, RECUR_DAYS } from '../src/lib/plannerData.js';
import { saveSubscription, updateState, removeSubscription, allSubscriptions, bumpTick } from './pushStore.js';
import { composeMessage } from './pushMessages.js';

// Load server/.env explicitly by file location, not by resolving against
// process.cwd() (dotenv's default) — `npm run server` runs with cwd set to
// the project root, so the default lookup would miss a .env placed here.
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;
const PORT = process.env.PORT || 8787;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_CONTACT = process.env.VAPID_CONTACT || 'mailto:example@example.com';
const PUSH_INTERVAL_MINUTES = Number(process.env.PUSH_INTERVAL_MINUTES) || 60;
const pushEnabled = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushEnabled) {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const app = express();
app.use(express.json({ limit: '1mb' }));

const TOOLS = [
  {
    name: 'add_exam',
    description:
      'Dodaje nowy sprawdzian/egzamin do planu ucznia razem z celem nauki. Użyj, gdy uczeń prosi o dodanie sprawdzianu, kartkówki lub egzaminu, który nie jest jeszcze na liście najbliższych sprawdzianów.',
    input_schema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Przedmiot, np. "Chemia".' },
        title: { type: 'string', description: 'Krótki opis, np. "Sprawdzian z kwasów". Jeśli nieznany, użyj "Sprawdzian".' },
        daysUntil: { type: 'integer', description: 'Za ile dni jest sprawdzian, liczba całkowita (dziś = 0).' },
        grade: { type: 'string', enum: GOALS, description: 'Docelowa ocena/cel ucznia.' },
        importance: { type: 'string', enum: IMPORTANCE_OPTIONS, description: 'Jak ważny jest ten sprawdzian dla ucznia.' },
        studyMinutes: { type: 'integer', description: 'Łączna liczba minut nauki, jaką zaplanować na ten sprawdzian.' },
      },
      required: ['subject', 'daysUntil', 'grade', 'importance', 'studyMinutes'],
    },
  },
  {
    name: 'update_exam_goal',
    description:
      'Zmienia cel (ocenę, ważność lub łączną liczbę minut nauki) dla sprawdzianu, który już istnieje na liście "Najbliższe sprawdziany" w danych ucznia. Podaj tylko pola, które mają się zmienić.',
    input_schema: {
      type: 'object',
      properties: {
        examId: { type: 'string', description: 'Identyfikator sprawdzianu (id) z listy najbliższych sprawdzianów w danych ucznia.' },
        grade: { type: 'string', enum: GOALS },
        importance: { type: 'string', enum: IMPORTANCE_OPTIONS },
        studyMinutes: { type: 'integer', description: 'Nowa łączna liczba minut nauki (wartość docelowa, nie różnica).' },
      },
      required: ['examId'],
    },
  },
  {
    name: 'complete_session',
    description:
      'Oznacza dzisiejszą sesję nauki jako wykonaną. Użyj, gdy uczeń mówi, że skończył albo zrobił daną sesję z listy "Dzisiejsze sesje nauki".',
    input_schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Identyfikator sesji (id) z listy dzisiejszych sesji w danych ucznia.' },
        actualMinutes: { type: 'integer', description: 'Ile minut faktycznie trwała sesja. Jeśli uczeń nie poda, pomiń to pole.' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'reschedule_session',
    description:
      'Przekłada dzisiejszą sesję nauki na inną godzinę tego samego dnia. Użyj, gdy uczeń prosi o zmianę godziny konkretnej sesji z listy "Dzisiejsze sesje nauki".',
    input_schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Identyfikator sesji (id) z listy dzisiejszych sesji w danych ucznia.' },
        newStart: { type: 'string', description: 'Nowa godzina rozpoczęcia w formacie GG:MM, np. "18:30".' },
      },
      required: ['sessionId', 'newStart'],
    },
  },
  {
    name: 'log_energy',
    description: 'Zapisuje aktualny poziom energii ucznia. Użyj, gdy uczeń mówi, jak się czuje/ile ma energii.',
    input_schema: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ENERGY_OPTIONS, description: 'Poziom energii ucznia.' },
      },
      required: ['level'],
    },
  },
  {
    name: 'add_recurring_activity',
    description:
      'Dodaje cotygodniowe stałe zajęcie (np. basen, korepetycje) do planu ucznia, powtarzające się co tydzień w ten sam dzień i o tę samą godzinę.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nazwa zajęcia, np. "Basen".' },
        day: { type: 'string', enum: RECUR_DAYS, description: 'Dzień tygodnia, w który zajęcie się odbywa.' },
        start: { type: 'string', description: 'Godzina rozpoczęcia w formacie GG:MM, np. "18:00".' },
        durationMinutes: { type: 'integer', description: 'Czas trwania zajęcia w minutach.' },
      },
      required: ['name', 'day', 'start', 'durationMinutes'],
    },
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

app.post('/api/chat', async (req, res) => {
  if (!anthropic) {
    res.status(500).json({ error: 'Brak klucza ANTHROPIC_API_KEY na serwerze. Ustaw go w server/.env i uruchom serwer ponownie.' });
    return;
  }

  const { messages, context } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Brak wiadomości do wysłania.' });
    return;
  }

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt(context),
      tools: TOOLS,
      // Frontend already speaks the same {role: 'user'|'assistant', content: string}
      // shape the API expects, so no mapping is needed here.
      messages,
    });

    const reply = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const toolUse = response.content.find((b) => b.type === 'tool_use');
    const action = toolUse ? { name: toolUse.name, args: toolUse.input } : null;
    res.json({ reply, action });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      res.status(err.status || 502).json({ error: err.message || 'Błąd po stronie Claude.' });
      return;
    }
    res.status(502).json({ error: 'Nie udało się połączyć z Claude: ' + err.message });
  }
});

// Fixed daily constraints the schedule must respect — kept in sync with the
// pairwise conflict windows in src/lib/plannerLogic.js's checkBlockConflict,
// which re-validates whatever Claude proposes before the app trusts it.
const PLAN_TOOL = {
  name: 'propose_schedule',
  description:
    'Proponuje kolejność i godziny rozpoczęcia dzisiejszych sesji nauki. Każde zadanie z listy musi pojawić się dokładnie raz, z zachowaniem podanego dla niego czasu trwania (nie zmieniaj długości sesji).',
  input_schema: {
    type: 'object',
    properties: {
      blocks: {
        type: 'array',
        description: 'Jeden wpis na każde zadanie z listy, w dowolnej kolejności w tablicy — o kolejności w czasie decyduje pole start.',
        items: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Identyfikator zadania (taskId) z listy.' },
            start: { type: 'integer', description: 'Godzina rozpoczęcia jako liczba minut od północy, np. 930 = 15:30.' },
          },
          required: ['taskId', 'start'],
        },
      },
      rationale: { type: 'string', description: 'Jedno zwięzłe zdanie wyjaśniające uczniowi, dlaczego taka kolejność/godziny.' },
    },
    required: ['blocks'],
  },
};

function buildPlanSystemPrompt(lang) {
  const respondIn = lang === 'en' ? 'Respond in English.' : 'Odpowiadaj po polsku.';
  return [
    'Jesteś asystentem planującym dzień nauki ucznia. Na podstawie listy zadań, poziomu energii i preferencji ' +
      'ucznia, ułóż sensowną kolejność i godziny startu dzisiejszych sesji nauki, wywołując narzędzie propose_schedule.',
    respondIn,
    'Twarde ograniczenia, których NIE WOLNO złamać:',
    '- Szkoła trwa do 14:40 (880 min od północy) — żadna sesja nie może zaczynać się wcześniej niż o 15:30 (930 min).',
    '- Trening tenisa jest codziennie w godzinach 18:00–19:00 (1080–1140 min) — żadna sesja nie może na niego nachodzić.',
    '- Uczeń idzie spać o 22:30 (1350 min) — żadna sesja nie może kończyć się później.',
    '- Zostaw sensowną przerwę (co najmniej 10–15 minut) między sesjami, więcej przy niskiej energii.',
    '- Nie zmieniaj czasu trwania (durationMinutes) zadań — użyj go dokładnie takiego, jaki podano.',
    'Przy ustalaniu kolejności bierz pod uwagę: priorytet zadania, poziom energii ucznia (przy niskiej energii ' +
      'trudniejsze/dłuższe zadania lepiej zaplanować wcześniej, gdy energii jest więcej), oraz preferencję ucznia ' +
      '(np. "Najpierw najtrudniejsze" albo "Więcej krótkich przerw").',
  ].join('\n');
}

function buildPlanUserMessage(tasks, energy, pref) {
  const lines = [
    'Zaplanuj dzisiejsze sesje nauki dla poniższych zadań:',
    ...tasks.map((t) => `- taskId: ${t.taskId}, przedmiot: ${t.subject}, tytuł: ${t.title}, czas trwania: ${t.durationMinutes} min, priorytet: ${t.priority}`),
    `Poziom energii ucznia dzisiaj: ${energy}.`,
    `Preferencja ucznia: ${pref}.`,
  ];
  return lines.join('\n');
}

app.post('/api/plan/generate', async (req, res) => {
  if (!anthropic) {
    res.status(500).json({ error: 'Brak klucza ANTHROPIC_API_KEY na serwerze. Ustaw go w server/.env i uruchom serwer ponownie.' });
    return;
  }

  const { tasks, energy, pref, lang } = req.body || {};
  if (!Array.isArray(tasks) || tasks.length === 0) {
    res.status(400).json({ error: 'Brak zadań do zaplanowania.' });
    return;
  }

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: buildPlanSystemPrompt(lang),
      tools: [PLAN_TOOL],
      tool_choice: { type: 'tool', name: 'propose_schedule' },
      messages: [{ role: 'user', content: buildPlanUserMessage(tasks, energy, pref) }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse) {
      res.status(502).json({ error: 'Claude nie zwrócił propozycji planu.' });
      return;
    }
    res.json({ blocks: toolUse.input.blocks || [], rationale: toolUse.input.rationale || '' });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      res.status(err.status || 502).json({ error: err.message || 'Błąd po stronie Claude.' });
      return;
    }
    res.status(502).json({ error: 'Nie udało się połączyć z Claude: ' + err.message });
  }
});

app.get('/api/push/vapid-public-key', (req, res) => {
  if (!pushEnabled) {
    res.status(500).json({ error: 'Brak VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY na serwerze. Wygeneruj je: npx web-push generate-vapid-keys' });
    return;
  }
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/api/push/subscribe', (req, res) => {
  const { subscription, state } = req.body || {};
  if (!subscription?.endpoint) {
    res.status(400).json({ error: 'Brak subskrypcji push.' });
    return;
  }
  saveSubscription(subscription, state);
  res.json({ ok: true });
});

app.post('/api/push/state', (req, res) => {
  const { endpoint, state } = req.body || {};
  if (!endpoint) {
    res.status(400).json({ error: 'Brak endpoint.' });
    return;
  }
  updateState(endpoint, state);
  res.json({ ok: true });
});

app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) removeSubscription(endpoint);
  res.json({ ok: true });
});

// Periodically sends every subscribed device one push built from the state
// it last reported (streak, upcoming-exam flag, custom reminders) — the
// server never sees the app's localStorage directly, only this snapshot.
async function sendScheduledPushes() {
  if (!pushEnabled) return;
  for (const { subscription, state } of allSubscriptions()) {
    const tick = bumpTick(subscription.endpoint);
    const message = composeMessage(state || {}, tick);
    try {
      await webpush.sendNotification(subscription, JSON.stringify(message));
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        removeSubscription(subscription.endpoint);
      } else {
        console.error('Push send failed:', err.message);
      }
    }
  }
}

if (pushEnabled) {
  setInterval(sendScheduledPushes, PUSH_INTERVAL_MINUTES * 60 * 1000);
}

app.listen(PORT, () => {
  console.log(`Chat AI server listening on http://localhost:${PORT}`);
  console.log(pushEnabled
    ? `Push notifications enabled, checking every ${PUSH_INTERVAL_MINUTES} min.`
    : 'Push notifications disabled (set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY in server/.env to enable).');
});
