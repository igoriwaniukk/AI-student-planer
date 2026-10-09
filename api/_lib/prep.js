import { anthropic, ANTHROPIC_MODEL, anthropicErrorResponse, NO_KEY_RESPONSE } from './anthropic.js';
import { langName, isKnownLang } from './lang.js';
import { examLines, aboutMeLines, fmt } from './context.js';

// Plans the study sessions for a newly added exam across the days before it,
// around the student's real days (free time, fixed activities, sessions
// already planned). The app re-checks every session (src/lib/aiPrep.js)
// and falls back to its fixed template when nothing usable comes back.
export const PREP_TOOL = {
  name: 'propose_prep_plan',
  description: 'Proponuje sesje nauki do sprawdzianu w dniach przed nim, w wolnym czasie ucznia, bez kolizji z tym, co już zaplanowane.',
  input_schema: {
    type: 'object',
    properties: {
      sessions: {
        type: 'array',
        description: 'Sesje nauki (zwykle 3–8), uporządkowane od najwcześniejszej.',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Dzień sesji w formacie YYYY-MM-DD — tylko jeden z podanych dni.' },
            start: { type: 'string', description: 'Godzina rozpoczęcia w formacie HH:MM (24h), np. "16:30".' },
            durationMinutes: { type: 'integer', description: 'Długość sesji w minutach (15–120, zwykle 25–60).' },
            title: { type: 'string', description: 'Krótki tytuł: czego dotyczy sesja (temat + rodzaj pracy), w języku ucznia.' },
            type: { type: 'string', description: 'Rodzaj sesji w 1–3 słowach, np. "Pierwszy kontakt", "Ćwiczenia", "Powtórka", "Test próbny".' },
            why: { type: 'string', description: 'Jedno zdanie, po co ta sesja jest w tym miejscu planu.' },
          },
          required: ['date', 'start', 'durationMinutes', 'title'],
        },
      },
      rationale: { type: 'string', description: 'Jedno lub dwa zdania dla ucznia: jak rozłożono naukę i dlaczego.' },
    },
    required: ['sessions'],
  },
};

export function buildPrepSystemPrompt(lang) {
  return [
    'Jesteś asystentem, który planuje uczniowi naukę do sprawdzianu. Na podstawie tematów, trudności, poziomu wiedzy ucznia, ' +
      'celu i dostępnych dni ułóż sesje nauki, wywołując narzędzie propose_prep_plan.',
    !isKnownLang(lang) || lang === 'pl' ? 'Tytuły, rodzaje, wyjaśnienia i uzasadnienie pisz po polsku.' : `Write titles, types, explanations and the rationale in ${langName(lang)}.`,
    'Twarde ograniczenia, których NIE WOLNO złamać:',
    '- Sesje tylko w podanych dniach (nigdy w dniu sprawdzianu), między pobudką a snem danego dnia.',
    '- Żadna sesja nie może nachodzić na stałe zajęcia ani na sesje już zaplanowane tego dnia (lista "zajęte").',
    '- Najwyżej jedna, wyjątkowo dwie sesje do tego sprawdzianu dziennie; zostaw przerwy.',
    'Dobre praktyki: zacznij od podstaw, potem ćwiczenia z każdego tematu, powtórka rozłożona w czasie (nie wszystko ostatniego dnia), ' +
      'a ostatnia sesja przed sprawdzianem to krótki test próbny. Im trudniejszy materiał, niższy poziom wiedzy i wyższy cel, tym więcej ' +
      'i dłuższych sesji. Nie przeciążaj dni, w których uczeń ma już dużo zaplanowane; uwzględnij inne sprawdziany ucznia.',
  ].join('\n');
}

const str = (v, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function buildPrepUserMessage(exam, days, context) {
  const e = exam || {};
  const lines = [
    `Nowy sprawdzian: ${str(e.kind, 30) || 'sprawdzian'} z przedmiotu ${str(e.subject, 40)}${e.title ? ` — ${str(e.title, 120)}` : ''}.`,
    `Data: ${str(e.date, 10)}${e.time ? `, godz. ${str(e.time, 5)}` : ''} (za ${Number(e.daysUntil) || 0} dni).`,
    `Tematy: ${(Array.isArray(e.topics) && e.topics.length ? e.topics.slice(0, 15).map((t) => str(t, 80)).join('; ') : 'nie podano')}.`,
    `Trudność materiału: ${str(e.difficulty, 20)}. Poziom wiedzy ucznia teraz: ${str(e.level, 40)}. Cel: ${str(e.goal, 60)}.`,
    'Dostępne dni:',
  ];
  (Array.isArray(days) ? days.slice(0, 21) : []).forEach((d) => {
    const blocks = (d.blocks || []).map((b) => `${str(b.label, 40)} ${fmt(b.start)}–${fmt(b.end)}`);
    const busy = (d.busy || []).map((b) => `${str(b.title, 60)} ${fmt(b.start)}–${fmt(b.end)}`);
    lines.push(`- ${str(d.date, 10)} (${str(d.weekday, 20)}): wolne od ${fmt(d.wakeMinutes)} do ${fmt(d.bedtimeMinutes)}` +
      `${blocks.length ? `; stałe zajęcia: ${blocks.join(', ')}` : ''}${busy.length ? `; zajęte: ${busy.join(', ')}` : ''}` +
      `${Array.isArray(d.dueTasks) && d.dueTasks.length ? `; inne zadania tego dnia: ${d.dueTasks.slice(0, 8).map((t) => str(t, 60)).join(', ')}` : ''}`);
  });
  if (context) {
    lines.push(...examLines((context.exams || []), { planDayLabel: 'dzisiejszym' }).map((l) => l.replace('Nadchodzące sprawdziany ucznia', 'Inne sprawdziany ucznia')));
    if (context.note) lines.push(`Uwaga ucznia: ${str(context.note, 400)}`);
    lines.push(...aboutMeLines(context.aboutMe));
  }
  return lines.join('\n');
}

export async function handlePlanPrep({ exam, days, context, lang }) {
  if (!anthropic) {
    return NO_KEY_RESPONSE;
  }
  if (!exam || !Array.isArray(days) || days.length === 0) {
    return { status: 400, body: { error: 'Brak danych sprawdzianu albo dni do zaplanowania.' } };
  }
  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 3000,
      system: buildPrepSystemPrompt(lang),
      tools: [PREP_TOOL],
      tool_choice: { type: 'tool', name: 'propose_prep_plan' },
      messages: [{ role: 'user', content: buildPrepUserMessage(exam, days, context) }],
    });
    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse) return { status: 502, body: { error: 'Claude nie zwrócił planu nauki.' } };
    return { status: 200, body: { sessions: toolUse.input.sessions || [], rationale: toolUse.input.rationale || '' } };
  } catch (err) {
    const { status, error, code } = anthropicErrorResponse(err);
    return { status, body: { error, code } };
  }
}
