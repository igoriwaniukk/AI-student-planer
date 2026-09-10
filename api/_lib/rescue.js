import { anthropic, ANTHROPIC_MODEL, anthropicErrorResponse } from './anthropic.js';

export const RESCUE_TOOL = {
  name: 'propose_rescue',
  description:
    'Proponuje, które z dzisiejszych zadań nauki zostają (ewentualnie skrócone), a które trzeba bezpiecznie przenieść na inny dzień, ' +
    'bo uczniowi zostało mniej czasu niż planowano. Każde zadanie z listy musi trafić dokładnie do jednej z tablic: blocks albo moved.',
  input_schema: {
    type: 'object',
    properties: {
      blocks: {
        type: 'array',
        description: 'Zadania, które zostają dziś w planie (w pełnym albo skróconym wymiarze).',
        items: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Identyfikator zadania (taskId) z listy.' },
            start: { type: 'integer', description: 'Godzina rozpoczęcia jako liczba minut od północy, np. 930 = 15:30.' },
            dur: { type: 'integer', description: 'Długość sesji w minutach — może być krótsza niż oryginalny czas trwania, ale nigdy dłuższa.' },
          },
          required: ['taskId', 'start', 'dur'],
        },
      },
      moved: {
        type: 'array',
        description: 'Identyfikatory zadań (taskId), które nie mieszczą się dziś i zostają bezpiecznie przeniesione na inny dzień.',
        items: { type: 'string' },
      },
      rationale: { type: 'string', description: 'Jedno zwięzłe zdanie wyjaśniające uczniowi logikę ratunku (co zostało, co skrócono, co przeniesiono i dlaczego).' },
    },
    required: ['blocks', 'moved'],
  },
};

function fmt(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

function buildRescueSystemPrompt(lang) {
  const respondIn = lang === 'en' ? 'Respond in English.' : 'Odpowiadaj po polsku.';
  return [
    'Uczniowi zostało dziś mniej czasu na naukę niż planowano. Twoim zadaniem jest "uratować dzień": zdecydować, które ' +
      'zadania nauki zostają dzisiaj (w pełnym albo skróconym wymiarze) i które trzeba bezpiecznie przenieść na inny dzień, ' +
      'wywołując narzędzie propose_rescue.',
    respondIn,
    'Twarde ograniczenia, których NIE WOLNO złamać:',
    '- Łączny czas wszystkich zadań w blocks NIE MOŻE przekroczyć podanego dostępnego czasu (availableMinutes).',
    '- Nie wolno wydłużać zadania ponad jego oryginalny czas trwania (durationMinutes) — można je tylko skrócić albo zostawić bez zmian.',
    '- Żadna sesja nie może zaczynać się przed podaną godziną pobudki ucznia.',
    '- Żadna sesja nie może kończyć się później niż podana godzina snu ucznia.',
    '- Żadna sesja nie może nachodzić na żadne ze stałych zajęć ucznia wymienionych w wiadomości.',
    '- Zostaw sensowną przerwę (co najmniej 10–15 minut) między sesjami.',
    'Przy wyborze, co zostaje a co przenieść, kieruj się priorytetem zadania i podanym powodem/powodami, dla których dzień się nie ' +
      'ułożył — zadania z wyższym priorytetem chroń w pierwszej kolejności, ewentualnie skracając je zamiast przenosić. Zadania z ' +
      'niższym priorytetem przenoś w pierwszej kolejności, gdy czasu nie starcza dla wszystkich.',
  ].join('\n');
}

function buildRescueUserMessage(tasks, energy, availableMinutes, reasons, activitiesNote, activitiesSelected, prioritySubjects, constraints) {
  const lines = [
    `Uczniowi zostało dziś tylko ${availableMinutes} minut na naukę (availableMinutes = ${availableMinutes}). Oto zadania do rozdysponowania:`,
    ...tasks.map((t) => `- taskId: ${t.taskId}, przedmiot: ${t.subject}, tytuł: ${t.title}, oryginalny czas trwania: ${t.durationMinutes} min, priorytet: ${t.priority}`),
    `Poziom energii ucznia teraz: ${energy}.`,
    `Powody, dla których dzień się nie ułożył: ${(reasons && reasons.length ? reasons : ['nieznany']).join(', ')}.`,
  ];
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

export async function handlePlanRescue({ tasks, energy, availableMinutes, reasons, activitiesNote, activitiesSelected, prioritySubjects, constraints, lang }) {
  if (!anthropic) {
    return { status: 500, body: { error: 'Brak klucza ANTHROPIC_API_KEY na serwerze. Ustaw go w środowisku i uruchom serwer ponownie.' } };
  }
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { status: 400, body: { error: 'Brak zadań do rozdysponowania.' } };
  }
  if (typeof availableMinutes !== 'number' || availableMinutes < 0) {
    return { status: 400, body: { error: 'Brak dostępnego czasu (availableMinutes).' } };
  }

  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: buildRescueSystemPrompt(lang),
      tools: [RESCUE_TOOL],
      tool_choice: { type: 'tool', name: 'propose_rescue' },
      messages: [{ role: 'user', content: buildRescueUserMessage(tasks, energy, availableMinutes, reasons, activitiesNote, activitiesSelected, prioritySubjects, constraints) }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse) {
      return { status: 502, body: { error: 'Claude nie zwrócił propozycji ratunku.' } };
    }
    return { status: 200, body: { blocks: toolUse.input.blocks || [], moved: toolUse.input.moved || [], rationale: toolUse.input.rationale || '' } };
  } catch (err) {
    const { status, error } = anthropicErrorResponse(err);
    return { status, body: { error } };
  }
}
