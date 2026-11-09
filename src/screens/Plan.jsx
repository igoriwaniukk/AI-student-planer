import { useState } from 'react';
import { hm, fmt, weekdayOn, taskDueOnDay, isTaskOn, workingPlan, draftFor, activeIds, pluralForm } from '../lib/plannerLogic';
import { iconForTask } from '../lib/taskAuto';
import { BackButton, StickyFooter, PrimaryButton, ConfirmCard } from '../components/ui';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';
import BlockEditSheet from '../components/BlockEditSheet';
import PlanTimeline from '../components/PlanTimeline';

export default function Plan({ planner }) {
  const { t } = useLang();
  const { state, planDayNum, plannableTasks, toggleManualMode, regenerateOrCancel, confirmPlan, goHomeSaved, go, openNewTaskEdit, openTaskEdit, toggleTask } = planner;
  const [whyOpen, setWhyOpen] = useState(false);
  // The day's draft while one waits for approval, otherwise its approved plan.
  const sched = workingPlan(state, planDayNum);
  const isDraft = !!draftFor(state, planDayNum);
  const schedIds = Object.keys(sched);
  const nBlocks = schedIds.length;
  // Every task this day's plan is built from (not ones belonging to the
  // other day's plan, nor sessions already done) got a slot.
  const allFit = activeIds(state.taskDefs, plannableTasks(state, planDayNum), state.taskState, planDayNum).every((id) => sched[id]);
  // Personal tasks (see TaskEditSheet's auto-detected category) never get a
  // scheduled block, so the timeline has nothing to render them with —
  // they're listed under it instead, so they don't vanish from this screen.
  const personalTasks = state.taskDefs.filter((d) => d.category === 'personal' && taskDueOnDay(d, planDayNum));
  const studyMins = schedIds.reduce((a, k) => a + sched[k].dur, 0);
  const studyEnd = nBlocks ? fmt(Math.max(...schedIds.map((k) => sched[k].start + sched[k].dur))) : null;
  const summary = nBlocks
    ? [t('plan.sessions.' + pluralForm(nBlocks), { n: nBlocks }), hm(studyMins), t('plan.doneBy', { time: studyEnd })].join(' · ')
    : t('plan.noSessions');

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 20px 210px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Reviewing a fresh draft, back returns to the Planner form (the
            draft is kept); viewing an approved plan (Home's "See full
            plan"), back exits to Home. */}
        <BackButton onClick={() => go(isDraft ? 'planner' : 'home')} />
        <span role="button" onClick={toggleManualMode} style={{ fontSize: 14, fontWeight: 700, color: '#a58cff', cursor: 'pointer', padding: '8px 2px' }}>
          {state.manualMode ? t('plan.saveChanges') : t('planner.edit')}
        </span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginTop: 14 }}>{t('plan.title', { weekday: weekdayOn(planDayNum) })}</div>
      <div style={{ fontSize: 14, color: '#a3a3b3', marginTop: 6 }}>{summary}</div>
      {!allFit && <div style={{ fontSize: 13, fontWeight: 650, color: '#f7c46c', marginTop: 8 }}>⚠ {t('plan.someSkipped')}</div>}

      <div style={{ marginTop: 14 }}>
        <PlanTimeline schedule={sched} planner={planner} />
      </div>
      {state.manualMode && (
        <div onClick={() => openNewTaskEdit(planDayNum)} style={{ marginTop: 10, height: 46, borderRadius: 15, border: '1.5px dashed rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, color: '#9a9aab', cursor: 'pointer' }}>{t('planner.addTask')}</div>
      )}

      {personalTasks.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a', margin: '18px 0 4px 2px', textTransform: 'uppercase' }}>{t('tl.todo')}</div>
          {personalTasks.map((d) => {
            const done = isTaskOn(state.tasks, d, planDayNum);
            return (
              <div key={d.id} onClick={() => toggleTask(d.id, planDayNum)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 2px', borderBottom: '1px solid rgba(255,255,255,.06)', cursor: 'pointer' }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#35d07f' : 'transparent', border: '1.5px solid ' + (done ? '#35d07f' : 'rgba(255,255,255,.2)') }}>
                  <svg width="11" height="9" viewBox="0 0 12 10" fill="none" style={{ opacity: done ? 1 : 0 }}><path d="M1 5l3.4 3.4L11 1.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span style={{ fontSize: 15 }}>{iconForTask(d)}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 650, textDecoration: done ? 'line-through' : 'none', color: done ? '#8a8a99' : '#f4f4f7' }}>{d.title}</div>
                <span onClick={(e) => { e.stopPropagation(); openTaskEdit(d.id); }} style={{ color: '#6b6b7a', fontSize: 16, padding: '0 4px', cursor: 'pointer' }}>›</span>
              </div>
            );
          })}
        </>
      )}

      {state.planAIRationale && (
        whyOpen
          ? <div onClick={() => setWhyOpen(false)} style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', fontSize: 13, lineHeight: 1.5, color: '#c9c9d6', cursor: 'pointer' }}>🐾 {state.planAIRationale}</div>
          : <div role="button" onClick={() => setWhyOpen(true)} style={{ marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#8a8a99', cursor: 'pointer' }}>{t('plan.whyPlan')} ›</div>
      )}

      <StickyFooter>
        <PrimaryButton onClick={confirmPlan}>{t('plan.confirmPlan')}</PrimaryButton>
        <div role="button" onClick={regenerateOrCancel} style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 650, color: '#a58cff', marginTop: 12, cursor: 'pointer' }}>
          {state.manualMode ? t('plan.cancel') : '↻ ' + t('plan.newPlan')}
        </div>
      </StickyFooter>

      <BlockEditSheet planner={planner} />
      <TaskEditSheet planner={planner} />

      {state.saved && (
        <ConfirmCard
          title={t('plan.savedTitle', { weekday: weekdayOn(planDayNum) })}
          onDone={goHomeSaved}
          buttonLabel={t('plan.goToPlan')}
        />
      )}
    </div>
    </>
  );
}
