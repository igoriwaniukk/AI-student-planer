import { anthropic, ANTHROPIC_MODEL, anthropicErrorResponse } from './anthropic.js';
import { contextLines, taskExtras, fmt } from './context.js';

// Fixed daily constraints the schedule must respect — kept in sync with the
// pairwise conflict windows in src/lib/plannerLogic.js's checkBlockConflict,
// which re-validates whatever Claude proposes before the app trusts it.
export const PLAN_TOOL = {
  name: 'propose_schedule',
  description:
    'Proponuje kolejność i godziny rozpoczęcia sesji nauki na planowany dzień. Każde zadanie z listy musi pojawić się dokładnie raz, z zachowaniem podanego dla niego czasu trwania (nie zmieniaj długości sesji). Opcjonalnie dodaje sesje powtórkowe do zbliżających się sprawdzianów.',
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
      extraSessions: {
        type: 'array',
        description: 'Opcjonalnie (maks. 2): dodatkowe sesje powtórkowe do sprawdzianu, który jest za 1–7 dni od planowanego dnia i nie ma jeszcze wystarczająco zaplanowanej nauki. Tylko jeśli mieszczą się w wolnym czasie bez kolizji. Pusta tablica, jeśli nie są potrzebne.',
        items: {
          type: 'object',
          properties: {
            examId: { type: 'string', description: 'examId sprawdzianu z listy.' },
            focus: { type: 'string', description: 'Krótko, czego dotyczy powtórka (max kilka słów), w języku ucznia.' },
            durationMinutes: { type: 'integer', description: 'Długość sesji w minutach (15–90).' },
            start: { type: 'integer', description: 'Godzina rozpoczęcia jako liczba minut od północy.' },
          },
          required: ['examId', 'durationMinutes', 'start'],
        },
      },
      rationale: { type: 'string', description: 'Jedno lub dwa zwięzłe zdania wyjaśniające uczniowi, dlaczego taka kolejność/godziny (i ewentualne powtórki).' },
    },
    required: ['blocks'],
  },
};

export function buildPlanSystemPrompt(lang) {
  const respondIn = lang === 'en'
    ? 'Respond in English: write the rationale and every focus text in English, even though these instructions are in Polish.'
    : 'Odpowiadaj po polsku (uzasadnienie i opisy powtórek po polsku).';
  return [
    'Jesteś asystentem planującym dzień nauki ucznia. Na podstawie listy zadań, poziomu energii, preferencji ' +
      'ucznia oraz podanych w wiadomości użytkownika ograniczeń czasowych, ułóż sensowną kolejność i godziny startu ' +
      'sesji nauki na planowany dzień, wywołując narzędzie propose_schedule. Znasz cały kontekst ucznia: sprawdziany ' +
      '(z już zaplanowanymi i zrobionymi sesjami nauki), rzeczy do zrobienia, notatki, stałe zajęcia i plan na drugi dzień — korzystaj z niego.',
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
    'Zadania przygotowujące do bliskiego sprawdzianu stawiaj wyżej. Jeśli zadanie ma godzinę wybraną już przez ucznia, zachowaj ją, o ile się da.',
    'Weź pod uwagę uwagę ucznia do planu i notatki zadań. Zostaw trochę wolnego czasu na rzeczy do zrobienia bez sesji.',
    'Sesje powtórkowe (extraSessions) dodawaj tylko do sprawdzianu za 1–7 dni od planowanego dnia, gdy nie ma już wystarczająco ' +
      'zaplanowanych sesji do niego, i tylko jeśli mieszczą się w ograniczeniach. Nie dubluj sesji już zaplanowanych do sprawdzianu.',
  ].join('\n');
}

export function buildPlanUserMessage(tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects, studyTime, constraints, context) {
  const lines = [
    'Zaplanuj sesje nauki na planowany dzień dla poniższych zadań:',
    ...tasks.map((t) => `- taskId: ${t.taskId}, przedmiot: ${t.subject}, tytuł: ${t.title}, czas trwania: ${t.durationMinutes} min, priorytet: ${t.priority}${taskExtras(t)}`),
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
  lines.push(...contextLines(context));
  return lines.join('\n');
}

export async function handlePlanGenerate({ tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects, studyTime, constraints, context, lang }) {
  if (!anthropic) {
    return { status: 500, body: { error: 'Brak klucza ANTHROPIC_API_KEY na serwerze. Ustaw go w środowisku i uruchom serwer ponownie.' } };
  }
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { status: 400, body: { error: 'Brak zadań do zaplanowania.' } };
  }

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: buildPlanSystemPrompt(lang),
      tools: [PLAN_TOOL],
      tool_choice: { type: 'tool', name: 'propose_schedule' },
      messages: [{ role: 'user', content: buildPlanUserMessage(tasks, energy, pref, activitiesNote, activitiesSelected, prioritySubjects, studyTime, constraints, context) }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse) {
      return { status: 502, body: { error: 'Claude nie zwrócił propozycji planu.' } };
    }
    return { status: 200, body: { blocks: toolUse.input.blocks || [], extraSessions: toolUse.input.extraSessions || [], rationale: toolUse.input.rationale || '' } };
  } catch (err) {
    const { status, error } = anthropicErrorResponse(err);
    return { status, body: { error } };
  }
}
