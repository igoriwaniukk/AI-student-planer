import { BackButton, StickyFooter, PrimaryButton, ConfirmCard } from '../components/ui';
import { useLang } from '../lib/useLang';
import { REFERENCE_DAY } from '../lib/plannerData';
import { weekdayDateLabel, span, fmt, hm, durOf, startOf } from '../lib/plannerLogic';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import DayTimeline from '../components/DayTimeline';

// Visual language per rescue decision — reused for both the badge and the
// card's own border/background, matching the original hand-drawn design's
// blue/orange/purple scheme for kept/shortened/moved.
const DECISION_STYLE = {
  kept: { badgeColor: '#8fbaff', badgeBg: 'rgba(91,156,255,.16)', border: 'rgba(91,156,255,.35)', bg: 'rgba(91,156,255,.06)' },
  shortened: { badgeColor: '#f5a524', badgeBg: 'rgba(245,165,36,.14)', border: 'rgba(245,165,36,.35)', bg: 'rgba(245,165,36,.06)' },
  moved: { badgeColor: '#c9baff', badgeBg: 'rgba(124,92,255,.22)', border: 'rgba(124,92,255,.4)', bg: 'rgba(124,92,255,.06)' },
};

function pill(color, bg, text) {
  return <span style={{ fontSize: 12, fontWeight: 650, color, padding: '7px 11px', borderRadius: 9, background: bg }}>{text}</span>;
}

export default function RescueResult({ planner }) {
  const { t } = useLang();
  const { state, go, def, confirmRescue, goHomeRescued } = planner;
  const decisions = state.rescueDecisions || {};
  const schedule = state.rescueSchedule || {};
  const ids = Object.keys(decisions);
  const scheduledIds = Object.keys(schedule);
  const movedCount = ids.filter((id) => decisions[id] === 'moved').length;
  const totalMinutes = scheduledIds.reduce((a, id) => a + schedule[id].dur, 0);
  const nBlocks = scheduledIds.length;
  const blockWord = nBlocks === 1 ? t('plan.oneBlock') : (nBlocks > 1 && nBlocks < 5 ? t('plan.fewBlocks', { n: nBlocks }) : t('plan.manyBlocks', { n: nBlocks }));
  const movedWord = movedCount === 1 ? t('rr.movedOne') : (movedCount > 1 && movedCount < 5 ? t('rr.movedFew', { n: movedCount }) : t('rr.movedMany', { n: movedCount }));
  const studyEnd = nBlocks ? fmt(Math.max(...scheduledIds.map((id) => schedule[id].start + schedule[id].dur))) : '—';
  const earliestStart = nBlocks ? Math.min(...scheduledIds.map((id) => schedule[id].start)) : null;

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 116px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackButton onClick={() => go('rescue')} />
        <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff', padding: '8px 14px', borderRadius: 999, background: 'rgba(124,92,255,.14)', border: '1px solid rgba(124,92,255,.45)' }}>{t('rr.readyToReview')}</span>
      </div>
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>{t('rr.title')}</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>{t('rr.date', { date: weekdayDateLabel(REFERENCE_DAY) })}</div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.14)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em', lineHeight: 1.3 }}>{t('rr.kept')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {pill('#c9baff', 'rgba(124,92,255,.2)', blockWord)}
          {pill('#e2e2ea', 'rgba(255,255,255,.07)', t('plan.studyTime', { time: hm(totalMinutes) }))}
          {movedCount > 0 && pill('#c9baff', 'rgba(124,92,255,.2)', movedWord)}
          {pill('#e2e2ea', 'rgba(255,255,255,.07)', t('plan.studyEnd', { time: studyEnd }))}
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 12 }}>{state.rescueRationale || t('rr.protects')}</div>
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('rr.whatChanged')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {ids.map((id) => {
          const d = def(id);
          const decision = decisions[id];
          const style = DECISION_STYLE[decision] || DECISION_STYLE.kept;
          const prev = state.schedule?.[id] || { start: startOf(id, state), dur: durOf(id, state.taskDefs, state.durOverride) };
          const next = schedule[id];
          const badge = decision === 'moved' ? t('rr.moved') : decision === 'shortened' ? t('rr.shortened') : t('rr.stays');
          const from = span(prev.start, prev.start + prev.dur) + ' · ' + prev.dur + ' min';
          const to = next ? span(next.start, next.start + next.dur) + ' · ' + next.dur + ' min' : t('rr.movedToOtherDay');
          return (
            <div key={id} style={{ padding: 14, borderRadius: 18, background: style.bg, border: '1.5px solid ' + style.border }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: d.color, textTransform: 'uppercase' }}>{t(VALUE_KEY[d.subject]) || d.subject}</span>
                <span style={{ fontSize: 10.5, fontWeight: 750, color: style.badgeColor, padding: '4px 9px', borderRadius: 8, background: style.badgeBg }}>{badge}</span>
              </div>
              <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3, marginTop: 7 }}>{t(TASK_TEXT_KEY[id]?.title) || d.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#7a7a8a', textDecoration: 'line-through' }}>{from}</span>
                <span style={{ fontSize: 11, color: '#6b6b7a' }}>→</span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{to}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('rr.newPlanFrom', { time: earliestStart != null ? fmt(earliestStart) : '—' })}</div>
      <DayTimeline schedule={schedule} planner={planner} t={t} compact />

      <div onClick={() => go('rescue')} style={{ marginTop: 14, height: 48, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}>{t('rr.editChanges')}</div>
      <div onClick={() => go('plan')} style={{ marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('rr.backToPrevPlan')}</div>

      <StickyFooter>
        <PrimaryButton onClick={confirmRescue}>{t('rr.confirmNewPlan')}</PrimaryButton>
      </StickyFooter>

      {state.rescueSaved && (
        <ConfirmCard
          title={t('rr.savedTitle')}
          onDone={goHomeRescued}
          buttonLabel={t('rr.backToDayPlan')}
        />
      )}
    </div>
  );
}
