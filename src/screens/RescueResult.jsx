import { useState } from 'react';
import { BackButton, StickyFooter, PrimaryButton, ConfirmCard } from '../components/ui';
import { useLang } from '../lib/useLang';
import { fmt, hm, pluralForm } from '../lib/plannerLogic';
import { TASK_TEXT_KEY } from '../lib/i18n';
import { iconForTask } from '../lib/taskAuto';
import PlanTimeline from '../components/PlanTimeline';
import { Eyebrow, ROW_LINE } from '../components/ListRows';

// Restart's proposed plan for the rest of today, in the same timeline look
// as the day plan (see Plan.jsx): one summary line, the timeline, and the
// tasks that had to move to another day.
export default function RescueResult({ planner }) {
  const { t } = useLang();
  const { state, go, def, confirmRescue, goHomeRescued } = planner;
  const [whyOpen, setWhyOpen] = useState(false);
  const decisions = state.rescueDecisions || {};
  const schedule = state.rescueSchedule || {};
  const scheduledIds = Object.keys(schedule);
  const movedIds = Object.keys(decisions).filter((id) => decisions[id] === 'moved' && !schedule[id] && def(id));
  const totalMinutes = scheduledIds.reduce((a, id) => a + schedule[id].dur, 0);
  const nBlocks = scheduledIds.length;
  const studyEnd = nBlocks ? fmt(Math.max(...scheduledIds.map((id) => schedule[id].start + schedule[id].dur))) : null;
  const summary = nBlocks
    ? [t('plan.sessions.' + pluralForm(nBlocks), { n: nBlocks }), hm(totalMinutes), t('plan.doneBy', { time: studyEnd })].join(' · ')
    : t('plan.noSessions');

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 20px 210px', position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('rescue')} />
        <span role="button" onClick={() => go('rescue')} style={{ fontSize: 14, fontWeight: 700, color: '#a58cff', cursor: 'pointer', padding: '8px 2px' }}>{t('planner.edit')}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginTop: 14 }}>{t('rr.title')}</div>
      <div style={{ fontSize: 14, color: '#a3a3b3', marginTop: 6 }}>{summary}</div>

      <div style={{ marginTop: 14 }}>
        <PlanTimeline schedule={schedule} planner={planner} readOnly />
      </div>

      {movedIds.length > 0 && (
        <>
          <Eyebrow text={t('rr.movedToOtherDay')} />
          {movedIds.map((id) => {
            const d = def(id);
            return (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: ROW_LINE }}>
                <span style={{ fontSize: 17, width: 22, textAlign: 'center', flex: 'none' }}>{iconForTask(d)}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: '#c9c9d6' }}>{t(TASK_TEXT_KEY[id]?.title) || d.title}</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#c9baff', padding: '4px 9px', borderRadius: 8, background: 'rgba(124,92,255,.18)' }}>{t('rr.moved')}</span>
              </div>
            );
          })}
        </>
      )}

      {state.rescueRationale && (
        whyOpen
          ? <div onClick={() => setWhyOpen(false)} style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', fontSize: 13, lineHeight: 1.5, color: '#c9c9d6', cursor: 'pointer' }}>🐾 {state.rescueRationale}</div>
          : <div role="button" onClick={() => setWhyOpen(true)} style={{ marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#8a8a99', cursor: 'pointer' }}>{t('plan.whyPlan')} ›</div>
      )}

      <StickyFooter>
        <PrimaryButton onClick={confirmRescue}>{t('rr.confirmNewPlan')}</PrimaryButton>
        <div role="button" onClick={() => go('plan')} style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 650, color: '#a58cff', marginTop: 12, cursor: 'pointer' }}>{t('rr.backToPrevPlan')}</div>
      </StickyFooter>

      {state.rescueSaved && (
        <ConfirmCard
          title={t('rr.savedTitle')}
          onDone={goHomeRescued}
          buttonLabel={t('rr.backToDayPlan')}
        />
      )}
    </div>
    </>
  );
}
