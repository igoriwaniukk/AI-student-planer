// Turns the student's planning context (built by src/lib/aiContext.js —
// exams with their planned study sessions, to-dos, notes, weekly activities,
// the other day's plan) into prompt lines for the plan, rescue and exam-prep
// requests. Lists are capped so an unusually full account can't blow up the
// prompt; notes are the student's own words, passed along as context.

export function fmt(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
}

const str = (v, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function sessionLine(s) {
  const when = [s.date, num(s.start) != null ? fmt(s.start) : null].filter(Boolean).join(' ');
  const dur = num(s.durationMinutes) != null ? `, ${s.durationMinutes} min` : '';
  return `${str(s.title, 120)} (${when || 'bez daty'}${dur})${s.done ? ' — ZROBIONE' : ''}`;
}

export function examLines(exams, { planDayLabel = 'planowanego dnia' } = {}) {
  const items = list(exams, 12);
  if (!items.length) return ['Nadchodzące sprawdziany: brak.'];
  const lines = ['Nadchodzące sprawdziany ucznia (i sesje nauki już zaplanowane do nich — nie planuj ich drugi raz):'];
  items.forEach((e) => {
    const goal = [e.targetGrade && `cel: ${str(e.targetGrade, 60)}`, e.importance && `ważność: ${str(e.importance, 30)}`, num(e.targetStudyMinutes) != null && `planowany czas nauki łącznie: ${e.targetStudyMinutes} min`]
      .filter(Boolean).join(', ');
    const offset = num(e.daysAfterPlanDay);
    const when = offset != null ? (offset === 0 ? `w dniu ${planDayLabel}` : `${offset} dni po dniu ${planDayLabel}`) : '';
    lines.push(`- examId: ${str(e.examId, 60)}, ${str(e.subject, 40)}: ${str(e.title, 120)}, data: ${str(e.date, 10)}${when ? ` (${when})` : ''}${goal ? `; ${goal}` : ''}`);
    const sessions = list(e.sessions, 20);
    if (sessions.length) sessions.forEach((s) => lines.push(`    • ${sessionLine(s)}`));
    else lines.push('    • brak zaplanowanych sesji nauki');
  });
  return lines;
}

export function contextLines(context) {
  if (!context || typeof context !== 'object') return [];
  const lines = [];
  if (context.planDate) lines.push(`Planowany dzień: ${str(context.planDate, 10)}${context.planWeekday ? ` (${str(context.planWeekday, 20)})` : ''}; dzisiaj jest ${str(context.today, 10)}.`);
  if (context.note) lines.push(`Uwaga ucznia do tego planu (ważne — uwzględnij ją): ${str(context.note, 600)}`);
  lines.push(...examLines(context.exams, { planDayLabel: 'planowanego' }));
  const todos = list(context.todos, 15);
  if (todos.length) {
    lines.push('Rzeczy do zrobienia tego dnia bez sesji nauki (zostaw na nie trochę czasu):');
    todos.forEach((t) => lines.push(`- ${str(t.title, 120)}${t.note ? ` (notatka: ${str(t.note, 200)})` : ''}`));
  }
  const other = context.otherDayPlan;
  if (other && list(other.sessions, 20).length) {
    lines.push(`Już zatwierdzony plan na ${str(other.date, 10)} (tych sesji nie powtarzaj):`);
    list(other.sessions, 20).forEach((s) => lines.push(`- ${str(s.title, 120)} ${num(s.start) != null ? fmt(s.start) : ''} (${num(s.durationMinutes) ?? '?'} min)`));
  }
  const done = list(context.doneToday, 20);
  if (done.length) lines.push(`Dziś już zrobione: ${done.map((d) => str(d, 120)).join('; ')}.`);
  const upcoming = list(context.upcomingTasks, 20);
  if (upcoming.length) {
    lines.push('Zadania na najbliższe dni (na później, tylko dla kontekstu):');
    upcoming.forEach((t) => lines.push(`- ${str(t.title, 120)}, ${str(t.date, 10)}${num(t.durationMinutes) != null ? `, ${t.durationMinutes} min` : ''}`));
  }
  const weekly = list(context.weeklyActivities, 30);
  if (weekly.length) {
    lines.push('Stałe zajęcia ucznia w tygodniu:');
    weekly.forEach((a) => lines.push(`- ${str(a.name, 60)}: ${str(a.day, 20)} ${str(a.start, 5)}${num(a.durationMinutes) != null ? ` (${a.durationMinutes} min)` : ''}`));
  }
  return lines;
}

// A task line for the plan and rescue prompts, including the student's own
// note, a start time they already picked, and the exam it prepares for.
export function taskExtras(t) {
  const parts = [];
  if (t.forExam) parts.push(`przygotowanie do: ${str(t.forExam, 120)}`);
  if (num(t.preferredStart) != null) parts.push(`uczeń wybrał już godzinę ${fmt(t.preferredStart)} — zachowaj ją, jeśli się da`);
  if (t.note) parts.push(`notatka: ${str(t.note, 300)}`);
  return parts.length ? ', ' + parts.join(', ') : '';
}
