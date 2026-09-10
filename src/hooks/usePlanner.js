import { useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/useLang';
import { getCurrentLang, TASK_TEXT_KEY } from '../lib/i18n';
import {
  PLAN_LABELS, PREP_LABELS, RESCUE_LABELS, GOALS, REFERENCE_DAY, SUBJECTS, PRIORITIES, RESCUE_TIME_MINUTES,
} from '../lib/plannerData';
import { buildSchedule, buildRescueSchedule, activeIds as computeActiveIds, checkBlockConflict, upcomingExams, buildPrepSessions, buildPrepDates, weekdayDateLabel, dayConstraints } from '../lib/plannerLogic';
import { requestAIPlan } from '../lib/aiPlan';
import { requestAIRescue } from '../lib/aiRescue';

function initialState(defaults, activities) {
  const initialTopics = getCurrentLang() === 'en'
    ? ['Mendelian genetics', 'Genetic crosses', 'Blood type inheritance']
    : ['Prawa Mendla', 'Krzyżówki genetyczne', 'Dziedziczenie grup krwi'];
  const initialPrepSessions = buildPrepSessions(initialTopics, 'Średni');
  return {
    screen: 'home',
    generating: false,
    genStep: 0,
    genLabels: PLAN_LABELS,
    genTarget: 'plan',

    taskDefs: [],
    tasks: {},
    energy: defaults?.energy || 'Normalna',
    pref: defaults?.pref || 'Wolny wieczór',
    // Free-form context from onboarding (extracurriculars + note) — passed
    // along to the AI plan/rescue requests (see requestAIPlan/requestAIRescue
    // calls below) so it actually informs the generated plan instead of only
    // ever being displayed back on the Profile screen.
    activitiesNote: (activities?.note || '').trim(),
    activitiesSelected: activities?.selected || [],
    prioritySubjects: defaults?.prioritySubjects || [],
    // "When do you study best?" from onboarding — a preference for the AI
    // plan/rescue requests (see requestAIPlan/requestAIRescue below), not a
    // hard constraint like bedtime/wake (see dayConstraints in
    // plannerLogic.js). Previously only reached the chat assistant.
    studyTime: defaults?.studyTime || 'Wieczorem',
    gcal: false,
    saved: false,

    taskState: {},
    schedule: null,
    planAIRationale: null,
    durOverride: {},
    startOverride: {},
    manualMode: false,
    manualSnapshot: null,
    blockEdit: null,
    activeTask: null,
    sessionStart: null,
    sessionElapsedMs: 0,
    breakDismissed: false,
    finishTask: null,
    finishDur: 60,
    finishHard: 'W sam raz',
    finishKnow: 'Częściowo umiem',

    taskEdit: null,
    editErrors: {},
    teToast: false,

    reasons: ['Plan się opóźnił'],
    rescueEnergy: 'Niska',
    rescueTime: '1 godz. 30 min',
    rescueMoved: false,
    rescueFailed: false,
    rescueSaved: false,
    rescueApplied: false,
    rescueSchedule: null,
    rescueDecisions: null,
    rescueRationale: null,

    energySheet: false,
    energyDraft: 'Normalna',

    kind: 'Sprawdzian',
    subject: 'Biologia',
    subjectsOpen: false,
    goal: 'Ocena co najmniej 4',
    goalsOpen: false,
    nameValue: 'Genetyka — dziedziczenie cech',
    dateValid: true,
    topics: initialTopics,
    topicErr: false,
    difficulty: 'Średni',
    level: 2,
    autoPlan: true,
    deadlineFailed: false,
    deadlineOnlySaved: false,
    onlyDeadlineAsk: false,
    prepSaved: false,
    prepGcal: false,
    bioDeadlineSaved: false,
    bioSessionsSaved: false,
    prepSessions: initialPrepSessions,
    prepDates: buildPrepDates(initialPrepSessions.length),

    sessionOpen: false,
    sessionIdx: 0,
    sessionMessage: '',
    sessionEdits: {},

    // Per-task end-of-session review data (actual minutes spent, how hard it
    // felt, how well it's now known) — keyed by task id so it covers however
    // many tasks are in today's plan, not just a fixed couple of subjects.
    sessionReview: {},
    engChoice: 'keep',
    engDate: weekdayDateLabel(REFERENCE_DAY + 1),
    engStart: '17:30',
    engTimeOpen: false,
    engMessage: '',
    dayHard: 'Trudny',
    dayEnergy: 'Niska',
    adaptive: true,
    daySaved: false,
    summaryFailed: false,
    daySummarized: false,
    unfinishedChoice: '',
    skipReason: '',

    selectedDay: 19,
    planApproved: false,
    dayEnded: false,
    calendarEvents: [],

    examGoals: {},
    customExams: [],
    dismissedGoalPrompts: {},
  };
}

export function usePlanner(defaults, activities, recurringActivities) {
  // Aliased (not `t`) since several functions below use `t` as a local
  // parameter name for a time string, which would otherwise shadow this.
  const { t: translate } = useLang();
  const [state, setState] = useState(() => initialState(defaults, activities));
  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const snapRef = useRef(null);

  // Derived fresh every render (not copied into state) from the student's
  // real bedtime/wake and recurring activities, so a later edit to any of
  // those (e.g. adding a new recurring activity) is picked up immediately —
  // see dayConstraints in plannerLogic.js for what replaced the old fixed
  // school/tennis/sleep schedule nobody could actually configure.
  const constraints = dayConstraints({ wake: defaults?.wake, bedtime: defaults?.bedtime, recurringActivities });

  useEffect(() => {
    setState((s) => ({ ...s, schedule: buildSchedule({ ...s, constraints }) }));
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(patch) {
    setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }

  function def(id, st) {
    const list = (st || state).taskDefs;
    return list.find((t) => t.id === id);
  }
  function ts(id, st) {
    return (st || state).taskState[id] || { status: 'planned' };
  }

  function go(screen) {
    update({ screen });
  }

  function toggleTask(id) {
    update((s) => ({ tasks: { ...s.tasks, [id]: !s.tasks[id] } }));
  }

  // `work`, when given, is a Promise the generating animation waits on
  // before reaching its final step — it holds one step short of "done"
  // (still spinning) for as long as the async call takes, instead of
  // finishing on a fixed timer regardless of whether the work is ready.
  function runGen(labels, target, work) {
    clearInterval(timerRef.current);
    update({ generating: true, genStep: 0, genLabels: labels, genTarget: typeof target === 'function' ? 'plan' : target });
    const last = labels.length - 1;
    const holdAt = work ? last - 1 : last;
    let resolved = !work;
    let result;
    if (work) {
      work.then((r) => { result = r; resolved = true; }).catch(() => { resolved = true; });
    }
    timerRef.current = setInterval(() => {
      setState((s) => {
        if (s.genStep >= holdAt) {
          if (!resolved) return s;
          clearInterval(timerRef.current);
          setTimeout(() => {
            if (target === 'fail') update({ generating: false, rescueFailed: true });
            else if (target === 'prepFail') update({ generating: false, deadlineFailed: true });
            else if (typeof target === 'function') update((cur) => target(result, cur));
            else update({ generating: false, screen: target });
          }, 650);
          return { ...s, genStep: last };
        }
        return { ...s, genStep: s.genStep + 1 };
      });
    }, labels.length > 4 ? 480 : 600);
  }

  // Asks Claude to propose today's order/timing; falls back to the
  // deterministic packer whenever the AI is unavailable or proposes
  // something that fails the same conflict checks manual edits go through.
  function generatePlan() {
    update({ manualMode: false, blockEdit: null });
    const work = requestAIPlan({ ...state, constraints });
    runGen(PLAN_LABELS, (result, s) => ({
      generating: false, screen: 'plan',
      schedule: result ? result.schedule : buildSchedule({ ...s, constraints }),
      planAIRationale: result ? result.rationale : null,
    }), work);
  }

  function deadlineGenerate() {
    update((s) => {
      const sessions = buildPrepSessions(s.topics, s.difficulty);
      return { deadlineFailed: false, prepSessions: sessions, prepDates: buildPrepDates(sessions.length), sessionEdits: {} };
    });
    runGen(PREP_LABELS, 'prep');
  }

  // Asks Claude to decide what stays (maybe shortened) and what gets moved
  // to another day given how little time is actually left; falls back to
  // the deterministic rescue packer whenever the AI is unavailable or
  // proposes something that fails validation (over budget, over duration,
  // or a scheduling conflict).
  function rescueGenerate() {
    update({ rescueFailed: false });
    const availableMinutes = RESCUE_TIME_MINUTES[state.rescueTime] ?? 90;
    const work = requestAIRescue({
      taskDefs: state.taskDefs, tasks: state.tasks, taskState: state.taskState, durOverride: state.durOverride,
      energy: state.rescueEnergy, availableMinutes, reasons: state.reasons, constraints,
      activitiesNote: state.activitiesNote, activitiesSelected: state.activitiesSelected, prioritySubjects: state.prioritySubjects,
      studyTime: state.studyTime,
    });
    runGen(RESCUE_LABELS, (result, s) => {
      const fallback = result || buildRescueSchedule({
        taskDefs: s.taskDefs, tasks: s.tasks, taskState: s.taskState, durOverride: s.durOverride,
        energy: s.rescueEnergy, availableMinutes, constraints,
      });
      return {
        generating: false, screen: 'rescueResult',
        rescueSchedule: fallback.schedule, rescueDecisions: fallback.decisions, rescueRationale: result ? result.rationale : null,
      };
    }, work);
  }

  // ---- home / session lifecycle ----
  function startSession(id) {
    update((s) => {
      const t = { ...s.taskState };
      t[id] = { ...t[id], status: 'in_progress' };
      return { taskState: t, activeTask: id, sessionStart: Date.now(), sessionElapsedMs: 0, breakDismissed: false };
    });
  }
  function togglePause(id) {
    update((s) => {
      const t = { ...s.taskState };
      const pausing = t[id].status !== 'paused';
      t[id] = { ...t[id], status: pausing ? 'paused' : 'in_progress' };
      if (pausing) {
        return { taskState: t, sessionElapsedMs: s.sessionElapsedMs + (Date.now() - s.sessionStart), sessionStart: null };
      }
      return { taskState: t, sessionStart: Date.now() };
    });
  }
  function dismissBreakReminder() {
    update({ breakDismissed: true });
  }
  function openFinish(id, dur) {
    update({ finishTask: id, finishDur: dur, finishHard: 'W sam raz', finishKnow: 'Częściowo umiem' });
  }
  function cancelFinish() {
    update({ finishTask: null });
  }
  function confirmFinish() {
    update((s) => {
      const id = s.finishTask;
      const t = { ...s.taskState };
      t[id] = { status: 'completed', actual: s.finishDur, hard: s.finishHard, know: s.finishKnow };
      return {
        taskState: t, activeTask: null, finishTask: null, sessionStart: null, sessionElapsedMs: 0, breakDismissed: false,
        sessionReview: { ...s.sessionReview, [id]: { minutes: s.finishDur, hard: s.finishHard, know: s.finishKnow } },
      };
    });
  }

  // ---- block edit (plan screen, manual mode) ----
  function openBlockEdit(id) {
    update((s) => ({ blockEdit: { id, start: s.schedule[id].start, dur: s.schedule[id].dur, msg: null } }));
  }
  function moveBlockEdit(patch) {
    update((s) => {
      const b = { ...s.blockEdit, ...patch };
      b.msg = checkBlockConflict(b.id, b.start, b.dur, s.schedule, (id) => def(id, s), constraints);
      return { blockEdit: b };
    });
  }
  function cancelBlockEdit() {
    update({ blockEdit: null });
  }
  function saveBlockEdit() {
    update((s) => {
      const b = s.blockEdit;
      if (!b || b.msg) return {};
      const sched = { ...s.schedule, [b.id]: { start: b.start, dur: b.dur } };
      const dov = { ...s.durOverride, [b.id]: b.dur };
      return { schedule: sched, durOverride: dov, blockEdit: null };
    });
  }
  function removeBlock(id) {
    update((s) => {
      const tsx = { ...s.taskState, [id]: { ...s.taskState[id], status: 'skipped' } };
      const next = { ...s, taskState: tsx, constraints };
      return { taskState: tsx, schedule: buildSchedule(next) };
    });
  }

  // ---- task edit sheet ----
  function openTaskEdit(id) {
    update((s) => {
      const d = def(id, s);
      const dur = (s.durOverride && s.durOverride[id]) || d.dur;
      const start = s.startOverride && s.startOverride[id] != null ? s.startOverride[id] : (s.schedule && s.schedule[id] ? s.schedule[id].start : 930);
      return {
        taskEdit: { id, name: translate(TASK_TEXT_KEY[id]?.title) || d.title, subject: d.subject, dur, start: fmtLocal(start), priority: d.priority, note: d.note || '' },
        editErrors: {}, teToast: false,
      };
    });
  }
  // A blank taskEdit (id: null signals "new" to saveTaskEdit below) — lets
  // the student add any subject/task instead of being stuck with the 3
  // demo ones.
  function openNewTaskEdit() {
    update({
      taskEdit: { id: null, name: '', subject: SUBJECTS[0], dur: 30, start: '19:00', priority: PRIORITIES[1], note: '' },
      editErrors: {}, teToast: false,
    });
  }
  function fmtLocal(mins) {
    const h = Math.floor(mins / 60) % 24, m = mins % 60;
    return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
  }
  function patchTaskEdit(patch) {
    update((s) => ({ taskEdit: { ...s.taskEdit, ...patch }, editErrors: {} }));
  }
  function stepTaskDur(delta) {
    update((s) => ({ taskEdit: { ...s.taskEdit, dur: Math.min(240, Math.max(5, (s.taskEdit.dur || 0) + delta)) }, editErrors: {} }));
  }
  function cancelTaskEdit() {
    update({ taskEdit: null, editErrors: {} });
  }
  function saveTaskEdit() {
    update((s) => {
      const fm = s.taskEdit;
      if (!fm) return {};
      const errs = {};
      if (!fm.name || !fm.name.trim()) errs.name = translate('taskEdit.nameRequired');
      if (!(fm.dur >= 5 && fm.dur <= 240)) errs.dur = translate('taskEdit.durRequired');
      const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((fm.start || '').trim());
      if (!m) errs.start = translate('taskEdit.startRequired');
      if (Object.keys(errs).length) return { editErrors: errs };
      const startMin = (+m[1]) * 60 + (+m[2]);
      const name = fm.name.trim();
      const isNew = fm.id == null;
      const id = isNew ? 'custom-' + Date.now() : fm.id;
      const defs = isNew
        ? s.taskDefs.concat({ id, subject: fm.subject, title: name, dur: fm.dur, priority: fm.priority, note: fm.note, color: '#a58cff', short: fm.subject + ' — ' + name })
        : s.taskDefs.map((t) => {
          if (t.id !== id) return t;
          const renamed = t.title !== name || t.subject !== fm.subject;
          return { ...t, title: name, subject: fm.subject, priority: fm.priority, note: fm.note, short: renamed ? fm.subject + ' — ' + name : t.short };
        });
      const durOverride = { ...s.durOverride, [id]: fm.dur };
      const startOverride = { ...s.startOverride, [id]: startMin };
      const tasks = isNew ? { ...s.tasks, [id]: true } : s.tasks;
      const taskState = isNew ? { ...s.taskState, [id]: { status: 'planned' } } : s.taskState;
      const next = { ...s, taskDefs: defs, durOverride, startOverride, tasks, taskState, constraints };
      return { taskDefs: defs, durOverride, startOverride, tasks, taskState, schedule: buildSchedule(next), taskEdit: null, editErrors: {}, teToast: true };
    });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => update({ teToast: false }), 2200);
  }
  function removeTaskDef(id) {
    update((s) => {
      const defs = s.taskDefs.filter((t) => t.id !== id);
      const tasks = { ...s.tasks };
      delete tasks[id];
      const taskState = { ...s.taskState };
      delete taskState[id];
      const durOverride = { ...s.durOverride };
      delete durOverride[id];
      const startOverride = { ...s.startOverride };
      delete startOverride[id];
      const sessionReview = { ...s.sessionReview };
      delete sessionReview[id];
      const next = { ...s, taskDefs: defs, tasks, taskState, durOverride, startOverride, constraints };
      return { taskDefs: defs, tasks, taskState, durOverride, startOverride, sessionReview, schedule: buildSchedule(next), taskEdit: null };
    });
  }

  // ---- manual mode ----
  function toggleManualMode() {
    update((s) => (s.manualMode
      ? { manualMode: false, manualSnapshot: null, blockEdit: null }
      : { manualMode: true, manualSnapshot: { schedule: s.schedule, taskState: s.taskState, durOverride: s.durOverride } }));
  }
  function regenerateOrCancel() {
    if (!state.manualMode) { generatePlan(); return; }
    update((s) => {
      const snap = s.manualSnapshot || {};
      return { manualMode: false, manualSnapshot: null, blockEdit: null, schedule: snap.schedule, taskState: snap.taskState, durOverride: snap.durOverride || {} };
    });
  }

  function confirmPlan() {
    update((s) => ({ saved: true, planApproved: true, selectedDay: 20, manualMode: false, calendarEvents: s.gcal ? Object.keys(s.schedule || {}) : [] }));
  }
  function goHomeSaved() {
    update({ saved: false, screen: 'home' });
  }

  // ---- energy sheet (home) ----
  function openEnergySheet() {
    update((s) => ({ energySheet: true, energyDraft: s.energy }));
  }
  function cancelEnergySheet() {
    update({ energySheet: false });
  }
  function saveEnergySheet() {
    update((s) => ({ energy: s.energyDraft, energySheet: false }));
  }

  // ---- rescue ----
  function toggleReason(label) {
    update((s) => ({ reasons: s.reasons.includes(label) ? s.reasons.filter((r) => r !== label) : s.reasons.concat(label) }));
  }
  function setRescueTime(label) {
    update({ rescueTime: label, rescueMoved: false });
  }
  function confirmRescue() {
    update((s) => {
      const t = { ...s.taskState };
      Object.keys(s.rescueDecisions || {}).forEach((id) => {
        if (s.rescueDecisions[id] === 'moved') t[id] = { ...t[id], status: 'moved' };
      });
      const schedule = s.rescueSchedule || {};
      return {
        rescueSaved: true, rescueApplied: true, selectedDay: 20, planApproved: true,
        taskState: t, schedule, calendarEvents: s.gcal ? Object.keys(schedule) : s.calendarEvents,
      };
    });
  }
  function toMinutesLocal(t) { const p = t.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function goHomeRescued() {
    update({ rescueSaved: false, screen: 'home' });
  }

  // ---- deadline form ----
  function setField(key, value) {
    update({ [key]: value });
  }
  function addTopic() {
    update((s) => ({ topics: s.topics.concat('Nowy temat'), topicErr: false }));
  }
  function removeTopic(i) {
    update((s) => ({ topics: s.topics.filter((_, j) => j !== i), topicErr: false }));
  }
  function deadlineSubmit(valid) {
    if (!valid) { update({ topicErr: true }); return; }
    if (!state.autoPlan) {
      update({ deadlineOnlySaved: true, bioDeadlineSaved: true, bioSessionsSaved: false });
      return;
    }
    deadlineGenerate();
  }
  function goHomeDeadline() {
    update({ deadlineOnlySaved: false, prepSaved: false, screen: 'home' });
  }

  // ---- prep plan ----
  function openSession(i) {
    update((s) => {
      const d = s.sessionEdits[i] || {};
      snapRef.current = { i, date: d.date || s.prepDates[i], time: d.time || s.prepSessions[i].time, dur: d.dur || s.prepSessions[i].dur };
      return { sessionOpen: true, sessionIdx: i, sessionMessage: '' };
    });
  }
  function applySession(patch) {
    update((s) => {
      const e = { ...s.sessionEdits, [s.sessionIdx]: { ...s.sessionEdits[s.sessionIdx], ...patch } };
      return { sessionEdits: e, sessionMessage: '' };
    });
  }
  function pickSessionDate(d) {
    if (d === 'Sobota, 1 sierpnia') { update({ sessionMessage: translate('msg.sessionBeforeExam') }); return; }
    applySession({ date: d });
  }
  function currentDur(i) {
    const d = state.sessionEdits[i] || {};
    return d.dur || state.prepSessions[i].dur;
  }
  function rangeLocal(start, durLabel) {
    const s = toMinutesLocal(start);
    return start + '–' + fmtLocal(s + parseInt(durLabel, 10));
  }
  function pickSessionTime(t) {
    if (t === '18:15') { update({ sessionMessage: translate('block.conflictTennis') }); return; }
    if (t === '22:15') { update({ sessionMessage: translate('msg.sleepConflictShort') }); return; }
    applySession({ start: t, time: rangeLocal(t, currentDur(state.sessionIdx)) });
  }
  function pickSessionDur(d) {
    const i = state.sessionIdx;
    const e = state.sessionEdits[i] || {};
    const start = e.start || (e.time || state.prepSessions[i].time).split('–')[0];
    applySession({ dur: d, start, time: rangeLocal(start, d) });
  }
  function cancelSession() {
    const snap = snapRef.current;
    update((s) => {
      const e = { ...s.sessionEdits };
      if (snap) e[snap.i] = { date: snap.date, time: snap.time, dur: snap.dur, start: snap.time.split('–')[0] };
      return { sessionEdits: e, sessionOpen: false, sessionMessage: '' };
    });
  }
  function saveSession() {
    if (state.sessionMessage) return;
    update({ sessionOpen: false, sessionMessage: '' });
  }
  function togglePrepGcal() {
    update((s) => ({ prepGcal: !s.prepGcal }));
  }
  function askOnlyDeadline() { update({ onlyDeadlineAsk: true }); }
  function backToPrep() { update({ onlyDeadlineAsk: false }); }
  function saveOnlyDeadline() {
    update({ onlyDeadlineAsk: false, bioDeadlineSaved: true, bioSessionsSaved: false, screen: 'deadline', deadlineOnlySaved: true });
  }
  function confirmPrep() {
    update({ prepSaved: true, bioDeadlineSaved: true, bioSessionsSaved: true });
  }

  // ---- day summary ----
  function finishDay() {
    update({ summaryFailed: false, daySaved: true, daySummarized: true });
  }
  function goHomeSummarized() {
    update({ daySaved: false, screen: 'home' });
  }
  function saveLater() {
    update({ screen: 'home' });
  }
  function adjustSessionMinutes(id, delta) {
    update((s) => ({
      sessionReview: { ...s.sessionReview, [id]: { ...s.sessionReview[id], minutes: Math.max(5, (s.sessionReview[id]?.minutes || 0) + delta) } },
    }));
  }
  function setSessionField(id, field, value) {
    update((s) => ({ sessionReview: { ...s.sessionReview, [id]: { ...s.sessionReview[id], [field]: value } } }));
  }
  function keepEngTomorrow() {
    update({ engChoice: 'keep', engDate: weekdayDateLabel(REFERENCE_DAY + 1), engStart: '17:30' });
  }
  function openEngTime() {
    update((s) => {
      snapRef.current = { engDate: s.engDate, engStart: s.engStart };
      return { engTimeOpen: true, engChoice: 'change', engMessage: '' };
    });
  }
  function pickEngTime(t) {
    if (t === '18:15') { update({ engMessage: translate('msg.engEventConflict') }); return; }
    if (t === '22:45') { update({ engMessage: translate('msg.sleepConflictShort') }); return; }
    update({ engStart: t, engMessage: '' });
  }
  function cancelEngTime() {
    update({ engTimeOpen: false, engMessage: '', ...(snapRef.current || {}) });
  }
  function saveEngTime() {
    update({ engTimeOpen: false, engMessage: '' });
  }
  function applyAdaptive() { update({ adaptive: true }); }
  function declineAdaptive() { update({ adaptive: false }); }

  // ---- goals (per-exam target grade, importance, and planned study time) ----
  const DEFAULT_EXAM_GOAL = { grade: GOALS[2], studyMinutes: 120, importance: 'Średni', answered: false };
  function setExamGrade(examId, grade) {
    update((s) => ({ examGoals: { ...s.examGoals, [examId]: { ...(s.examGoals[examId] || DEFAULT_EXAM_GOAL), grade, answered: true } } }));
  }
  function setExamImportance(examId, importance) {
    update((s) => ({ examGoals: { ...s.examGoals, [examId]: { ...(s.examGoals[examId] || DEFAULT_EXAM_GOAL), importance, answered: true } } }));
  }
  function adjustExamStudyMinutes(examId, delta) {
    update((s) => {
      const cur = s.examGoals[examId] || DEFAULT_EXAM_GOAL;
      return { examGoals: { ...s.examGoals, [examId]: { ...cur, studyMinutes: Math.max(15, cur.studyMinutes + delta) } } };
    });
  }
  function setExamStudyMinutes(examId, minutes) {
    update((s) => {
      const cur = s.examGoals[examId] || DEFAULT_EXAM_GOAL;
      return { examGoals: { ...s.examGoals, [examId]: { ...cur, studyMinutes: Math.max(15, minutes) } } };
    });
  }
  function addCustomExam({ subject, title, daysUntil, grade, importance, studyMinutes, color }) {
    const id = 'custom-' + Date.now();
    const exam = { id, subject, title, color: color || '#8fbaff', day: REFERENCE_DAY + daysUntil };
    update((s) => ({
      customExams: s.customExams.concat(exam),
      examGoals: { ...s.examGoals, [id]: { grade, importance, studyMinutes, answered: true } },
    }));
    return id;
  }
  function removeCustomExam(id) {
    update((s) => {
      const examGoals = { ...s.examGoals };
      delete examGoals[id];
      return { customExams: s.customExams.filter((e) => e.id !== id), examGoals };
    });
  }
  function dismissGoalPrompt(examId) {
    update((s) => ({ dismissedGoalPrompts: { ...s.dismissedGoalPrompts, [examId]: true } }));
  }
  function answerGoalPrompt(examId, { grade, importance }) {
    update((s) => ({
      examGoals: { ...s.examGoals, [examId]: { ...(s.examGoals[examId] || DEFAULT_EXAM_GOAL), grade, importance, answered: true } },
    }));
  }
  function nextGoalPrompt() {
    const s = state;
    return upcomingExams(s)
      .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7 && !s.examGoals[e.id]?.answered && !s.dismissedGoalPrompts[e.id])
      .sort((a, b) => a.daysUntil - b.daysUntil)[0] || null;
  }

  return {
    state, constraints, update, def, ts, go,
    toggleTask, generatePlan, deadlineGenerate, rescueGenerate,
    startSession, togglePause, dismissBreakReminder, openFinish, cancelFinish, confirmFinish,
    openBlockEdit, moveBlockEdit, cancelBlockEdit, saveBlockEdit, removeBlock,
    openTaskEdit, openNewTaskEdit, patchTaskEdit, stepTaskDur, cancelTaskEdit, saveTaskEdit, removeTaskDef,
    toggleManualMode, regenerateOrCancel, confirmPlan, goHomeSaved,
    openEnergySheet, cancelEnergySheet, saveEnergySheet,
    toggleReason, setRescueTime, confirmRescue, goHomeRescued,
    setField, addTopic, removeTopic, deadlineSubmit, goHomeDeadline,
    openSession, pickSessionDate, pickSessionTime, pickSessionDur, cancelSession, saveSession,
    togglePrepGcal, askOnlyDeadline, backToPrep, saveOnlyDeadline, confirmPrep,
    finishDay, goHomeSummarized, saveLater, adjustSessionMinutes, setSessionField,
    keepEngTomorrow, openEngTime, pickEngTime, cancelEngTime, saveEngTime,
    applyAdaptive, declineAdaptive,
    setExamGrade, setExamImportance, adjustExamStudyMinutes, setExamStudyMinutes,
    addCustomExam, removeCustomExam, dismissGoalPrompt, answerGoalPrompt, nextGoalPrompt,
    computeActiveIds,
  };
}
