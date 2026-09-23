import { useState } from 'react';
import { HARD_OPTIONS, KNOW_OPTIONS, DAY_HARD_OPTIONS, NUM_TODAY } from '../lib/plannerData';
import { hm, zad, weekdayDateLabel, daySessionBreakdown, statusOn, localDateKey } from '../lib/plannerLogic';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { BackButton, StickyFooter, PrimaryButton, EnergyPicker, OptionRow, ListRow, Chip, Confetti } from '../components/ui';
import AmbientGlow from '../components/AmbientGlow';
import { useLang } from '../lib/useLang';

export default function Summary({ planner, recordStudyDay = () => {} }) {
  const { t } = useLang();
  const { state, def, go, finishDay, setUnfinishedChoice, saveLater, adjustSessionMinutes, setSessionField, update } = planner;
  const saved = state.daySummaries?.[localDateKey()];
  if (saved) {
    return <DaySaved planner={planner} summary={saved} justSaved={!!state.daySaved} />;
  }

  const sched = state.schedule || {};
  const { planned, done: completedIds, unfinished } = daySessionBreakdown(state, NUM_TODAY);
  const doneCount = completedIds.length;
  const totalCount = planned.filter((id) => statusOn(state, id, NUM_TODAY) !== 'skipped').length + unfinished.filter((id) => !sched[id]).length;
  const planOf = (id) => (sched[id] && sched[id].dur) || def(id).dur;
  const plannedMins = completedIds.reduce((a, id) => a + planOf(id), 0);
  const totalActualMinutes = completedIds.reduce((a, id) => a + (state.sessionReview[id]?.minutes || 0), 0);
  const totalDiffVal = totalActualMinutes - plannedMins;
  const sign = (n) => (n >= 0 ? '+' : '') + n;
  const choices = state.unfinishedChoices || {};
  const movedPick = unfinished.filter((id) => choices[id] !== 'drop').length;
  const droppedPick = unfinished.length - movedPick;
  // A math-specific follow-up observation ("math took longer than planned")
  // only makes sense when math was actually part of today's plan.
  const mathIncludedToday = completedIds.includes('math');
  const mathPlan = mathIncludedToday ? planOf('math') : 0;
  const mathDelta = mathIncludedToday ? (state.sessionReview.math?.minutes || 0) - mathPlan : 0;
  const hasObservation = mathIncludedToday && mathDelta !== 0;
  const titleOf = (id) => t(TASK_TEXT_KEY[id]?.title) || def(id).title;

  return (
    <>
    <AmbientGlow />
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 116px', position: 'relative', zIndex: 1 }}>
      <BackButton onClick={() => go('home')} />
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>{t('sum.title')}</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>{t('sum.date', { date: weekdayDateLabel(NUM_TODAY) })}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#8a8a99', marginTop: 6 }}>{t('sum.subtitle')}</div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em' }}>{t('sum.todayPlan')}</div>
        {totalCount === 0 && <div style={{ fontSize: 12.5, color: '#8a8a99', marginTop: 10 }}>{t('sum.noSessions')}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#35d07f', fontSize: 12 }}>✓</span><span style={{ fontSize: 13, fontWeight: 650, color: '#5fdd9b' }}>{t('sum.doneOfTotal', { done: doneCount, total: totalCount })}</span></div>
          {unfinished.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#f5a524', fontSize: 12 }}>!</span><span style={{ fontSize: 13, color: '#f7c46c' }}>{t('sum.unfinishedCount', { n: unfinished.length })}</span></div>
          )}
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '14px -16px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <Row label={t('sum.plannedTime')} value={hm(plannedMins)} />
          <Row label={t('sum.actualTime')} value={hm(totalActualMinutes)} />
          <Row label={t('sum.diff')} value={sign(totalDiffVal) + ' min'} color="#8fbaff" />
        </div>
      </div>

      {completedIds.length > 0 && <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('sum.howSessions')}</div>}

      {completedIds.map((id, i) => {
        const d = def(id);
        const review = state.sessionReview[id] || {};
        const plan = planOf(id);
        const diffVal = (review.minutes || 0) - plan;
        return (
          <div key={id}>
            {i > 0 && <div style={{ height: 12 }} />}
            <SessionReview
              subject={(t(VALUE_KEY[d.subject]) || d.subject || '').toUpperCase()} subjectColor={d.color}
              title={titleOf(id)} deadline={d.deadline ? (t(TASK_TEXT_KEY[id]?.deadline) || d.deadline) : null}
              planned={t('sum.plan', { min: plan })} actual={(review.minutes || 0) + ' min'} diff={sign(diffVal) + ' min'}
              onMinus={() => adjustSessionMinutes(id, -5)} onPlus={() => adjustSessionMinutes(id, 5)}
              hard={review.hard} onHard={(x) => setSessionField(id, 'hard', x)}
              know={review.know} onKnow={(x) => setSessionField(id, 'know', x)}
              t={t}
            />
          </div>
        );
      })}

      {unfinished.length > 0 && (
        <>
          <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 6px' }}>{t('sum.unfinishedTitle')}</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.45, color: '#8a8a99', marginBottom: 12 }}>{t('sum.unfinishedDesc')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {unfinished.map((id) => {
              const d = def(id);
              const drop = choices[id] === 'drop';
              return (
                <div key={id} style={{ padding: 14, borderRadius: 18, background: 'rgba(245,165,36,.05)', border: '1px solid rgba(245,165,36,.25)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: d.color }}>{(t(VALUE_KEY[d.subject]) || d.subject || '').toUpperCase()}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 750, color: '#f7c46c', padding: '4px 9px', borderRadius: 8, background: 'rgba(245,165,36,.14)' }}>{t('sum.notDoneBadge')}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, marginTop: 7 }}>{titleOf(id)}</div>
                  <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
                    <OptionRow label={t('sum.moveTomorrow')} active={!drop} onClick={() => setUnfinishedChoice(id, 'tomorrow')} />
                    <OptionRow label={t('sum.drop')} active={drop} onClick={() => setUnfinishedChoice(id, 'drop')} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('sum.howHardDay')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {DAY_HARD_OPTIONS.map((x) => <Chip key={x} label={t(VALUE_KEY[x]) || x} active={state.dayHard === x} onClick={() => update({ dayHard: x })} />)}
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('sum.howMuchEnergy')}</div>
      <EnergyPicker value={state.dayEnergy} onChange={(v) => update({ dayEnergy: v })} />

      <div style={{ fontSize: 14.5, fontWeight: 700, margin: '22px 0 11px' }}>{t('sum.whatBothered')}</div>
      <textarea
        placeholder={t('sum.bothersPlaceholder')}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 88, borderRadius: 16, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: 14, fontSize: 13.5, lineHeight: 1.5, color: '#f4f4f7', fontFamily: 'inherit', resize: 'vertical' }}
      />

      {hasObservation && (
        <>
          <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('sum.conclusion')}</div>
          <div style={{ padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.08)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{t('sum.mathTookLonger', { min: Math.abs(mathDelta), word: mathDelta > 0 ? t('sum.longer') : t('sum.shorter') })}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 9 }}>{t('sum.reserveNote', { actual: state.sessionReview.math?.minutes || 0, planned: mathPlan })}</div>
            <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
              <div onClick={() => update({ adaptive: true })} style={{ flex: 1.4, minHeight: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1.25, padding: 8, fontSize: 12.5, fontWeight: 650, cursor: 'pointer', background: state.adaptive ? 'rgba(124,92,255,.16)' : 'rgba(255,255,255,.05)', border: '1.5px solid ' + (state.adaptive ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.1)'), color: state.adaptive ? '#e6dfff' : '#c9c9d6' }}>{t('sum.applyFuture')}</div>
              <div onClick={() => update({ adaptive: false })} style={{ flex: 1, minHeight: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, cursor: 'pointer', background: !state.adaptive ? 'rgba(124,92,255,.16)' : 'rgba(255,255,255,.05)', border: '1.5px solid ' + (!state.adaptive ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.1)'), color: !state.adaptive ? '#e6dfff' : '#c9c9d6' }}>{t('sum.notNow')}</div>
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 12 }}>{t('sum.oneObservation')}</div>
          </div>
        </>
      )}

      <div style={{ marginTop: 14, padding: 15, borderRadius: 18, background: 'rgba(46,230,197,.06)', border: '1px solid rgba(46,230,197,.22)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#8ff0de' }}>{t('sum.tipTomorrow')}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.5, fontWeight: 650, marginTop: 9 }}>
          {movedPick > 0 ? t('sum.tipUnfinished') : t('sum.tipHardest')}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('sum.beforeSaving')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
          {completedIds.map((id) => {
            const d = def(id);
            return <Row key={id} label={t(VALUE_KEY[d.subject]) || d.subject || titleOf(id)} value={t('sum.doneIn', { min: state.sessionReview[id]?.minutes || 0 })} />;
          })}
          {unfinished.length > 0 && <Row label={t('sum.unfinishedTitle')} value={t('sum.unfinishedRow', { moved: movedPick, dropped: droppedPick })} />}
          <Row label={t('sum.day')} value={t('sum.dayValue', { value: t(VALUE_KEY[state.dayHard]) || state.dayHard })} />
          <Row label={t('sum.energy')} value={t('sum.energyValue', { value: t(VALUE_KEY[state.dayEnergy]) || state.dayEnergy })} />
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '15px -16px' }} />
        <div style={{ fontSize: 12.5, lineHeight: 1.45, color: state.adaptive ? '#c9baff' : '#a3a3b3' }}>
          {(state.adaptive && mathDelta !== 0) ? t('sum.futureMathBlocks', { min: state.sessionReview.math?.minutes || 0 }) : t('sum.noChangeEstimates')}
        </div>
      </div>

      <div onClick={saveLater} style={{ marginTop: 16, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('sum.saveLater')}</div>

      <StickyFooter>
        <PrimaryButton
          onClick={() => {
            recordStudyDay({
              plannedMin: plannedMins,
              actualMin: totalActualMinutes,
              // "Completed" means at least one real task got done today, not
              // every planned one — matches what confirmFinish (usePlanner.js)
              // already credits the moment a single session finishes, so
              // Finish day can only add to that, never contradict it.
              completed: doneCount > 0,
            });
            finishDay({ done: doneCount, total: totalCount, plannedMin: plannedMins, actualMin: totalActualMinutes });
          }}
        >
          {t('sum.finishDay')}
        </PrimaryButton>
      </StickyFooter>
    </div>
    </>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span style={{ color: '#9a9aab' }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || undefined }}>{value}</span>
    </div>
  );
}

