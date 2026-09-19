import { hm, fmt, formatMonthDay, weekdayOn, taskDueOnDay, isTaskOn } from '../lib/plannerLogic';
import { iconForTask } from '../lib/taskAuto';
import { BackButton, StickyFooter, PrimaryButton, ConfirmCard, Pill } from '../components/ui';
import AmbientGlow from '../components/AmbientGlow';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';
import BlockEditSheet from '../components/BlockEditSheet';
import DayTimeline from '../components/DayTimeline';

export default function Plan({ planner }) {
  const { t } = useLang();
  const { state, planDayNum, toggleManualMode, regenerateOrCancel, confirmPlan, goHomeSaved, go, openNewTaskEdit, openTaskEdit, toggleTask } = planner;
  const sched = state.schedule || {};
  const schedIds = Object.keys(sched);
  const nBlocks = schedIds.length;
  const nTasks = state.taskDefs.filter((d) => state.tasks[d.id] && d.category !== 'personal').length;
  // Personal tasks (see TaskEditSheet's auto-detected category) never get a
  // scheduled block, so DayTimeline — which only ever shows schedule
  // entries — has nothing to render them with. Added here (via "+ Add
  // task" below) they'd otherwise vanish from this screen entirely despite
  // being saved, even though they're still visible on Planner/Tasks.
  const personalTasks = state.taskDefs.filter((d) => d.category === 'personal' && taskDueOnDay(d, planDayNum));
  const studyMins = schedIds.reduce((a, k) => a + sched[k].dur, 0);
  const studyEnd = nBlocks ? fmt(Math.max(...schedIds.map((k) => sched[k].start + sched[k].dur))) : '—';
  const blockWord = nBlocks === 1 ? t('plan.oneBlock') : (nBlocks > 1 && nBlocks < 5 ? t('plan.fewBlocks', { n: nBlocks }) : t('plan.manyBlocks', { n: nBlocks }));
  const energyPhrase = state.energy === 'Niska' ? t('plan.energyLow') : state.energy === 'Wysoka' ? t('plan.energyHigh') : t('plan.energyNormal');
  const prefPhrase = state.pref === 'Więcej krótkich przerw' ? t('plan.prefBreaks') : state.pref === 'Najpierw najtrudniejsze' ? t('plan.prefHardest') : t('plan.prefFree');

  return (
    <>
    <AmbientGlow />
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 120px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Once a plan is approved, this screen is reached by viewing an
            already-saved plan (Home's "See full plan"), so back should exit
            to Home — not into the Planner form, which is only meant for the
            one-time review right after generating a brand new plan. */}
        <BackButton onClick={() => go(state.planApproved ? 'home' : 'planner')} />
        <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff', padding: '8px 14px', borderRadius: 999, background: 'rgba(124,92,255,.14)', border: '1px solid rgba(124,92,255,.45)' }}>{t('plan.readyToReview')}</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 20 }}>{t('plan.date', { date: formatMonthDay(planDayNum, { year: true }) })}</div>
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 6 }}>{t('plan.title', { weekday: weekdayOn(planDayNum) })}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 12px 2px' }}>
        <span style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('plan.dayPlan')}</span>
        {state.manualMode && <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff' }}>{t('plan.manualMode')}</span>}
      </div>
      <DayTimeline schedule={state.schedule} planner={planner} t={t} />
      {/* Editing here previously only covered blocks the plan already had
          (change time, remove) — there was no way to add one that wasn't
          already in it, short of backing out to the Planner form and
          regenerating. Manual mode is exactly the moment a student wants
          that, so it gets the same "+ Add task" affordance Planner has. */}
      {state.manualMode && (
        <div onClick={() => openNewTaskEdit(planDayNum)} style={{ marginTop: 11, height: 48, borderRadius: 16, border: '1.5px dashed rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, color: '#9a9aab', cursor: 'pointer' }}>{t('planner.addTask')}</div>
      )}

      {personalTasks.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9a9aab', margin: '14px 0 10px' }}>{t('planner.alsoPlanned', { day: weekdayOn(planDayNum) })}</div>
          {personalTasks.map((d) => {
            const done = isTaskOn(state.tasks, d, planDayNum);
            return (
              <div
                key={d.id}
                onClick={() => toggleTask(d.id, planDayNum)}
                style={{ marginTop: 8, padding: '12px 14px', borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, background: done ? 'rgba(53,208,127,.06)' : 'rgba(255,255,255,.03)', border: '1px solid ' + (done ? 'rgba(53,208,127,.25)' : 'rgba(255,255,255,.07)') }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 7, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#35d07f' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (done ? '#35d07f' : 'rgba(255,255,255,.18)') }}>
                  <svg width="11" height="9" viewBox="0 0 12 10" fill="none" style={{ opacity: done ? 1 : 0 }}><path d="M1 5l3.4 3.4L11 1.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span style={{ fontSize: 14 }}>{iconForTask(d)}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 650, textDecoration: done ? 'line-through' : 'none', color: done ? '#8a8a99' : '#f4f4f7' }}>{d.title}</div>
                <span onClick={(e) => { e.stopPropagation(); openTaskEdit(d.id); }} style={{ fontSize: 12, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('planner.edit')}</span>
              </div>
            );
          })}
        </>
      )}

      <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em' }}>{t('plan.ready')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <Pill text={blockWord} color="#c9baff" bg="rgba(124,92,255,.2)" />
          <Pill text={t('plan.studyTime', { time: hm(studyMins) })} color="#e2e2ea" bg="rgba(255,255,255,.07)" />
          <Pill text={t('plan.studyEnd', { time: studyEnd })} color="#e2e2ea" bg="rgba(255,255,255,.07)" />
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>
          {state.planAIRationale || t('plan.considers', { energy: energyPhrase, pref: prefPhrase })}
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.09)', margin: '14px -16px' }} />
        <div style={{ display: 'flex', gap: 9 }}>
          <span style={{ color: '#35d07f', fontSize: 12 }}>✓</span>
          <span style={{ fontSize: 12.5, fontWeight: 650, lineHeight: 1.45, color: '#5fdd9b' }}>{nBlocks === nTasks ? t('plan.allFit') : t('plan.someSkipped')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 11, marginTop: 14 }}>
        <div onClick={toggleManualMode} style={{ flex: 1, height: 48, borderRadius: 15, background: state.manualMode ? 'rgba(124,92,255,.22)' : 'rgba(255,255,255,.055)', border: '1px solid ' + (state.manualMode ? 'rgba(124,92,255,.5)' : 'rgba(255,255,255,.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}>{state.manualMode ? t('plan.saveChanges') : t('plan.editManually')}</div>
        <div onClick={regenerateOrCancel} style={{ flex: 1, height: 48, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}>{state.manualMode ? t('plan.cancel') : t('plan.regenerate')}</div>
      </div>

      <StickyFooter>
        <PrimaryButton onClick={confirmPlan}>{t('plan.confirmPlan')}</PrimaryButton>
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
