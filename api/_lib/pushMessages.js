// Composes the periodic push notification's title/body from the last state
// the client reported (streak, whether an exam is coming up, custom
// reminders) — rotated by `tick` so the same device doesn't see the exact
// same line every time. Real notification text, not a translated key
// lookup, since the server has no access to the app's i18n dictionary.
// Builds one language's texts; `day(n)` / `task(n)` give the counted word.
function texts({ streak, secured, keep, start, startNew, done, timeTitle, planNew, examTitle, examBody, reminder, restartTitle, restartBody, leftTitle, leftBody, more, day, task, q = ['"', '"'] }) {
  const quoted = (s) => q[0] + s + q[1];
  return {
    streakActive: (n) => ({ title: '🔥 ' + streak + ': ' + n + ' ' + day(n) + '!', body: keep }),
    streakSession: (n, s) => ({ title: '🔥 ' + streak + ': ' + n + ' ' + day(n) + '!', body: start(quoted(s)) }),
    streakSecured: (n) => ({ title: '🔥 ' + secured + ': ' + n + ' ' + day(n) + '!', body: done }),
    streakNone: { title: '📚 ' + timeTitle, body: planNew },
    streakNoneSession: (s) => ({ title: '📚 ' + timeTitle, body: startNew(quoted(s)) }),
    exam: { title: '🎯 ' + examTitle, body: examBody },
    reminder: (text) => ({ title: '📌 ' + reminder, body: text }),
    restart: { title: '🔄 ' + restartTitle, body: restartBody },
    unfinished: (n, list) => ({ title: '📋 ' + leftTitle(n, task(n)), body: list + leftBody }),
    more: (n) => more(n),
  };
}
const plural = (one, other) => (n) => (n === 1 ? one : other);