function SessionReview({ subject, subjectColor, title, deadline, planned, actual, diff, onMinus, onPlus, hard, onHard, know, onKnow, t }) {
  return (
    <div style={{ padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: subjectColor }}>{subject}</span>
        <span style={{ fontSize: 10.5, fontWeight: 750, color: '#5fdd9b', padding: '4px 9px', borderRadius: 8, background: 'rgba(53,208,127,.14)' }}>{t('sum.done')}</span>
      </div>
      <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3, marginTop: 7 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{planned}</span>
        <span style={{ fontSize: 11, color: '#6b6b7a' }}>→</span>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{actual}</span>
        <span style={{ fontSize: 10.5, fontWeight: 650, color: '#8fbaff', padding: '3px 7px', borderRadius: 7, background: 'rgba(91,156,255,.14)' }}>{diff}</span>
        {deadline && <span style={{ fontSize: 10.5, fontWeight: 650, color: '#f5a524', padding: '3px 7px', borderRadius: 7, background: 'rgba(245,165,36,.13)', border: '1px solid rgba(245,165,36,.28)' }}>{deadline}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12 }}>
        <span style={{ fontSize: 12, color: '#9a9aab', flex: 1 }}>{t('sum.actualTimeLabel')}</span>
        <div onClick={onMinus} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 650, cursor: 'pointer' }}>−</div>
        <div style={{ minWidth: 66, textAlign: 'center', fontSize: 15, fontWeight: 750 }}>{actual}</div>
        <div onClick={onPlus} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 650, cursor: 'pointer' }}>+</div>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', margin: '16px 0 9px' }}>{t('sum.howHardSession')}</div>
      <div style={{ display: 'flex', gap: 9 }}>
        {HARD_OPTIONS.map((x) => <OptionRow key={x} label={t(VALUE_KEY[x]) || x} active={hard === x} onClick={() => onHard(x)} />)}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 650, color: '#c9c9d6', margin: '16px 0 9px' }}>{t('sum.howWellNow')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {KNOW_OPTIONS.map((x, i) => <ListRow key={x} label={t(VALUE_KEY[x]) || x} active={know === x} onClick={() => onKnow(x)} last={i === KNOW_OPTIONS.length - 1} />)}
      </div>
    </div>
  );
}

