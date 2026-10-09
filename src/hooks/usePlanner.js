import { useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/useLang';
import { TASK_TEXT_KEY, VALUE_KEY } from '../lib/i18n';
import {
  PLAN_LABELS, PREP_LABELS, RESCUE_LABELS, GOALS, REFERENCE_DAY, NUM_TODAY, SUBJECTS, PRIORITIES, RESCUE_TIME_MINUTES, realDateForNum, LEVELS,
} from '../lib/plannerData';
import { buildSchedule, buildRescueSchedule, activeIds as computeActiveIds, checkBlockConflict, upcomingExams, buildPrepSessions, buildPrepDates, buildPrepDayNums, weekdayDateLabel, dayConstraints, daysUntilFromISODate, durOf, taskKey, dayInfo, prepDayLabel, isTaskOn, taskDueOnDay, daySessionBreakdown, localDateKey, sessionDur, sessionClock, dayOpenTasks, timeStrToMinutes, roundedNowMinutes, planFor, draftFor, workingPlan, plannedElsewhere, timedTodoBlocks } from '../lib/plannerLogic';
import { requestAIPlan } from '../lib/aiPlan';
import { planningContextForAI, taskForAI, examsForAI, busyOnDay, weeklyActivitiesForAI, dateOf } from '../lib/aiContext';
import { aboutMeForAI } from '../lib/aboutMe';
import { requestAIPrep, toPrepCards } from '../lib/aiPrep';
import { requestAIRescue } from '../lib/aiRescue';
import { WIN_EVENT } from '../lib/premium';

// The only slice of usePlanner's state that survives a reload / syncs across
// devices (via KEYS.plannerData in store.js) — everything else here is
// either a fixed default or a form/modal that should always start fresh.
// Deliberately excludes in-progress-form fields (deadline form, rescue form,
// day-summary form, sheet/edit-panel state): those are meant to reset, not
// resume, on reload.
const DURABLE_KEYS = [
  'taskDefs', 'tasks', 'taskState', 'plans', 'drafts', 'durOverride', 'startOverride',
  'customExams', 'examGoals', 'examSessions', 'dismissedGoalPrompts', 'sessionReview',
  'daySummaries', 'autoSummaryDate',
  // The running study session, so it keeps counting through a reload.
  'activeTask', 'sessionStart', 'sessionElapsedMs', 'sessionBeganAt', 'sessionExtraMin', 'breakDismissed',
];

// The wheel date picker (see WheelDatePicker.jsx) always shows a concrete
// dialed-in date, unlike the native <input type="date"> it replaced, which
// could sit visually empty until touched — so the Deadline form needs a
// real starting value instead of ''. 11 days out matches the assumption
// deadlineGenerate() already falls back to when no date has been set.
function defaultExamDateISO() {
  const d = new Date();
  d.setDate(d.getDate() + 11);
  return localDateKey(d);
}

// Removes task definitions and their on/off and status entries.
function withoutTasks(s, ids) {
  const drop = new Set(ids);
  const tasks = { ...s.tasks };
  const taskState = { ...s.taskState };
  ids.forEach((id) => { delete tasks[id]; delete taskState[id]; });
  return { taskDefs: s.taskDefs.filter((d) => !drop.has(d.id)), tasks, taskState };
}

export function initialState(defaults, activities, persisted) {
  // Empty rather than a fixed demo topic list — buildPrepSessions falls back
  // to a generic placeholder topic on its own when given none, and this is
  // overwritten for real once deadlineGenerate() runs off the student's own
  // topics anyway (see the Deadline screen).
  const initialPrepSessions = buildPrepSessions([], 'Średni');
  const base = {
    screen: 'home',
    generating: false,
    genStep: 0,
    genLabels: PLAN_LABELS,
    genTarget: 'plan',

    taskDefs: [],
    tasks: {},
    // Which day the Planner screen is building a schedule for — true (the
    // default) is NUM_TODAY ("today"), so opening the Planner from
    // anywhere other than the "Plan tomorrow" quick actions (Home,
    // Calendar — see their onClick handlers, which set this false before
    // navigating) lands on today's plan rather than requiring an extra tap
    // to switch off of tomorrow. Not persisted: it's a per-visit choice on
    // the Planner screen, not something that should stick after a reload.
    planToday: true,
    // Per-plan tweaks to the free-time window (see the wake/bedtime wheel
    // pickers on the Planner screen) — null means "use the Profile
    // default". Not persisted, same as planToday above.
    wakeOverride: null,
    bedtimeOverride: null,
    // The AI's short explanation of the exam study plan on the Prep screen.
    prepRationale: null,
    // "Extra note for the planner" — sent to the AI with this plan only.
    planNote: '',
    energy: defaults?.energy || 'Normalna',
    pref: defaults?.pref || 'Wolny wieczór',
    // What the student does (onboarding / Profile "I am") — passed along to
    // the AI plan/rescue requests. Their own note travels in context.aboutMe
    // (see aboutMeForAI). Kept in sync with Profile by the effect below.
    activitiesSelected: activities?.selected || [],
    prioritySubjects: defaults?.prioritySubjects || [],
    // "When do you study best?" from onboarding — a preference for the AI
    // plan/rescue requests (see requestAIPlan/requestAIRescue below), not a
    // hard constraint like bedtime/wake (see dayConstraints in
    // plannerLogic.js). Previously only reached the chat assistant.
    studyTime: defaults?.studyTime || 'Wieczorem',
    saved: false,

    taskState: {},
    // Approved plans by day-num ({ [taskId]: { start, dur } } each) — today's
    // and tomorrow's side by side — and plans built but not approved yet.
    plans: {},
    drafts: {},
    planAIRationale: null,
    durOverride: {},
    startOverride: {},
    manualMode: false,
    manualSnapshot: null,
    blockEdit: null,
    activeTask: null,
    sessionStart: null,
    sessionElapsedMs: 0,
    // When the running session was first started (sessionStart restarts on
    // every resume) and the minutes added to it with "+1 min".
    sessionBeganAt: null,
    sessionExtraMin: 0,
    focusDone: null,
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
    subject: 'Matematyka',
    subjectsOpen: false,
    goal: 'Ocena co najmniej 4',
    goalsOpen: false,
    nameValue: '',
    examDate: defaultExamDateISO(),
    examTime: '09:00',
    topics: [],
    topicErr: false,
    difficulty: 'Średni',
    level: 2,
    autoPlan: true,
    deadlineFailed: false,
    deadlineOnlySaved: false,
    onlyDeadlineAsk: false,
    prepSaved: false,
    prepSessions: initialPrepSessions,
    prepDates: buildPrepDates(initialPrepSessions.length),
    prepDayNums: buildPrepDayNums(initialPrepSessions.length),

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
    // Saved results of each summarized day, keyed by local YYYY-MM-DD, so a
    // day is summarized once and Home/past days can show what happened.
    daySummaries: {},
    // Local date the summary last auto-opened, so it pops up once per day.
    autoSummaryDate: null,
    // Per-task "tomorrow" | "drop" picks for unfinished sessions on the
    // summary form (default "tomorrow"); applied by finishDay.
    unfinishedChoices: {},
    skipReason: '',

    dayEnded: false,

    examGoals: {},
    customExams: [],
    examSessions: {},
    dismissedGoalPrompts: {},
  };
  if (persisted) {
    DURABLE_KEYS.forEach((k) => {
      if (persisted[k] !== undefined) base[k] = persisted[k];
    });
  }
  // Exams saved before v: 2 sit one day late (they were stored as tomorrow +
  // days until the exam); move each back once. Marked per exam, so an old
  // copy synced from another device is corrected too, never twice.
  if (base.customExams.some((e) => e.v !== 2)) {
    base.customExams = base.customExams.map((e) => (e.v === 2 ? e : { ...e, day: e.day - 1, v: 2 }));
  }
  // Plans used to share one slot (schedule + planApproved + selectedDay);
  // an approved one moves to its own day. An unapproved one was only ever
  // an automatic preview, so there's nothing to keep.
  if (!persisted || persisted.plans === undefined) {
    base.plans = {};
    if (persisted && persisted.planApproved && persisted.schedule && Number.isFinite(persisted.selectedDay)) {
      base.plans[persisted.selectedDay] = persisted.schedule;
    }
  }
  // A plan (or draft) whose day has passed is retired, so its sessions stop
  // showing up as today's; tomorrow's becomes today's on its own.
  const upcoming = (map) => Object.fromEntries(Object.entries(map || {}).filter(([day, sched]) => +day >= NUM_TODAY && sched));
  base.plans = upcoming(base.plans);
  base.drafts = upcoming(base.drafts);
  // A review session the AI suggested exists only while its draft does.
  const orphans = base.taskDefs.filter((d) => d.pendingDraft && !(base.drafts[d.day] && base.drafts[d.day][d.id])).map((d) => d.id);
  if (orphans.length) Object.assign(base, withoutTasks(base, orphans));
  // A session still running from last time reopens on the focus screen; one
  // whose task is gone or no longer in progress is dropped.
  if (base.activeTask) {
    const d = base.taskDefs.find((x) => x.id === base.activeTask);
    const st = d && base.taskState[taskKey(d, NUM_TODAY)];
    if (st && ['in_progress', 'paused'].includes(st.status)) base.screen = 'focus';
    else Object.assign(base, { activeTask: null, sessionStart: null, sessionElapsedMs: 0, sessionBeganAt: null, sessionExtraMin: 0 });
  }
  return base;
}

export function usePlanner(defaults, activities, recurringActivities, persisted, setPersisted, recordStudyDay) {
  // Aliased (not `t`) since several functions below use `t` as a local
  // parameter name for a time string, which would otherwise shadow this.
  const { t: translate } = useLang();
  const [state, setState] = useState(() => initialState(defaults, activities, persisted));
  const timerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const snapRef = useRef(null);

  // Mirrors the durable slice of state (see DURABLE_KEYS above) out to
  // localStorage/cloud sync on every change, so a custom task, a schedule
  // edit, or a saved exam survives a reload instead of living only in this
  // in-memory useState.
  useEffect(() => {
    if (!setPersisted) return;
    setPersisted({
      taskDefs: state.taskDefs, tasks: state.tasks, taskState: state.taskState, plans: state.plans, drafts: state.drafts,
      durOverride: state.durOverride, startOverride: state.startOverride,
      customExams: state.customExams, examGoals: state.examGoals, examSessions: state.examSessions, dismissedGoalPrompts: state.dismissedGoalPrompts,
      sessionReview: state.sessionReview,
      daySummaries: state.daySummaries, autoSummaryDate: state.autoSummaryDate,
      activeTask: state.activeTask, sessionStart: state.sessionStart, sessionElapsedMs: state.sessionElapsedMs,
      sessionBeganAt: state.sessionBeganAt, sessionExtraMin: state.sessionExtraMin, breakDismissed: state.breakDismissed,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.taskDefs, state.tasks, state.taskState, state.plans, state.drafts, state.durOverride, state.startOverride,
    state.customExams, state.examGoals, state.examSessions, state.dismissedGoalPrompts, state.sessionReview,
    state.daySummaries, state.autoSummaryDate,
    state.activeTask, state.sessionStart, state.sessionElapsedMs, state.sessionBeganAt, state.sessionExtraMin, state.breakDismissed,
  ]);

  // Which real day the Planner/Plan screens are working with — toggled via
  // state.planToday (see the "Dziś / Jutro" switch on the Planner screen).
  const planDayNum = state.planToday ? NUM_TODAY : REFERENCE_DAY;

  // Derived fresh every render (not copied into state) from the student's
  // real bedtime/wake and recurring activities, so a later edit to any of
  // those (e.g. adding a new recurring activity) is picked up immediately —
  // see dayConstraints in plannerLogic.js for what replaced the old fixed
  // school/tennis/sleep schedule nobody could actually configure.
  // state.wakeOverride/bedtimeOverride (set via the wake/bedtime wheel
  // pickers on the Planner screen, see "When do you have time?") tweak the
  // free-time window for this plan only, without touching the student's
  // saved Profile defaults — not persisted, so they reset next visit like
  // energy/pref already do.
  // Weekly activities and to-dos with a set time are both fixed blocks.
  const constraints = dayConstraints({
    wake: state.wakeOverride || defaults?.wake, bedtime: state.bedtimeOverride || defaults?.bedtime,
    recurringActivities, dayNum: planDayNum, extraBlocks: timedTodoBlocks(state.taskDefs, planDayNum),
  });
  // The same limits for any given day (a task's own day, today's rescue).
  function constraintsFor(dayNum) {
    return dayConstraints({
      wake: state.wakeOverride || defaults?.wake, bedtime: state.bedtimeOverride || defaults?.bedtime,
      recurringActivities, dayNum, extraBlocks: timedTodoBlocks(state.taskDefs, dayNum),
    });
  }
  // Today's limits from right now: sessions planned or rescued for today
  // can't start in the past.
  function todayFromNow() {
    const c = constraintsFor(NUM_TODAY);
    // …nor on top of a session still running.
    let busyUntil = 0;
    if (state.activeTask) {
      const end = new Date(sessionClock(state).endsAt);
      busyUntil = Math.ceil((end.getHours() * 60 + end.getMinutes()) / 5) * 5;
    }
    return { ...c, wakeMinutes: Math.max(c.wakeMinutes, roundedNowMinutes(), busyUntil) };
  }

  // Profile edits reach the next AI request right away, not only after a
  // reload (these used to be read once, when the planner started).
  const profileKey = JSON.stringify([defaults?.studyTime, defaults?.prioritySubjects, activities?.selected]);
  useEffect(() => {
    update({
      studyTime: defaults?.studyTime || 'Wieczorem',
      prioritySubjects: defaults?.prioritySubjects || [],
      activitiesSelected: activities?.selected || [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey]);
  // "What Pulgo knows about you" (Profile), sent with every AI request.
  const aboutMe = aboutMeForAI({ activities, defaults, energy: state.energy, recurringActivities });

  useEffect(() => () => clearInterval(timerRef.current), []);

  // A draft waiting for review is re-laid out if a change to the real
  // constraints — a recurring activity added from the quick-add sheet or the
  // chat, bedtime/wake changed in Profile — now puts one of its sessions on
  // top of something. Approved plans are never moved by themselves.
  const timedTodos = state.taskDefs.filter((d) => d.category === 'personal' && d.at).map((d) => [d.id, d.at, d.dur, d.day, d.repeatDays]);
  const recurringKey = JSON.stringify([recurringActivities, timedTodos, defaults?.wake, defaults?.bedtime, state.wakeOverride, state.bedtimeOverride]);
  const prevRecurringKeyRef = useRef(recurringKey);
  useEffect(() => {
    if (recurringKey === prevRecurringKeyRef.current) return;
    prevRecurringKeyRef.current = recurringKey;
    setState((s) => {
      if (s.manualMode) return s;
      let changed = false;
      const drafts = { ...s.drafts };
      Object.keys(drafts).forEach((day) => {
        const c = constraintsFor(+day);
        const sched = drafts[day] || {};
        const clash = Object.keys(sched).some((id) => checkBlockConflict(id, sched[id].start, sched[id].dur, {}, (x) => def(x, s), c));
        if (!clash) return;
        drafts[day] = buildSchedule({ ...s, tasks: plannableTasks(s, +day), constraints: +day === NUM_TODAY ? todayFromNow() : c, dayNum: +day });
        changed = true;
      });
      return changed ? { ...s, drafts } : s;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurringKey]);

  function update(patch) {
    setState((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));
  }

  // Which logical day the Planner screen is currently building a schedule
  // for, read off state rather than the closed-over `planDayNum` above — the
  // functional setState callbacks below run against whatever `s` they're
  // handed, which may not match the render this closure was created in.
  function dayNumOf(s) {
    return s.planToday ? NUM_TODAY : REFERENCE_DAY;
  }
  // The task switches a plan for `day` is built from: a one-off task already
  // in the other day's approved plan belongs there, and a session already
  // finished or started isn't planned again.
  function plannableTasks(s, day) {
    const tasks = { ...s.tasks };
    s.taskDefs.forEach((d) => {
      const st = (s.taskState[taskKey(d, day)] || {}).status;
      if (d.pendingDraft || plannedElsewhere(s, d, day) || ['completed', 'in_progress', 'paused'].includes(st)) tasks[taskKey(d, day)] = false;
    });
    return tasks;
  }
  // Writes the plan the review screen is showing for `day`: its draft if it
  // has one, otherwise its approved plan (edited in place).
  function setWorking(s, day, sched) {
    const key = planFor(s, day) && !draftFor(s, day) ? 'plans' : 'drafts';
    return { [key]: { ...s[key], [day]: sched } };
  }
  // After a task edit, every plan and draft holding it is patched, never
  // re-laid out — a removed task leaves it (block null), an edited one keeps
  // its place with its new start/length — so nothing the student or the AI
  // arranged moves by itself. `blockFor(day)` gives the patch for that day
  // (undefined = leave it).
  function plansAfterEdit(s, id, blockFor) {
    const patch = (map) => {
      const out = {};
      Object.keys(map || {}).forEach((day) => {
        const sched = { ...map[day] };
        const block = blockFor(+day);
        if (block === null) delete sched[id];
        else if (block && sched[id]) sched[id] = { ...sched[id], ...block };
        out[day] = sched;
      });
      return out;
    };
    return { plans: patch(s.plans), drafts: patch(s.drafts) };
  }

  function def(id, st) {
    const list = (st || state).taskDefs;
    return list.find((t) => t.id === id);
  }
  // `dayNum`, when omitted, defaults to whichever day the Planner form is
  // currently on (see dayNumOf below) — right for every existing call site,
  // which only ever reads/writes the taskState of whatever's currently
  // scheduled. A repeating task's occurrence for that day gets its own
  // composite key (see taskKey in plannerLogic.js); an ordinary task is
  // unaffected since taskKey just returns its plain id.
  function ts(id, dayNum, st) {
    const s = st || state;
    const d = def(id, s);
    const key = d ? taskKey(d, dayNum != null ? dayNum : dayNumOf(s)) : id;
    return s.taskState[key] || { status: 'planned' };
  }

  function go(screen) {
    update({ screen });
  }

  function toggleTask(id, dayNum) {
    update((s) => {
      const d = def(id, s);
      if (!d) return {};
      const dn = dayNum != null ? dayNum : dayNumOf(s);
      const key = taskKey(d, dn);
      const on = !isTaskOn(s.tasks, d, dn);
      // A personal to-do's checkbox is also its "done" flag — remember which
      // day it was ticked so a floating (no fixed day) one doesn't reappear
      // still ticked on later days (see finishedOnDay in plannerLogic.js).
      if (d.category === 'personal') {
        return { tasks: { ...s.tasks, [key]: on }, taskState: { ...s.taskState, [key]: { ...s.taskState[key], doneDay: on ? dn : null } } };
      }
      return { tasks: { ...s.tasks, [key]: on } };
    });
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
  // The result is a draft for that day: whatever plan the day already had
  // stays in force until the new one is approved (confirmPlan).
  // The AI gets everything the student has added (see aiContext.js) and
  // may suggest review sessions for a close exam; those become tasks marked
  // pendingDraft until the plan is approved (or leave with the draft).
  function generatePlan() {
    update({ manualMode: false, blockEdit: null });
    const day = dayNumOf(state);
    const planConstraints = day === NUM_TODAY ? todayFromNow() : constraints;
    const tasks = plannableTasks(state, day);
    const work = requestAIPlan({ ...state, tasks, constraints: planConstraints, dayNum: day, recurringActivities, aboutMe });
    runGen(PLAN_LABELS, (result, cur) => {
      const stale = cur.taskDefs.filter((d) => d.pendingDraft && d.day === day).map((d) => d.id);
      const s = { ...cur, ...withoutTasks(cur, stale) };
      const draft = result ? { ...result.schedule } : buildSchedule({ ...s, tasks: plannableTasks(s, day), constraints: planConstraints, dayNum: day });
      const stamp = Date.now().toString(36);
      const extraDefs = (result?.extras || []).map((x, i) => {
        const title = translate('ai.reviewTitle', { exam: x.examTitle }) + (x.focus ? ' — ' + x.focus : '');
        return {
          id: 'aireview-' + stamp + '-' + i, category: 'school', subject: x.subject, title, dur: x.dur, day,
          priority: 'Wysoki priorytet', color: '#f5a524', short: x.subject + ' — ' + title,
          examId: x.examId, aiSuggested: true, pendingDraft: true,
        };
      });
      const tasksOn = { ...s.tasks };
      const taskState = { ...s.taskState };
      extraDefs.forEach((d, i) => {
        tasksOn[d.id] = true;
        taskState[d.id] = { status: 'planned' };
        draft[d.id] = { start: result.extras[i].start, dur: d.dur };
      });
      return {
        generating: false, screen: 'plan', planToday: day === NUM_TODAY,
        taskDefs: s.taskDefs.concat(extraDefs), tasks: tasksOn, taskState,
        drafts: { ...s.drafts, [day]: draft },
        planAIRationale: result ? result.rationale : null,
      };
    }, work);
  }

  // The days an exam's study sessions can go on: from today (if there's
  // still time left today) or tomorrow up to the day before the exam, at
  // most the last three weeks of that.
  const PREP_MAX_DAYS = 21;
  function prepDays(examDay) {
    const lastDay = Math.max(NUM_TODAY, examDay - 1);
    const now = todayFromNow();
    const firstDay = now.bedtimeMinutes - now.wakeMinutes >= 30 || lastDay === NUM_TODAY ? NUM_TODAY : NUM_TODAY + 1;
    const days = [];
    for (let day = Math.max(firstDay, lastDay - PREP_MAX_DAYS + 1); day <= lastDay; day++) {
      const c = day === NUM_TODAY ? now : constraintsFor(day);
      days.push({
        day, date: dateOf(day), weekday: dayInfo(day).label, wakeMinutes: c.wakeMinutes, bedtimeMinutes: c.bedtimeMinutes, blocks: c.blocks,
        busy: busyOnDay(state, day),
        dueTasks: state.taskDefs.filter((d) => d.category !== 'personal' && d.day === day).map((d) => d.title),
      });
    }
    return days;
  }

  // The AI plans the study sessions around the student's real days (other
  // exams, plans, activities); the fixed template is the fallback.
  function deadlineGenerate() {
    const examDay = NUM_TODAY + (daysUntilFromISODate(state.examDate) ?? 11);
    const days = prepDays(examDay);
    const exam = {
      kind: state.kind, subject: state.subject, title: state.nameValue.trim(), date: dateOf(examDay), time: state.examTime,
      daysUntil: examDay - NUM_TODAY, topics: state.topics.map((x) => x.trim()).filter(Boolean),
      difficulty: state.difficulty, level: LEVELS[state.level - 1] || '', goal: state.goal,
    };
    const context = { exams: examsForAI(state), weeklyActivities: weeklyActivitiesForAI(recurringActivities), aboutMe };
    const work = requestAIPrep({ exam, days, context });
    update({ deadlineFailed: false, sessionEdits: {} });
    runGen(PREP_LABELS, (result, s) => {
      if (result) {
        return {
          generating: false, screen: 'prep', prepSessions: toPrepCards(result.sessions),
          prepDayNums: result.sessions.map((x) => x.day), prepDates: result.sessions.map((x) => prepDayLabel(x.day)),
          prepRationale: result.rationale,
        };
      }
      const sessions = buildPrepSessions(s.topics, s.difficulty);
      return {
        generating: false, screen: 'prep', prepSessions: sessions, prepDates: buildPrepDates(sessions.length, examDay),
        prepDayNums: buildPrepDayNums(sessions.length, examDay), prepRationale: null,
      };
    }, work);
  }

  // Asks Claude to decide what stays (maybe shortened) and what gets moved
  // to another day given how little time is actually left; falls back to
  // the deterministic rescue packer whenever the AI is unavailable or
  // proposes something that fails validation (over budget, over duration,
  // or a scheduling conflict).
  function rescueGenerate() {
    update({ rescueFailed: false });
    const availableMinutes = RESCUE_TIME_MINUTES[state.rescueTime] ?? 90;
    // Rescue is always today's, from now on — whatever day the Planner was on.
    const rescueConstraints = todayFromNow();
    const work = requestAIRescue({
      taskDefs: state.taskDefs, tasks: state.tasks, taskState: state.taskState, durOverride: state.durOverride,
      energy: state.rescueEnergy, availableMinutes, reasons: state.reasons, constraints: rescueConstraints,
      activitiesSelected: state.activitiesSelected, prioritySubjects: state.prioritySubjects,
      studyTime: state.studyTime,
      context: planningContextForAI(state, { dayNum: NUM_TODAY, recurringActivities, aboutMe }),
      taskView: (d, dur) => taskForAI(state, d, dur),
    });
    runGen(RESCUE_LABELS, (result, s) => {
      const fallback = result || buildRescueSchedule({
        taskDefs: s.taskDefs, tasks: s.tasks, taskState: s.taskState, durOverride: s.durOverride,
        energy: s.rescueEnergy, availableMinutes, constraints: rescueConstraints,
      });
      return {
        generating: false, screen: 'rescueResult',
        rescueSchedule: fallback.schedule, rescueDecisions: fallback.decisions, rescueRationale: result ? result.rationale : null,
      };
    }, work);
  }

  // ---- home / session lifecycle ----
  // A session always happens today, whatever day the Planner's Today/
  // Tomorrow switch was last left on.
  function startSession(id) {
    update((s) => {
      const d = def(id, s);
      const key = d ? taskKey(d, NUM_TODAY) : id;
      const t = { ...s.taskState };
      t[key] = { ...t[key], status: 'in_progress' };
      const now = Date.now();
      return { taskState: t, activeTask: id, sessionStart: now, sessionBeganAt: now, sessionElapsedMs: 0, sessionExtraMin: 0, breakDismissed: false, screen: 'focus' };
    });
  }
  // "+1 min" on the focus screen: lengthens only the running session, never
  // its block in the day's plan.
  function addSessionMinute() {
    update((s) => ({ sessionExtraMin: (s.sessionExtraMin || 0) + 1 }));
  }
  function togglePause(id) {
    update((s) => {
      const d = def(id, s);
      const key = d ? taskKey(d, NUM_TODAY) : id;
      const t = { ...s.taskState };
      const pausing = t[key].status !== 'paused';
      t[key] = { ...t[key], status: pausing ? 'paused' : 'in_progress' };
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
      const d = def(id, s);
      const key = d ? taskKey(d, NUM_TODAY) : id;
      const t = { ...s.taskState };
      t[key] = { status: 'completed', actual: s.finishDur, hard: s.finishHard, know: s.finishKnow, day: NUM_TODAY };
      return {
        taskState: t, activeTask: null, finishTask: null, sessionStart: null, sessionElapsedMs: 0, sessionBeganAt: null, sessionExtraMin: 0, breakDismissed: false,
        // Finished on the focus screen: it stays up briefly for the finish
        // animation (see Focus.jsx), then goes Home by itself.
        focusDone: s.screen === 'focus' && s.activeTask === id
          ? { id, beganAt: s.sessionBeganAt, endedAt: Date.now(), totalMin: sessionDur(s) + (s.sessionExtraMin || 0) }
          : null,
        sessionReview: { ...s.sessionReview, [id]: { minutes: s.finishDur, hard: s.finishHard, know: s.finishKnow } },
      };
    });
    // The streak now credits today the moment a real study session finishes,
    // not only once "Finish day" (Summary.jsx) is explicitly completed —
    // confirmFinish only ever runs for an actual scheduled study session
    // (never a personal to-do, which uses toggleTask instead), so this is
    // exactly the "did some real studying today" signal a streak should
    // reward. recordStudyDay merges rather than overwrites (see App.jsx), so
    // this can't clobber a fuller entry Finish day later writes, and — since
    // that merge keeps `completed` sticky once true — Finish day can't un-set
    // it either, even on a day where not everything planned got finished.
    recordStudyDay?.({ completed: true });
    window.dispatchEvent(new Event(WIN_EVENT));
  }

  // A session finished outside the focus screen (e.g. from the chat): the
  // same bookkeeping as confirmFinish — today's key, today's day, minutes,
  // and the day's streak credit.
  function completeSession(id, minutes) {
    update((s) => {
      const d = def(id, s);
      if (!d) return {};
      const key = taskKey(d, NUM_TODAY);
      const actual = minutes ?? (planFor(s, NUM_TODAY)?.[id]?.dur || d.dur || 30);
      return {
        taskState: { ...s.taskState, [key]: { ...s.taskState[key], status: 'completed', actual, day: NUM_TODAY } },
        sessionReview: { ...s.sessionReview, [id]: { ...(s.sessionReview && s.sessionReview[id]), minutes: actual } },
        ...(s.activeTask === id ? { activeTask: null, sessionStart: null, sessionElapsedMs: 0, sessionBeganAt: null, sessionExtraMin: 0 } : {}),
      };
    });
    recordStudyDay?.({ completed: true });
  }

  // ---- block edit (plan screen, manual mode) ----
  function openBlockEdit(id) {
    update((s) => {
      const block = workingPlan(s, dayNumOf(s))[id];
      return block ? { blockEdit: { id, start: block.start, dur: block.dur, msg: null } } : {};
    });
  }
  function moveBlockEdit(patch) {
    update((s) => {
      const b = { ...s.blockEdit, ...patch };
      b.msg = checkBlockConflict(b.id, b.start, b.dur, workingPlan(s, dayNumOf(s)), (id) => def(id, s), constraints);
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
      const day = dayNumOf(s);
      const sched = { ...workingPlan(s, day), [b.id]: { start: b.start, dur: b.dur } };
      const dov = { ...s.durOverride, [b.id]: b.dur };
      // Remembered as the task's start too, so a later re-layout keeps it.
      const sov = { ...s.startOverride, [b.id]: b.start };
      return { ...setWorking(s, day, sched), durOverride: dov, startOverride: sov, blockEdit: null };
    });
  }
  function removeBlock(id) {
    update((s) => {
      const d = def(id, s);
      const day = dayNumOf(s);
      const key = d ? taskKey(d, day) : id;
      const tsx = { ...s.taskState, [key]: { ...s.taskState[key], status: 'skipped', day } };
      const sched = { ...workingPlan(s, day) };
      delete sched[id];
      // A session the AI only suggested just goes away.
      if (d && d.pendingDraft) return { ...withoutTasks(s, [id]), ...setWorking(s, day, sched) };
      return { taskState: tsx, ...setWorking(s, day, sched) };
    });
  }

  // ---- task edit sheet ----
  // Converts a stored day-num back into the sheet's Today/Tomorrow/Pick-date
  // chips — the inverse of dayNumFromChoice below.
  function dayChoiceForNum(dayNum) {
    if (dayNum == null || dayNum === REFERENCE_DAY) return { dayChoice: 'tomorrow', dayDate: '' };
    if (dayNum === NUM_TODAY) return { dayChoice: 'today', dayDate: '' };
    return { dayChoice: 'pick', dayDate: localDateKey(realDateForNum(dayNum)) };
  }
  // The reverse: today/tomorrow/an explicit picked date all resolve down to
  // the same day-num space (NUM_TODAY-relative) everything else here uses.
  function dayNumFromChoice(dayChoice, dayDate) {
    if (dayChoice === 'today') return NUM_TODAY;
    if (dayChoice === 'pick') return NUM_TODAY + (daysUntilFromISODate(dayDate) ?? 1);
    return REFERENCE_DAY;
  }
  function openTaskEdit(id) {
    update((s) => {
      const d = def(id, s);
      const dur = (s.durOverride && s.durOverride[id]) || d.dur;
      const block = workingPlan(s, dayNumOf(s))[id] || planFor(s, NUM_TODAY)?.[id] || planFor(s, REFERENCE_DAY)?.[id];
      const start = s.startOverride && s.startOverride[id] != null ? s.startOverride[id] : (block ? block.start : 930);
      // A repeating task (see the "Repeat" day chip) has no single `day` to
      // round-trip through dayChoiceForNum — it opens straight back into
      // repeat mode with its saved weekdays instead.
      const dayFields = d.repeatDays && d.repeatDays.length
        ? { dayChoice: 'repeat', dayDate: '', repeatDays: d.repeatDays }
        : { ...dayChoiceForNum(d.day), repeatDays: [] };
      // A to-do keeps its own set time (d.at), or none.
      const personal = d.category === 'personal';
      return {
        taskEdit: {
          id, name: translate(TASK_TEXT_KEY[id]?.title) || d.title, subject: d.subject,
          dur: personal ? d.dur || 60 : dur, start: personal ? d.at || '18:00' : fmtLocal(start), timed: personal && !!d.at,
          priority: d.priority, note: d.note || '', category: d.category || 'school', autoCategory: true, ...dayFields,
        },
        editErrors: {}, teToast: false,
      };
    });
  }
  // A blank taskEdit (id: null signals "new" to saveTaskEdit below) — lets
  // the student add any subject/task instead of being stuck with the 3
  // demo ones. `dayNum`, when given (e.g. Tasks screen's own day scroller,
  // or Planner's today/tomorrow toggle), pre-selects that day instead of
  // always defaulting to today — the Day chips below let the student change
  // it either way. category starts as a guess (school) since the name is
  // still empty — TaskEditSheet re-detects it from the name as soon as the
  // student types one (see autoCategory, detectTaskMeta in lib/taskAuto.js).
  function openNewTaskEdit(dayNum) {
    update({
      taskEdit: {
        id: null, name: '', subject: SUBJECTS[0], dur: 30, start: '19:00', priority: PRIORITIES[1], note: '',
        category: 'school', autoCategory: true, repeatDays: [], timed: false,
        ...(dayNum != null ? dayChoiceForNum(dayNum) : { dayChoice: 'today', dayDate: '' }),
      },
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
      const isPersonal = fm.category === 'personal';
      const isRepeat = fm.dayChoice === 'repeat';
      const errs = {};
      if (!fm.name || !fm.name.trim()) errs.name = translate('taskEdit.nameRequired');
      if (isRepeat && (!fm.repeatDays || !fm.repeatDays.length)) errs.repeatDays = translate('taskEdit.repeatDaysRequired');
      // A personal task (errand, chore — see the category toggle) has no
      // subject; it only has a duration and start time when the student
      // gave it a set time ("At a set time"), which then blocks that time.
      const timedTodo = isPersonal && !!fm.timed;
      let startMin = null;
      if (!isPersonal || timedTodo) {
        if (!(fm.dur >= 5 && fm.dur <= 240)) errs.dur = translate('taskEdit.durRequired');
        const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec((fm.start || '').trim());
        if (!m) errs.start = translate('taskEdit.startRequired');
        else startMin = (+m[1]) * 60 + (+m[2]);
      }
      if (Object.keys(errs).length) return { editErrors: errs };
      const name = fm.name.trim();
      const isNew = fm.id == null;
      const id = isNew ? 'custom-' + Date.now() : fm.id;
      // A repeating task has no single day-num — it matches whichever of its
      // chosen weekdays a given dayNum falls on (see taskDueOnDay in
      // plannerLogic.js) instead.
      const day = isRepeat ? null : dayNumFromChoice(fm.dayChoice, fm.dayDate);
      const repeatDays = isRepeat ? fm.repeatDays : [];
      // Checked here (not just in BlockEditSheet) so a task can't be saved
      // on top of a fixed activity or another session in the first place —
      // previously only a drag-edit of an already-placed block was
      // validated, so a brand new task (or a duration change) could freely
      // land on a time a recurring activity already owns. School tasks and
      // to-dos with a set time occupy a slot; a plain to-do doesn't.
      if (!isPersonal || timedTodo) {
        // Checked against the task's own day — its fixed activities and, if
        // that day has a plan, its sessions — not whichever day the Planner
        // happens to be on. A to-do's own old time doesn't count against it.
        const taskDay = isRepeat ? planDayNum : (day ?? planDayNum);
        const daySchedule = planFor(s, taskDay) || {};
        const c = constraintsFor(taskDay);
        const conflict = checkBlockConflict(id, startMin, fm.dur, daySchedule, (cid) => def(cid, s), { ...c, blocks: c.blocks.filter((b) => b.taskId !== id) });
        if (conflict) {
          const vars = conflict.vars?.subject ? { ...conflict.vars, subject: translate(VALUE_KEY[conflict.vars.subject]) || conflict.vars.subject } : conflict.vars;
          return { editErrors: { start: translate(conflict.key, vars) } };
        }
      }
      const defs = isNew
        ? s.taskDefs.concat(isPersonal
          ? { id, category: 'personal', title: name, priority: fm.priority, note: fm.note, day, repeatDays, color: '#a58cff', short: name, at: timedTodo ? fm.start.trim() : null, dur: timedTodo ? fm.dur : undefined }
          : { id, category: 'school', subject: fm.subject, title: name, dur: fm.dur, priority: fm.priority, note: fm.note, day, repeatDays, color: '#a58cff', short: fm.subject + ' — ' + name })
        : s.taskDefs.map((t) => {
          if (t.id !== id) return t;
          if (isPersonal) return { ...t, category: 'personal', title: name, priority: fm.priority, note: fm.note, day, repeatDays, short: name, at: timedTodo ? fm.start.trim() : null, dur: timedTodo ? fm.dur : undefined };
          const renamed = t.title !== name || t.subject !== fm.subject;
          return { ...t, category: 'school', title: name, subject: fm.subject, dur: fm.dur, priority: fm.priority, note: fm.note, day, repeatDays, short: renamed ? fm.subject + ' — ' + name : t.short };
        });
      const durOverride = isPersonal ? s.durOverride : { ...s.durOverride, [id]: fm.dur };
      const startOverride = isPersonal ? s.startOverride : { ...s.startOverride, [id]: startMin };
      // For a school task this flag means "include it in the schedule",
      // defaulted on since that's the point of adding one. A personal task
      // has no schedule to join — the same flag doubles as its "done"
      // checkbox in Planner's checklist (see the personalTasks section
      // there), so a new one should start unchecked, not pre-completed. A
      // repeating task has no single occurrence to seed here — each day's
      // own on/off state defaults itself the same way lazily (see isTaskOn
      // in plannerLogic.js) the first time that day is actually looked at.
      const tasks = isNew && !isRepeat ? { ...s.tasks, [id]: !isPersonal } : s.tasks;
      const taskState = isNew && !isRepeat ? { ...s.taskState, [id]: { status: 'planned' } } : s.taskState;
      // In each plan an edited task keeps its block (with the new time/
      // length) — or leaves that plan if it no longer belongs to its day.
      const edited = defs.find((t) => t.id === id);
      const blockFor = (planDay) => (isPersonal ? undefined : (!taskDueOnDay(edited, planDay) ? null : { start: startMin, dur: fm.dur }));
      return { taskDefs: defs, durOverride, startOverride, tasks, taskState, ...plansAfterEdit(s, id, blockFor), taskEdit: null, editErrors: {}, teToast: true };
    });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => update({ teToast: false }), 2200);
  }
  function removeTaskDef(id) {
    update((s) => {
      const defs = s.taskDefs.filter((t) => t.id !== id);
      // A repeating task's own occurrences live under composite `id:dayNum`
      // keys (see taskKey in plannerLogic.js) — removing the definition
      // needs to sweep every one of those too, not just the plain `id`
      // (which a repeating task never actually uses), or they'd linger as
      // orphaned, unreachable entries in persisted state forever.
      const prefix = id + ':';
      const stripOccurrences = (map) => {
        const next = { ...map };
        Object.keys(next).forEach((k) => { if (k === id || k.startsWith(prefix)) delete next[k]; });
        return next;
      };
      const tasks = stripOccurrences(s.tasks);
      const taskState = stripOccurrences(s.taskState);
      const durOverride = { ...s.durOverride };
      delete durOverride[id];
      const startOverride = { ...s.startOverride };
      delete startOverride[id];
      const sessionReview = { ...s.sessionReview };
      delete sessionReview[id];
      return { taskDefs: defs, tasks, taskState, durOverride, startOverride, sessionReview, ...plansAfterEdit(s, id, () => null), taskEdit: null };
    });
  }

  // ---- manual mode ----
  function toggleManualMode() {
    update((s) => (s.manualMode
      ? { manualMode: false, manualSnapshot: null, blockEdit: null }
      : { manualMode: true, manualSnapshot: { schedule: workingPlan(s, dayNumOf(s)), taskState: s.taskState, durOverride: s.durOverride } }));
  }
  function regenerateOrCancel() {
    if (!state.manualMode) { generatePlan(); return; }
    update((s) => {
      const snap = s.manualSnapshot || {};
      return { manualMode: false, manualSnapshot: null, blockEdit: null, ...setWorking(s, dayNumOf(s), snap.schedule || {}), taskState: snap.taskState, durOverride: snap.durOverride || {} };
    });
  }

  // Approving a draft replaces that day's plan; a session already finished
  // or started on it stays in the plan as it was. Only that day changes.
  function confirmPlan() {
    update((s) => {
      const day = dayNumOf(s);
      const draft = draftFor(s, day);
      if (!draft) return { saved: true, manualMode: false };
      const old = planFor(s, day) || {};
      const kept = {};
      Object.keys(old).forEach((id) => {
        const d = def(id, s);
        const st = d && (s.taskState[taskKey(d, day)] || {}).status;
        if (['completed', 'in_progress', 'paused'].includes(st) && !draft[id]) kept[id] = old[id];
      });
      const drafts = { ...s.drafts };
      delete drafts[day];
      const approved = { ...draft, ...kept };
      // AI-suggested review sessions in the approved plan become ordinary
      // tasks; any it no longer holds are dropped.
      const unused = s.taskDefs.filter((d) => d.pendingDraft && d.day === day && !approved[d.id]).map((d) => d.id);
      const cleaned = withoutTasks(s, unused);
      const taskDefs = cleaned.taskDefs.map((d) => (d.pendingDraft && approved[d.id] ? { ...d, pendingDraft: false } : d));
      return { saved: true, manualMode: false, plans: { ...s.plans, [day]: approved }, drafts, ...cleaned, taskDefs };
    });
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
      // Moved off today only (its day is recorded) — it can still be
      // planned on any other day; see activeIds.
      Object.keys(s.rescueDecisions || {}).forEach((id) => {
        if (s.rescueDecisions[id] !== 'moved') return;
        const d = def(id, s);
        const key = d ? taskKey(d, NUM_TODAY) : id;
        t[key] = { ...t[key], status: 'moved', day: NUM_TODAY };
      });
      // Rescue is always today's plan; tomorrow's is left alone. Sessions
      // already finished today stay in it.
      const old = planFor(s, NUM_TODAY) || {};
      const kept = {};
      Object.keys(old).forEach((id) => {
        const d = def(id, s);
        if (d && ['completed', 'in_progress', 'paused'].includes((t[taskKey(d, NUM_TODAY)] || {}).status)) kept[id] = old[id];
      });
      const drafts = { ...s.drafts };
      delete drafts[NUM_TODAY];
      return {
        rescueSaved: true, rescueApplied: true,
        taskState: t, plans: { ...s.plans, [NUM_TODAY]: { ...kept, ...(s.rescueSchedule || {}) } }, drafts,
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
    update((s) => ({ topics: s.topics.concat(''), topicErr: false }));
  }
  function setTopic(i, value) {
    update((s) => ({ topics: s.topics.map((t, j) => (j === i ? value : t)) }));
  }
  function removeTopic(i) {
    update((s) => ({ topics: s.topics.filter((_, j) => j !== i), topicErr: false }));
  }
  function deadlineSubmit(valid) {
    if (!valid) { update({ topicErr: true }); return; }
    if (!state.autoPlan) {
      addCustomExam({
        subject: state.subject, title: state.nameValue.trim(), daysUntil: daysUntilFromISODate(state.examDate),
        grade: state.goal, importance: 'Średni', studyMinutes: 120,
      });
      update({ deadlineOnlySaved: true });
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
    // Every offered date option already comes from state.prepDates, which
    // buildPrepDates() only ever spreads between today and the real exam
    // date — so any option here is inherently valid, nothing to reject.
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
  // Validated against the student's real wake/bedtime/recurring activities
  // (see dayConstraints in plannerLogic.js) — not fixed times assumed to
  // conflict with an invented school/tennis schedule.
  function pickSessionTime(t) {
    const startMin = toMinutesLocal(t);
    const dur = parseInt(currentDur(state.sessionIdx), 10);
    const conflict = checkBlockConflict('prep-session', startMin, dur, {}, () => ({ subject: '' }), constraints);
    if (conflict) { update({ sessionMessage: translate(conflict.key, conflict.vars) }); return; }
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
  function askOnlyDeadline() { update({ onlyDeadlineAsk: true }); }
  function backToPrep() { update({ onlyDeadlineAsk: false }); }
  function saveOnlyDeadline() {
    addCustomExam({
      subject: state.subject, title: state.nameValue.trim(), daysUntil: daysUntilFromISODate(state.examDate),
      grade: state.goal, importance: 'Średni', studyMinutes: 120,
    });
    update({ onlyDeadlineAsk: false, screen: 'deadline', deadlineOnlySaved: true });
  }
  // The prep plan's own sessions become the thing exam progress is tracked
  // against (see toggleExamSession/examProgressMinutes) — each one carries
  // whatever date/time/duration the student ended up with after any edits
  // made via openSession/applySession above, not just the original guess.
  // A label the student picked for a session (via openSession/pickSessionDate
  // on the Prep screen) is one of state.prepDates' own labels, so it maps
  // back to a real day-num 1:1 through this — the reverse of prepDayLabel().
  function dayNumForPrepLabel(label, fallbackIdx) {
    const i = state.prepDates.indexOf(label);
    return i >= 0 ? state.prepDayNums[i] : state.prepDayNums[fallbackIdx];
  }
  function confirmPrep() {
    const sessions = state.prepSessions.map((sx, i) => {
      const edit = state.sessionEdits[i] || {};
      const dateLabel = edit.date || state.prepDates[i];
      return {
        title: sx.title, type: sx.type, dateLabel, time: edit.time || sx.time,
        dur: parseInt(edit.dur || sx.dur, 10), done: false, day: dayNumForPrepLabel(dateLabel, i),
      };
    });
    const totalMinutes = sessions.reduce((a, s) => a + s.dur, 0);
    const id = addCustomExam({
      subject: state.subject, title: state.nameValue.trim(), daysUntil: daysUntilFromISODate(state.examDate),
      grade: state.goal, importance: 'Średni', studyMinutes: totalMinutes || 120,
    });
    update((s) => {
      // Each prep session becomes a real school task too — on its own day,
      // pre-selected — so it's actually remembered while planning that day
      // (Planner's list, the generated schedule, the Tasks screen), not
      // just tracked on this exam's own progress card.
      const sessionTaskDefs = sessions.map((sess, i) => ({
        id: 'examsession-' + id + '-' + i,
        category: 'school', subject: s.subject, title: sess.title, dur: sess.dur,
        priority: 'Wysoki priorytet', day: sess.day, color: '#f5a524', short: s.subject + ' — ' + sess.title,
      }));
      const taskDefs = s.taskDefs.concat(sessionTaskDefs);
      const tasks = { ...s.tasks };
      sessionTaskDefs.forEach((d) => { tasks[d.id] = true; });
      // The time picked for each session on the Prep screen becomes its
      // start, instead of being dropped (it used to land at wake time).
      const startOverride = { ...s.startOverride };
      sessions.forEach((sess, i) => {
        const start = String(sess.time || '').split('–')[0];
        if (/^\d{1,2}:\d{2}$/.test(start)) startOverride[sessionTaskDefs[i].id] = timeStrToMinutes(start);
      });
      return { examSessions: { ...s.examSessions, [id]: sessions }, taskDefs, tasks, startOverride };
    });
    update({ prepSaved: true });
  }

  // ---- day summary ----
  // Applies the unfinished-session picks, then saves today's results once.
  // A moved one-off task gets tomorrow as its day (and leaves today's
  // schedule); a repeating task's occurrence can't change day, so a one-off
  // copy is added for tomorrow instead.
  function finishDay(stats) {
    window.dispatchEvent(new Event(WIN_EVENT));
    update((s) => {
      const choices = s.unfinishedChoices || {};
      let taskDefs = s.taskDefs;
      const tasks = { ...s.tasks };
      const taskState = { ...s.taskState };
      const schedule = { ...(planFor(s, NUM_TODAY) || {}) };
      let kept = 0;
      let dropped = 0;
      let missed = 0;
      // Unfinished sessions plus open to-dos / unplanned tasks. Nothing is
      // moved to a date: a one-off stays open with no fixed day (so it keeps
      // showing until done) or is let go; a repeating task's occurrence for
      // today just counts as missed — it comes back anyway.
      const leftover = daySessionBreakdown(s, NUM_TODAY).unfinished.concat(dayOpenTasks(s, NUM_TODAY).map((d) => d.id));
      leftover.forEach((id) => {
        const d = taskDefs.find((x) => x.id === id);
        if (!d) return;
        const key = taskKey(d, NUM_TODAY);
        const personal = d.category === 'personal';
        if (d.repeatDays && d.repeatDays.length) {
          if (!personal) taskState[key] = { ...taskState[key], status: 'skipped', day: NUM_TODAY };
          missed++;
          return;
        }
        if (choices[id] === 'drop') {
          taskState[key] = { ...taskState[key], status: 'skipped', day: NUM_TODAY };
          if (personal) tasks[key] = false;
          dropped++;
          return;
        }
        kept++;
        if (d.day != null) taskDefs = taskDefs.map((x) => (x.id === id ? { ...x, day: null } : x));
        if (!personal) {
          tasks[id] = true;
          taskState[id] = { status: 'planned' };
          delete schedule[id];
        }
      });
      const recent = Object.entries({ ...s.daySummaries, [localDateKey()]: { ...stats, kept, dropped, missed, dayHard: s.dayHard, dayEnergy: s.dayEnergy } })
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .slice(-60);
      return {
        taskDefs, tasks, taskState, plans: planFor(s, NUM_TODAY) ? { ...s.plans, [NUM_TODAY]: schedule } : s.plans, unfinishedChoices: {},
        daySummaries: Object.fromEntries(recent), summaryFailed: false, daySaved: true, daySummarized: true,
      };
    });
  }
  function setUnfinishedChoice(id, choice) {
    update((s) => ({ unfinishedChoices: { ...s.unfinishedChoices, [id]: choice } }));
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
  // Validated against the student's real wake/bedtime/recurring activities
  // (see dayConstraints in plannerLogic.js), not two fixed times assumed to
  // conflict with an invented event/sleep schedule.
  function pickEngTime(t) {
    const movedIds = state.taskDefs.filter((d) => (state.taskState[d.id] || {}).status === 'moved').map((d) => d.id);
    const dur = movedIds.reduce((a, id) => a + durOf(id, state.taskDefs, state.durOverride), 0) || 30;
    const conflict = checkBlockConflict('eng-tomorrow', toMinutesLocal(t), dur, {}, () => ({ subject: '' }), constraints);
    if (conflict) { update({ engMessage: translate(conflict.key, conflict.vars) }); return; }
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
    // v: 2 = day is the exam's real date (see the migration in initialState).
    const exam = { id, subject, title, color: color || '#8fbaff', day: NUM_TODAY + daysUntil, v: 2 };
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
      const examSessions = { ...s.examSessions };
      delete examSessions[id];
      // Removes this exam's own prep-session tasks too (see confirmPrep),
      // so deleting the exam doesn't leave orphaned sessions behind in
      // Planner/Tasks with nothing to point back to.
      const prefix = 'examsession-' + id + '-';
      const taskDefs = s.taskDefs.filter((t) => !t.id.startsWith(prefix));
      const tasks = { ...s.tasks };
      const taskState = { ...s.taskState };
      // …and out of the plan, so no screen is left pointing at a session
      // whose task no longer exists.
      const durOverride = { ...s.durOverride };
      const startOverride = { ...s.startOverride };
      const sessionReview = { ...s.sessionReview };
      s.taskDefs.forEach((t) => {
        if (!t.id.startsWith(prefix)) return;
        [tasks, taskState, durOverride, startOverride, sessionReview].forEach((map) => { delete map[t.id]; });
      });
      let { plans, drafts } = s;
      s.taskDefs.forEach((t) => { if (t.id.startsWith(prefix)) ({ plans, drafts } = plansAfterEdit({ plans, drafts }, t.id, () => null)); });
      const activeGone = s.activeTask && s.activeTask.startsWith(prefix);
      return {
        customExams: s.customExams.filter((e) => e.id !== id), examGoals, examSessions, taskDefs, tasks, taskState, plans, drafts, durOverride, startOverride, sessionReview,
        ...(activeGone ? { activeTask: null, sessionStart: null, sessionElapsedMs: 0, sessionBeganAt: null, sessionExtraMin: 0 } : {}),
      };
    });
  }
  // Toggles one prep session's done state — the only thing driving that
  // exam's progress % (see examProgressMinutes in plannerLogic.js), so an
  // exam with 4 confirmed sessions reaches 100% exactly when all 4 are
  // checked off, not from a separate, disconnected minutes guess.
  function toggleExamSession(examId, idx) {
    update((s) => {
      const list = (s.examSessions[examId] || []).map((sess, i) => (i === idx ? { ...sess, done: !sess.done } : sess));
      return { examSessions: { ...s.examSessions, [examId]: list } };
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
    state, aboutMe, constraints, constraintsFor, planDayNum, plannableTasks, update, def, ts, go,
    toggleTask, generatePlan, deadlineGenerate, rescueGenerate,
    startSession, togglePause, dismissBreakReminder, openFinish, cancelFinish, confirmFinish,
    openBlockEdit, moveBlockEdit, cancelBlockEdit, saveBlockEdit, removeBlock,
    addSessionMinute, completeSession, openTaskEdit, openNewTaskEdit, patchTaskEdit, stepTaskDur, cancelTaskEdit, saveTaskEdit, removeTaskDef,
    toggleManualMode, regenerateOrCancel, confirmPlan, goHomeSaved,
    openEnergySheet, cancelEnergySheet, saveEnergySheet,
    toggleReason, setRescueTime, confirmRescue, goHomeRescued,
    setField, addTopic, setTopic, removeTopic, deadlineSubmit, goHomeDeadline,
    openSession, pickSessionDate, pickSessionTime, pickSessionDur, cancelSession, saveSession,
    askOnlyDeadline, backToPrep, saveOnlyDeadline, confirmPrep,
    finishDay, setUnfinishedChoice, goHomeSummarized, saveLater, adjustSessionMinutes, setSessionField,
    keepEngTomorrow, openEngTime, pickEngTime, cancelEngTime, saveEngTime,
    applyAdaptive, declineAdaptive,
    setExamGrade, setExamImportance, adjustExamStudyMinutes, setExamStudyMinutes,
    addCustomExam, removeCustomExam, toggleExamSession, dismissGoalPrompt, answerGoalPrompt, nextGoalPrompt,
    computeActiveIds,
  };
}