const TEXT = {
  pl: texts({
    streak: 'Twoja seria', secured: 'Seria bezpieczna', keep: 'Nie przerywaj jej — skończ dziś sesję nauki.',
    start: (s) => 'Zacznij ' + s + ', żeby ją przedłużyć.', startNew: (s) => 'Zacznij ' + s + ' i rozpocznij nową serię.',
    done: 'Dzisiejsza nauka zaliczona — widzimy się jutro.', timeTitle: 'Czas na naukę?', planNew: 'Zaplanuj dzisiejszą sesję i zacznij nową serię.',
    examTitle: 'Zbliża się sprawdzian', examBody: 'Sprawdź plan przygotowań w Pulgo.', reminder: 'Przypomnienie',
    restartTitle: 'Zrestartuj swój dzień', restartBody: 'Nie masz jeszcze planu na dziś — ułóż go teraz, zanim dzień się skończy.',
    leftTitle: (n, w) => 'Zostało Ci ' + n + ' ' + w + ' na dziś', leftBody: ' — skończ je albo przenieś na jutro w podsumowaniu dnia.',
    more: (n) => ' i ' + n + ' więcej', day: plural('dzień', 'dni'),
    task: (n) => (n === 1 ? 'zadanie' : n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14) ? 'zadania' : 'zadań'), q: ['„', '”'],
  }),
  en: texts({
    streak: 'Your streak', secured: 'Streak secured', keep: "Don't break it — finish a study session today.",
    start: (s) => 'Start ' + s + ' to extend it.', startNew: (s) => 'Start ' + s + ' and begin a new streak.',
    done: "Today's study is done — see you tomorrow.", timeTitle: 'Time to study?', planNew: 'Plan a session today and start a new streak.',
    examTitle: 'An exam is coming up', examBody: 'Check your prep plan in Pulgo.', reminder: 'Reminder',
    restartTitle: 'Restart your day', restartBody: "You don't have a plan for today yet — set one up before the day's gone.",
    leftTitle: (n, w) => n + ' ' + w + ' left for today', leftBody: ' — finish them or move them to tomorrow in your day summary.',
    more: (n) => ' and ' + n + ' more', day: plural('day', 'days'), task: plural('task', 'tasks'),
  }),
  es: texts({
    streak: 'Tu racha', secured: 'Racha asegurada', keep: 'No la rompas: termina hoy una sesión de estudio.',
    start: (s) => 'Empieza ' + s + ' para alargarla.', startNew: (s) => 'Empieza ' + s + ' y comienza una nueva racha.',
    done: 'El estudio de hoy está hecho: ¡hasta mañana!', timeTitle: '¿Hora de estudiar?', planNew: 'Planea una sesión hoy y empieza una nueva racha.',
    examTitle: 'Se acerca un examen', examBody: 'Revisa tu plan de preparación en Pulgo.', reminder: 'Recordatorio',
    restartTitle: 'Reinicia tu día', restartBody: 'Aún no tienes plan para hoy: créalo antes de que se acabe el día.',
    leftTitle: (n, w) => 'Te quedan ' + n + ' ' + w + ' para hoy', leftBody: ': termínalas o pásalas a mañana en el resumen del día.',
    more: (n) => ' y ' + n + ' más', day: plural('día', 'días'), task: plural('tarea', 'tareas'), q: ['«', '»'],
  }),
  pt: texts({
    streak: 'A tua sequência', secured: 'Sequência garantida', keep: 'Não a quebres: termina hoje uma sessão de estudo.',
    start: (s) => 'Começa ' + s + ' para a prolongar.', startNew: (s) => 'Começa ' + s + ' e inicia uma nova sequência.',
    done: 'O estudo de hoje está feito — até amanhã!', timeTitle: 'Hora de estudar?', planNew: 'Planeia uma sessão hoje e começa uma nova sequência.',
    examTitle: 'Aproxima-se um teste', examBody: 'Vê o teu plano de preparação no Pulgo.', reminder: 'Lembrete',
    restartTitle: 'Recomeça o teu dia', restartBody: 'Ainda não tens plano para hoje — cria-o antes que o dia acabe.',
    leftTitle: (n, w) => 'Faltam-te ' + n + ' ' + w + ' para hoje', leftBody: ' — termina-as ou passa-as para amanhã no resumo do dia.',
    more: (n) => ' e mais ' + n, day: plural('dia', 'dias'), task: plural('tarefa', 'tarefas'), q: ['«', '»'],
  }),
  de: texts({
    streak: 'Deine Serie', secured: 'Serie gesichert', keep: 'Unterbrich sie nicht — schließ heute eine Lerneinheit ab.',
    start: (s) => 'Starte ' + s + ', um sie zu verlängern.', startNew: (s) => 'Starte ' + s + ' und beginne eine neue Serie.',
    done: 'Für heute ist gelernt — bis morgen!', timeTitle: 'Zeit zum Lernen?', planNew: 'Plane heute eine Einheit und starte eine neue Serie.',
    examTitle: 'Eine Prüfung steht an', examBody: 'Schau dir deinen Lernplan in Pulgo an.', reminder: 'Erinnerung',
    restartTitle: 'Starte deinen Tag neu', restartBody: 'Du hast noch keinen Plan für heute — erstell ihn, bevor der Tag vorbei ist.',
    leftTitle: (n, w) => 'Noch ' + n + ' ' + w + ' für heute', leftBody: ' — erledige sie oder verschiebe sie in der Tageszusammenfassung auf morgen.',
    more: (n) => ' und ' + n + ' weitere', day: plural('Tag', 'Tage'), task: plural('Aufgabe', 'Aufgaben'), q: ['„', '“'],
  }),
  fr: texts({
    streak: 'Ta série', secured: 'Série assurée', keep: 'Ne la casse pas : termine une séance de révision aujourd’hui.',
    start: (s) => 'Lance ' + s + ' pour la prolonger.', startNew: (s) => 'Lance ' + s + ' et commence une nouvelle série.',
    done: 'Les révisions du jour sont faites — à demain !', timeTitle: 'C’est l’heure de réviser ?', planNew: 'Planifie une séance aujourd’hui et commence une nouvelle série.',
    examTitle: 'Un contrôle approche', examBody: 'Consulte ton plan de révision dans Pulgo.', reminder: 'Rappel',
    restartTitle: 'Redémarre ta journée', restartBody: 'Tu n’as pas encore de plan pour aujourd’hui — crée-le avant la fin de la journée.',
    leftTitle: (n, w) => 'Il te reste ' + n + ' ' + w + ' pour aujourd’hui', leftBody: ' — termine-les ou reporte-les à demain dans le bilan du jour.',
    more: (n) => ' et ' + n + ' de plus', day: (n) => (n <= 1 ? 'jour' : 'jours'), task: (n) => (n <= 1 ? 'tâche' : 'tâches'), q: ['« ', ' »'],
  }),
  it: texts({
    streak: 'La tua serie', secured: 'Serie al sicuro', keep: 'Non interromperla: finisci oggi una sessione di studio.',
    start: (s) => 'Inizia ' + s + ' per allungarla.', startNew: (s) => 'Inizia ' + s + ' e comincia una nuova serie.',
    done: 'Lo studio di oggi è fatto: a domani!', timeTitle: 'È ora di studiare?', planNew: 'Pianifica una sessione oggi e inizia una nuova serie.',
    examTitle: 'Si avvicina una verifica', examBody: 'Controlla il tuo piano di preparazione su Pulgo.', reminder: 'Promemoria',
    restartTitle: 'Riavvia la tua giornata', restartBody: 'Non hai ancora un piano per oggi: crealo prima che la giornata finisca.',
    leftTitle: (n, w) => 'Ti restano ' + n + ' ' + w + ' per oggi', leftBody: ': finiscili o spostali a domani nel riepilogo della giornata.',
    more: (n) => ' e altri ' + n, day: plural('giorno', 'giorni'), task: plural('compito', 'compiti'), q: ['«', '»'],
  }),
  zh: texts({
    streak: '你的连续学习', secured: '连续学习已保住', keep: '别中断——今天完成一次学习吧。',
    start: (s) => '开始' + s + '来延续它。', startNew: (s) => '开始' + s + '，开启新的连续学习。',
    done: '今天的学习完成了——明天见！', timeTitle: '该学习了吗？', planNew: '今天安排一次学习，开启新的连续学习。',
    examTitle: '考试快到了', examBody: '在 Pulgo 里查看你的备考计划。', reminder: '提醒',
    restartTitle: '重新开始今天', restartBody: '你还没有今天的计划——趁今天还没过完，现在就安排吧。',
    leftTitle: (n) => '今天还剩 ' + n + ' 项任务', leftBody: '——完成它们，或在今日总结里改到明天。',
    more: (n) => ' 等另外 ' + n + ' 项', day: () => '天', task: () => '项任务', q: ['“', '”'],
  }),
  ja: texts({
    streak: '連続記録', secured: '連続記録キープ', keep: '途切れさせないで — 今日の学習を終わらせましょう。',
    start: (s) => s + 'を始めて記録を伸ばしましょう。', startNew: (s) => s + 'を始めて新しい記録をスタート。',
    done: '今日の学習は完了です — また明日！', timeTitle: '勉強の時間？', planNew: '今日の学習を計画して新しい記録を始めましょう。',
    examTitle: 'テストが近づいています', examBody: 'Pulgo で準備プランを確認しましょう。', reminder: 'リマインダー',
    restartTitle: '今日をリスタート', restartBody: 'まだ今日のプランがありません — 一日が終わる前に作りましょう。',
    leftTitle: (n) => '今日のタスクが残り ' + n + ' 件', leftBody: ' — 終わらせるか、一日のまとめで明日に移しましょう。',
    more: (n) => ' ほか ' + n + ' 件', day: () => '日', task: () => '件', q: ['「', '」'],
  }),
};
const textFor = (code) => TEXT[code] || TEXT.pl;

