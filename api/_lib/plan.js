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

function fmt(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

function buildPlanSystemPrompt(lang) {
  const respondIn = lang === 'en' ? 'Respond in English.' : 'Odpowiadaj po polsku.';
  return [
    'Jesteś asystentem planującym dzień nauki ucznia. Na podstawie listy zadań, poziomu energii, preferencji ' +
      'ucznia oraz podanych w wiadomości użytkownika ograniczeń czasowych, ułóż sensowną kolejność i godziny startu ' +
      'dzisiejszych sesji nauki, wywołując narzędzie propose_schedule.',
    respondIn,
    'Twarde ograniczenia, których NIE WOLNO złamać:',
    '- Żadna sesja nie może zaczynać się przed podaną godziną pobudki ucznia.',
    '- Żadna sesja nie może kończyć się później niż podana godzina snu ucznia.',
    '- Żadna sesja nie może nachodzić na żadne ze stałych zajęć ucznia wymienionych w wiadomości.',
    '- Zostaw sensowną przerwę (co najmniej 10–15 minut) między sesjami, więcej przy niskiej energii.',
    '- Nie zmieniaj czasu trwania (durationMinutes) zadań — użyj go dokładnie takiego, jaki podano.',
    'Przy ustalaniu kolejności bierz pod uwagę: priorytet zadania, poziom energii ucznia (przy niskiej energii ' +
      'trudniejsze/dłuższe zadania lepiej zaplanować wcześniej, gdy energii jest więcej), oraz preferencję ucznia ' +
      '(np. "Najpierw najtrudniejsze" albo "Więcej krótkich przerw").',
  ].join('\n');
}

function buildPlanUserMessage(tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects, studyTime, constraints) {
  const lines = [
    'Zaplanuj dzisiejsze sesje nauki dla poniższych zadań:',
    ...tasks.map((t) => `- taskId: ${t.taskId}, przedmiot: ${t.subject}, tytuł: ${t.title}, czas trwania: ${t.durationMinutes} min, priorytet: ${t.priority}`),
    `Poziom energii ucznia dzisiaj: ${energy}.`,
    `Preferencja ucznia: ${pref}.`,
  ];
  if (studyTime) {
    lines.push(`Pora dnia, o której uczniowi najlepiej się uczy: ${studyTime} — jeśli to możliwe przy zachowaniu ograniczeń, faworyzuj tę porę.`);
  }
  if (constraints && typeof constraints.wakeMinutes === 'number' && typeof constraints.bedtimeMinutes === 'number') {
    lines.push(`Pobudka ucznia: ${fmt(constraints.wakeMinutes)} (${constraints.wakeMinutes} min od północy) — żadna sesja nie może zaczynać się wcześniej.`);
    lines.push(`Pora snu ucznia: ${fmt(constraints.bedtimeMinutes)} (${constraints.bedtimeMinutes} min od północy) — żadna sesja nie może kończyć się później.`);
    if (constraints.blocks && constraints.blocks.length) {
      lines.push('Stałe zajęcia ucznia dziś (żadna sesja nie może na nie nachodzić):');
      constraints.blocks.forEach((b) => lines.push(`- ${b.label}: ${fmt(b.start)}–${fmt(b.end)} (${b.start}–${b.end} min od północy)`));
    }
  }
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

export async function handlePlanGenerate({ tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects, studyTime, constraints, lang }) {
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
      messages: [{ role: 'user', content: buildPlanUserMessage(tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects, studyTime, constraints) }],
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
