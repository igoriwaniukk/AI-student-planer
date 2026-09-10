import { anthropic, ANTHROPIC_MODEL, anthropicErrorResponse } from './anthropic.js';

// Fixed daily constraints the schedule must respect — kept in sync with the
// pairwise conflict windows in src/lib/plannerLogic.js's checkBlockConflict,
// which re-validates whatever Claude proposes before the app trusts it.
export const PLAN_TOOL = {
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

function buildPlanUserMessage(tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects) {
  const lines = [
    'Zaplanuj dzisiejsze sesje nauki dla poniższych zadań:',
    ...tasks.map((t) => `- taskId: ${t.taskId}, przedmiot: ${t.subject}, tytuł: ${t.title}, czas trwania: ${t.durationMinutes} min, priorytet: ${t.priority}`),
    `Poziom energii ucznia dzisiaj: ${energy}.`,
    `Preferencja ucznia: ${pref}.`,
  ];
  if (prioritySubjects && prioritySubjects.length) {
    lines.push(`Przedmioty, na których uczniowi szczególnie zależy: ${prioritySubjects.join(', ')}.`);
  }
  if (activitiesSelected && activitiesSelected.length) {
    lines.push(`Zajęcia pozalekcyjne ucznia (bez podanych godzin): ${activitiesSelected.join(', ')}.`);
  }
  if (activitiesNote) {
    lines.push(`Dodatkowy kontekst podany przez ucznia (weź go pod uwagę, jeśli jest istotny): ${activitiesNote}`);
  }
  return lines.join('\n');
}

export async function handlePlanGenerate({ tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects, lang }) {
  if (!anthropic) {
    return { status: 500, body: { error: 'Brak klucza ANTHROPIC_API_KEY na serwerze. Ustaw go w środowisku i uruchom serwer ponownie.' } };
  }
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { status: 400, body: { error: 'Brak zadań do zaplanowania.' } };
  }

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: buildPlanSystemPrompt(lang),
      tools: [PLAN_TOOL],
      tool_choice: { type: 'tool', name: 'propose_schedule' },
      messages: [{ role: 'user', content: buildPlanUserMessage(tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects) }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse) {
      return { status: 502, body: { error: 'Claude nie zwrócił propozycji planu.' } };
    }
    return { status: 200, body: { blocks: toolUse.input.blocks || [], rationale: toolUse.input.rationale || '' } };
  } catch (err) {
    const { status, error } = anthropicErrorResponse(err);
    return { status, body: { error } };
  }
}
