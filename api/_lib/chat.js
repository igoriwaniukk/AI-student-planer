import { GOALS, IMPORTANCE_OPTIONS, ENERGY_OPTIONS, RECUR_DAYS } from '../../src/lib/plannerData.js';
import { anthropic, ANTHROPIC_MODEL, anthropicErrorResponse } from './anthropic.js';

export const CHAT_TOOLS = [
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

function buildChatSystemPrompt(context) {
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

// Framework-agnostic: takes the parsed request body, returns {status, body}
// so both the Express route (server/index.js) and the Vercel function
// (api/chat.js) can call the exact same logic instead of duplicating it.
export async function handleChat({ messages, context }) {
  if (!anthropic) {
    return { status: 500, body: { error: 'Brak klucza ANTHROPIC_API_KEY na serwerze. Ustaw go w środowisku i uruchom serwer ponownie.' } };
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, body: { error: 'Brak wiadomości do wysłania.' } };
  }

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: buildChatSystemPrompt(context),
      tools: CHAT_TOOLS,
      // Frontend already speaks the same {role: 'user'|'assistant', content: string}
      // shape the API expects, so no mapping is needed here.
      messages,
    });

    const reply = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const toolUse = response.content.find((b) => b.type === 'tool_use');
    const action = toolUse ? { name: toolUse.name, args: toolUse.input } : null;
    return { status: 200, body: { reply, action } };
  } catch (err) {
    const { status, error } = anthropicErrorResponse(err);
    return { status, body: { error } };
  }
}
