import { hm, fmt } from '../lib/plannerLogic';
import { BackButton, StickyFooter, PrimaryButton, ConfirmCard, Pill } from '../components/ui';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';
import BlockEditSheet from '../components/BlockEditSheet';
import DayTimeline from '../components/DayTimeline';

export default function Plan({ planner }) {
  const { t } = useLang();
  const { state, update, toggleManualMode, regenerateOrCancel, confirmPlan, goHomeSaved, go } = planner;
  const sched = state.schedule || {};
  const schedIds = Object.keys(sched);
  const nBlocks = schedIds.length;
  const nTasks = state.tasks.filter(Boolean).length;
  const studyMins = schedIds.reduce((a, k) => a + sched[k].dur, 0);
  const studyEnd = nBlocks ? fmt(Math.max(...schedIds.map((k) => sched[k].start + sched[k].dur))) : '—';
  const blockWord = nBlocks === 1 ? t('plan.oneBlock') : (nBlocks > 1 && nBlocks < 5 ? t('plan.fewBlocks', { n: nBlocks }) : t('plan.manyBlocks', { n: nBlocks }));
  const energyPhrase = state.energy === 'Niska' ? t('plan.energyLow') : state.energy === 'Wysoka' ? t('plan.energyHigh') : t('plan.energyNormal');
  const prefPhrase = state.pref === 'Więcej krótkich przerw' ? t('plan.prefBreaks') : state.pref === 'Najpierw najtrudniejsze' ? t('plan.prefHardest') : t('plan.prefFree');

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('planner')} />
        <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff', padding: '8px 14px', borderRadius: 999, background: 'rgba(124,92,255,.14)', border: '1px solid rgba(124,92,255,.45)' }}>{t('plan.readyToReview')}</span>
      </div>
      <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 20 }}>{t('plan.date')}</div>
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 6 }}>{t('plan.title')}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 12px 2px' }}>
        <span style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('plan.dayPlan')}</span>
        {state.manualMode && <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff' }}>{t('plan.manualMode')}</span>}
      </div>
      <DayTimeline schedule={state.schedule} planner={planner} t={t} />

      <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em' }}>{t('plan.ready')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          <Pill text={blockWord} color="#c9baff" bg="rgba(124,92,255,.2)" />
          <Pill text={t('plan.studyTime', { time: hm(studyMins) })} color="#e2e2ea" bg="rgba(255,255,255,.07)" />
          <Pill text={t('plan.studyEnd', { time: studyEnd })} color="#e2e2ea" bg="rgba(255,255,255,.07)" />
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>{t('plan.considers', { energy: energyPhrase, pref: prefPhrase })}</div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.09)', margin: '14px -16px' }} />
        <div style={{ display: 'flex', gap: 9 }}>
          <span style={{ color: '#35d07f', fontSize: 12 }}>✓</span>
          <span style={{ fontSize: 12.5, fontWeight: 650, lineHeight: 1.45, color: '#5fdd9b' }}>{nBlocks === nTasks ? t('plan.allFit') : t('plan.someSkipped')}</span>
        </div>
      </div>

      <div onClick={() => update((s) => ({ gcal: !s.gcal }))} style={{ marginTop: 14, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 13, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 26, flex: 'none', borderRadius: 99, padding: 3, display: 'flex', alignItems: 'center', background: state.gcal ? '#7c5cff' : 'rgba(255,255,255,.14)', justifyContent: state.gcal ? 'flex-end' : 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{t('plan.addToCalendar')}</div>
          <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 4 }}>{t('plan.addToCalendarDesc', { blocks: blockWord.toLowerCase() })}</div>
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
          title={t('plan.savedTitle')}
          sub={state.gcal ? t('plan.savedGcal', { n: schedIds.length }) : null}
          onDone={goHomeSaved}
          buttonLabel={t('plan.goToPlan')}
        />
      )}
    </div>
  );
}