// The "restart your day" nudge (see sendScheduledPushes in push.js) fully
// replaces the usual rotation below rather than taking a turn in it — if
// today still has no plan by the afternoon, that's the one thing worth
// saying, not whichever slot the tick rotation happens to land on.
export function composeRestartMessage(lang) {
  return textFor(lang).restart;
}

export function composeUnfinishedMessage(lang, titles) {
  const t = textFor(lang);
  const shown = titles.slice(0, 3).join(', ') + (titles.length > 3 ? t.more(titles.length - 3) : '');
  return t.unfinished(titles.length, shown);
}

// `todayKey` is the subscriber's local YYYY-MM-DD; studiedTodayDate and
// nextSessionDate (synced by useStreakPushSync) only count when they match
// it, so yesterday's snapshot never reads as "already studied today".
export function composeMessage(state, tick, todayKey) {
  const t = textFor(state.lang);
  const streak = Number(state.streak) || 0;
  const reminders = Array.isArray(state.reminders) ? state.reminders.filter(Boolean) : [];
  const studied = !!todayKey && state.studiedTodayDate === todayKey;
  const nextTitle = todayKey && state.nextSessionDate === todayKey && state.nextSessionTitle ? String(state.nextSessionTitle) : null;

  const slot = tick % 3;
  if (slot === 2 && reminders.length) {
    return t.reminder(reminders[tick % reminders.length]);
  }
  if (slot === 1 && state.hasUpcomingExam) {
    return t.exam;
  }
  if (studied) {
    return t.streakSecured(Math.max(streak, 1));
  }
  if (streak > 0) return nextTitle ? t.streakSession(streak, nextTitle) : t.streakActive(streak);
  return nextTitle ? t.streakNoneSession(nextTitle) : t.streakNone;
}