// Same visual language as the achievement-unlock and rescue-day popups —
// a finished day is worth its own moment, not just another inline card
// buried under the summary stats.
function PlanTomorrowModal({ open, onPlan, onDismiss }) {
  const { t } = useLang();
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: 'rgba(6,6,10,.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 340, padding: 28, borderRadius: 24, background: '#101018', border: '1px solid rgba(255,255,255,.1)', textAlign: 'center', animation: 'stepIconPop .4s cubic-bezier(.34,1.56,.64,1) both' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🗓️</div>
          <Confetti top={20} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.1em', color: '#5fdd9b' }}>{t('sum.planTomorrowBadge')}</div>
        <div style={{ fontSize: 19, fontWeight: 750, marginTop: 8 }}>{t('sum.planTomorrowTitle')}</div>
        <div style={{ fontSize: 13, color: '#a3a3b3', marginTop: 8, lineHeight: 1.5 }}>{t('sum.planTomorrowDesc')}</div>
        <div onClick={onPlan} style={{ marginTop: 20, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{t('home.planTomorrow')}</div>
        <div onClick={onDismiss} style={{ marginTop: 14, fontSize: 13, fontWeight: 650, color: '#8a8a99', cursor: 'pointer' }}>{t('home.later')}</div>
      </div>
    </div>
  );
}

function DaySaved({ planner, summary, justSaved }) {
  const { t, lang } = useLang();
  const { state, goHomeSummarized, update } = planner;
  const planTomorrow = () => update({ daySaved: false, planToday: false, screen: 'planner' });
  const doneCount = summary.done || 0;
  const celebrate = justSaved && summary.total > 0 && doneCount === summary.total;
  const [planModalOpen, setPlanModalOpen] = useState(celebrate);
  const doneShort = lang === 'en'
    ? t('sum.doneOfTotal', { done: doneCount, total: summary.total || 0 })
    : zad(doneCount) + (doneCount >= 1 && doneCount <= 4 ? ' wykonane' : ' wykonanych') + ' z ' + (summary.total || 0);
  return (
    <div className="sc" style={{ position: 'absolute', inset: 0, zIndex: 80, background: '#08080c', overflowY: 'auto', padding: '80px 20px 40px' }}>
      {celebrate && <Confetti />}
      <div style={{ width: 52, height: 52, borderRadius: 17, background: 'rgba(53,208,127,.14)', border: '1px solid rgba(53,208,127,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="15" viewBox="0 0 13 11" fill="none"><path d="M1 5.6L4.6 9.4 12 1.6" stroke="#35d07f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <div style={{ fontSize: 28, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>{t('sum.daySummarized')}</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>{weekdayDateLabel(NUM_TODAY)}</div>
      {justSaved && <div style={{ fontSize: 13.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{t('sum.savedDesc')}</div>}

      <div style={{ marginTop: 20, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#35d07f', fontSize: 12 }}>✓</span><span style={{ fontSize: 13.5, fontWeight: 650, color: '#5fdd9b' }}>{doneShort}</span></div>
        {summary.moved > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#8a8a99', fontSize: 12 }}>→</span><span style={{ fontSize: 13.5, color: '#c9c9d6' }}>{t('sum.movedToTomorrowN', { n: summary.moved })}</span></div>}
        {summary.dropped > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#8a8a99', fontSize: 12 }}>×</span><span style={{ fontSize: 13.5, color: '#c9c9d6' }}>{t('sum.droppedN', { n: summary.dropped })}</span></div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#8a8a99', fontSize: 12 }}>•</span><span style={{ fontSize: 13.5, color: '#c9c9d6' }}>{t('sum.realStudyTime', { time: hm(summary.actualMin || 0) })}</span></div>
      </div>

      {justSaved && state.adaptive && state.sessionReview.math && state.sessionReview.math.minutes !== 70 && (
        <div style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(124,92,255,.07)', border: '1px solid rgba(124,92,255,.3)', fontSize: 12.5, lineHeight: 1.5, fontWeight: 650, color: '#c9baff' }}>
          {t('sum.similarMathTasks', { min: state.sessionReview.math.minutes })}
        </div>
      )}

      <div onClick={planTomorrow} style={{ marginTop: 12, height: 56, borderRadius: 17, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 30px rgba(109,77,255,.35)' }}>{t('home.planTomorrow')}</div>
      <div onClick={goHomeSummarized} style={{ marginTop: 12, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 650, cursor: 'pointer' }}>{t('sum.backToStart')}</div>

      <PlanTomorrowModal open={planModalOpen} onPlan={planTomorrow} onDismiss={() => setPlanModalOpen(false)} />
    </div>
  );
}
