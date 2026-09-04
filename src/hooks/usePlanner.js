import { useEffect, useRef, useState } from 'react';
import {
  TASK_DEFS, PLAN_LABELS, PREP_LABELS, RESCUE_LABELS, SESSIONS, SESSION_DATES, GOALS, REFERENCE_DAY,
} from '../lib/plannerData';
import { buildSchedule, activeIds as computeActiveIds, checkBlockConflict, upcomingExams } from '../lib/plannerLogic';

function initialState() {
  return {
    screen: 'home',
    generating: false,
    genStep: 0,
    genLabels: PLAN_LABELS,
    genTarget: 'plan',

    taskDefs: TASK_DEFS,
    tasks: [true, true, false],
    energy: 'Normalna',
    pref: 'Wolny wieczór',
    gcal: false,
    saved: false,

    taskState: { math: { status: 'planned' }, bio: { status: 'planned' }, eng: { status: 'planned' } },
    schedule: null,
    durOverride: {},
    startOverride: {},
    manualMode: false,
    manualSnapshot: null,
    blockEdit: null,
    activeTask: null,
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
    editing: false,
    editMessage: '',
    bioMin: 25,
    mathSlot: '19:30–20:30',
    engToday: false,

    energySheet: false,
    energyDraft: 'Normalna',

    kind: 'Sprawdzian',
    subject: 'Biologia',
    subjectsOpen: false,
    goal: 'Ocena co najmniej 4',
    goalsOpen: false,
    nameValue: 'Genetyka — dziedziczenie cech',
    dateValid: true,
    topics: ['Prawa Mendla', 'Krzyżówki genetyczne', 'Dziedziczenie grup krwi'],
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

    sessionOpen: false,
    sessionIdx: 0,
    sessionMessage: '',
    sessionEdits: {},

    bioMinutes: 30,
    mathMinutes: 70,
    bioHard: 'W sam raz',
    mathHard: 'Trudna',
    bioKnow: 'Dobrze umiem',
    mathKnow: 'Częściowo umiem',
    engChoice: 'keep',
    engDate: 'Wtorek, 21 lipca',
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

    examGoals: {
      math: { grade: 'Ocena co najmniej 4', studyMinutes: 180, importance: 'Wysoki', answered: false },
    },
    customExams: [],
    dismissedGoalPrompts: {},
  };
}

export function usePlanner() {
  const [state, setState] = useState(initialState);
  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const snapRef = useRef(null);

  useEffect(() => {
    setState((s) => ({ ...s, schedule: buildSchedule(s) }));
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

  function toggleTask(i) {
    update((s) => {
      const t = s.tasks.slice();
      t[i] = !t[i];
      return { tasks: t };
    });
  }

  function runGen(labels, target) {
    clearInterval(timerRef.current);
    update({ generating: true, genStep: 0, genLabels: labels, genTarget: target });
    const last = labels.length - 1;
    timerRef.current = setInterval(() => {
      setState((s) => {
        if (s.genStep >= last) {
          clearInterval(timerRef.current);
          setTimeout(() => {
            if (target === 'fail') update({ generating: false, rescueFailed: true });
            else if (target === 'prepFail') update({ generating: false, deadlineFailed: true });
            else update({ generating: false, screen: target });
          }, 650);
          return { ...s, genStep: last };
        }
        return { ...s, genStep: s.genStep + 1 };
      });
    }, labels.length > 4 ? 480 : 600);
  }

  function generatePlan() {
    update((s) => ({ schedule: buildSchedule(s), manualMode: false, blockEdit: null }));
    runGen(PLAN_LABELS, 'plan');
  }

  function deadlineGenerate() {
    update({ deadlineFailed: false });
    runGen(PREP_LABELS, 'prep');
  }

  function rescueGenerate() {
    update({ rescueFailed: false });
    runGen(RESCUE_LABELS, 'rescueResult');
  }

  // ---- home / session lifecycle ----
  function startSession(id) {
    update((s) => {
      const t = { ...s.taskState };
      t[id] = { ...t[id], status: 'in_progress' };
      return { taskState: t, activeTask: id };
    });
  }
  function togglePause(id) {
    update((s) => {
      const t = { ...s.taskState };
      t[id] = { ...t[id], status: t[id].status === 'paused' ? 'in_progress' : 'paused' };
      return { taskState: t };
    });
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
      const patch = { taskState: t, activeTask: null, finishTask: null };
      if (id === 'bio') Object.assign(patch, { bioMinutes: s.finishDur, bioHard: s.finishHard, bioKnow: s.finishKnow });
      if (id === 'math') Object.assign(patch, { mathMinutes: s.finishDur, mathHard: s.finishHard, mathKnow: s.finishKnow });
      return patch;
    });
  }

  // ---- block edit (plan screen, manual mode) ----
  function openBlockEdit(id) {
    update((s) => ({ blockEdit: { id, start: s.schedule[id].start, dur: s.schedule[id].dur, msg: '' } }));
  }
  function moveBlockEdit(patch) {
    update((s) => {
      const b = { ...s.blockEdit, ...patch };
      b.msg = checkBlockConflict(b.id, b.start, b.dur, s.schedule, (id) => def(id, s));
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
      const next = { ...s, taskState: tsx };
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
        taskEdit: { id, name: d.title, subject: d.subject, dur, start: fmtLocal(start), priority: d.priority, note: d.note || '' },
        editErrors: {}, teToast: false,
      };
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
      if (!fm.name || !fm.name.trim()) errs.name = 'Podaj nazwę zadania.';
      if (!(fm.dur >= 5 && fm.dur <= 240)) errs.dur = 'Czas nauki może wynosić od 5 do 240 minut.';
      const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((fm.start || '').trim());
      if (!m) errs.start = 'Podaj godzinę w formacie 20:00.';
      if (Object.keys(errs).length) return { editErrors: errs };
      const startMin = (+m[1]) * 60 + (+m[2]);
      const name = fm.name.trim();
      const defs = s.taskDefs.map((t) => {
        if (t.id !== fm.id) return t;
        const renamed = t.title !== name || t.subject !== fm.subject;
        return { ...t, title: name, subject: fm.subject, priority: fm.priority, note: fm.note, short: renamed ? fm.subject + ' — ' + name : t.short };
      });
      const durOverride = { ...s.durOverride, [fm.id]: fm.dur };
      const startOverride = { ...s.startOverride, [fm.id]: startMin };
      const next = { ...s, taskDefs: defs, durOverride, startOverride };
      return { taskDefs: defs, durOverride, startOverride, schedule: buildSchedule(next), taskEdit: null, editErrors: {}, teToast: true };
    });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => update({ teToast: false }), 2200);
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
  function pickMath(slot) {
    if (slot === '17:30–18:30') { update({ editMessage: 'Ten czas koliduje z tenisem 18:00–19:00. Wybierz inną godzinę.' }); return; }
    if (slot === '21:45–22:45') { update({ editMessage: 'Ta zmiana skróciłaby sen. Wybierz wcześniejszą godzinę lub przenieś zadanie.' }); return; }
    update({ mathSlot: slot, editMessage: '' });
  }
  function setBioMin(val) {
    if (val === 45) { update({ editMessage: 'Blok 45 min nie zmieści się przed dojazdem na tenis. Wybierz krótszy blok.' }); return; }
    update({ bioMin: val, editMessage: '' });
  }
  function returnEnglish() {
    update((s) => {
      if (s.engToday) return { engToday: false, editMessage: '' };
      const free = s.rescueTime === '2 godz.';
      if (!free) return { editMessage: 'Dziś nie ma wolnego bloku 30 min przed snem. Zwiększ dostępny czas, aby wrócić z angielskim na dzisiaj.' };
      return { engToday: true, editMessage: '' };
    });
  }
  function openRescueEdit() {
    update((s) => {
      snapRef.current = { bioMin: s.bioMin, mathSlot: s.mathSlot, engToday: s.engToday };
      return { editing: true, editMessage: '' };
    });
  }
  function cancelRescueEdit() {
    update({ editing: false, editMessage: '', ...(snapRef.current || {}) });
  }
  function saveRescueEdit() {
    update({ editing: false, editMessage: '' });
  }
  function confirmRescue() {
    update((s) => {
      const t = { ...s.taskState, eng: { ...s.taskState.eng, status: s.engToday ? 'planned' : 'moved' } };
      const bStart = toMinutesLocal((s.mathSlot || '19:30–20:30').split('–')[0]);
      const schedule = { bio: { start: 1020, dur: s.bioMin }, math: { start: bStart, dur: 60 } };
      if (s.engToday) schedule.eng = { start: 1260, dur: 30 };
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
      snapRef.current = { i, date: d.date || SESSION_DATES[i], time: d.time || SESSIONS[i].time, dur: d.dur || SESSIONS[i].dur };
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
    if (d === 'Sobota, 1 sierpnia') { update({ sessionMessage: 'Sesja przygotowawcza musi odbyć się przed sprawdzianem.' }); return; }
    applySession({ date: d });
  }
  function currentDur(i) {
    const d = state.sessionEdits[i] || {};
    return d.dur || SESSIONS[i].dur;
  }
  function rangeLocal(start, durLabel) {
    const s = toMinutesLocal(start);
    return start + '–' + fmtLocal(s + parseInt(durLabel, 10));
  }
  function pickSessionTime(t) {
    if (t === '18:15') { update({ sessionMessage: 'Ten czas koliduje z tenisem 18:00–19:00. Wybierz inną godzinę.' }); return; }
    if (t === '22:15') { update({ sessionMessage: 'Ta zmiana skróciłaby sen. Wybierz wcześniejszą godzinę.' }); return; }
    applySession({ start: t, time: rangeLocal(t, currentDur(state.sessionIdx)) });
  }
  function pickSessionDur(d) {
    const i = state.sessionIdx;
    const e = state.sessionEdits[i] || {};
    const start = e.start || (e.time || SESSIONS[i].time).split('–')[0];
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
  function bioAdjust(delta) {
    update((s) => ({ bioMinutes: Math.max(5, s.bioMinutes + delta) }));
  }
  function mathAdjust(delta) {
    update((s) => ({ mathMinutes: Math.max(5, s.mathMinutes + delta) }));
  }
  function keepEngTomorrow() {
    update({ engChoice: 'keep', engDate: 'Wtorek, 21 lipca', engStart: '17:30' });
  }
  function openEngTime() {
    update((s) => {
      snapRef.current = { engDate: s.engDate, engStart: s.engStart };
      return { engTimeOpen: true, engChoice: 'change', engMessage: '' };
    });
  }
  function pickEngTime(t) {
    if (t === '18:15') { update({ engMessage: 'Ten czas koliduje z istniejącym wydarzeniem. Wybierz inną godzinę.' }); return; }
    if (t === '22:45') { update({ engMessage: 'Ta zmiana skróciłaby sen. Wybierz wcześniejszą godzinę.' }); return; }
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
  function nextGoalPrompt(st) {
    const s = st || state;
    return upcomingExams(s)
      .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7 && !s.examGoals[e.id]?.answered && !s.dismissedGoalPrompts[e.id])
      .sort((a, b) => a.daysUntil - b.daysUntil)[0] || null;
  }

  return {
    state, update, def, ts, go,
    toggleTask, generatePlan, deadlineGenerate, rescueGenerate,
    startSession, togglePause, openFinish, cancelFinish, confirmFinish,
    openBlockEdit, moveBlockEdit, cancelBlockEdit, saveBlockEdit, removeBlock,
    openTaskEdit, patchTaskEdit, stepTaskDur, cancelTaskEdit, saveTaskEdit,
    toggleManualMode, regenerateOrCancel, confirmPlan, goHomeSaved,
    openEnergySheet, cancelEnergySheet, saveEnergySheet,
    toggleReason, setRescueTime, pickMath, setBioMin, returnEnglish,
    openRescueEdit, cancelRescueEdit, saveRescueEdit, confirmRescue, goHomeRescued,
    setField, addTopic, removeTopic, deadlineSubmit, goHomeDeadline,
    openSession, pickSessionDate, pickSessionTime, pickSessionDur, cancelSession, saveSession,
    togglePrepGcal, askOnlyDeadline, backToPrep, saveOnlyDeadline, confirmPrep,
    finishDay, goHomeSummarized, saveLater, bioAdjust, mathAdjust,
    keepEngTomorrow, openEngTime, pickEngTime, cancelEngTime, saveEngTime,
    applyAdaptive, declineAdaptive,
    setExamGrade, setExamImportance, adjustExamStudyMinutes,
    addCustomExam, removeCustomExam, dismissGoalPrompt, answerGoalPrompt, nextGoalPrompt,
    computeActiveIds,
  };
}
