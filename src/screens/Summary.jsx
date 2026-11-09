import { useState } from 'react';
import { HARD_OPTIONS, KNOW_OPTIONS, DAY_HARD_OPTIONS, NUM_TODAY } from '../lib/plannerData';
import { hm, pluralForm, weekdayDateLabel, daySessionBreakdown, statusOn, localDateKey, dayOpenTasks, planFor } from '../lib/plannerLogic';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { iconForTask } from '../lib/taskAuto';
import { BackButton, StickyFooter, PrimaryButton, EnergyPicker, Chip, Confetti } from '../components/ui';
import { Eyebrow, Check, SettingRow, ROW_LINE } from '../components/ListRows';
import { useLang } from '../lib/useLang';

export default function Summary({ planner, recordStudyDay = () => {} }) {
  const { t } = useLang();
  const { state, def, go, finishDay, setUnfinishedChoice, saveLater, adjustSessionMinutes, setSessionField, update } = planner;
  const [open, setOpen] = useState(null);
  const saved = state.daySummaries?.[localDateKey()];
  if (saved) {
    return <DaySaved planner={planner} summary={saved} justSaved={!!state.daySaved} />;
  }

  const sched = planFor(state, NUM_TODAY) || {};
  const { planned, done, offPlanDone, unfinished } = daySessionBreakdown(state, NUM_TODAY);
  const completedIds = done.concat(offPlanDone);
  const doneCount = completedIds.length;
  const totalCount = planned.filter((id) => statusOn(state, id, NUM_TODAY) !== 'skipped').length + unfinished.filter((id) => !sched[id]).length + offPlanDone.length;
  const planOf = (id) => (sched[id] && sched[id].dur) || def(id).dur;
  const plannedMins = completedIds.reduce((a, id) => a + planOf(id), 0);
  const totalActualMinutes = completedIds.reduce((a, id) => a + (state.sessionReview[id]?.minutes || 0), 0);
  const choices = state.unfinishedChoices || {};
  // Everything left open today: unfinished sessions plus open to-dos and
  // unplanned tasks. One-offs stay on the list (or are let go) — nothing is
  // moved to a date; a repeating task's occurrence just counts as missed.
  const leftover = unfinished.concat(dayOpenTasks(state, NUM_TODAY).map((d) => d.id));
  const repeats = (id) => !!def(id)?.repeatDays?.length;
  const choosable = leftover.filter((id) => !repeats(id));
  const droppedPick = choosable.filter((id) => choices[id] === 'drop').length;
  const keptPick = choosable.length - droppedPick;
  // A math-specific follow-up observation ("math took longer than planned")
  // only makes sense when math was actually part of today's plan.
  const mathIncludedToday = completedIds.includes('math');
  const mathPlan = mathIncludedToday ? planOf('math') : 0;
  const mathDelta = mathIncludedToday ? (state.sessionReview.math?.minutes || 0) - mathPlan : 0;
  const hasObservation = mathIncludedToday && mathDelta !== 0;
  const titleOf = (id) => t(TASK_TEXT_KEY[id]?.title) || def(id).title;

  const toggle = (k) => setOpen((o) => (o === k ? null : k));
  const iconOf = (id) => iconForTask(def(id));

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 20px 210px', position: 'relative', zIndex: 1 }}>
      <BackButton onClick={() => go('home')} />
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em', marginTop: 14 }}>{t('sum.title')}</div>
      <div style={{ fontSize: 14, color: '#a3a3b3', marginTop: 6 }}>
        {totalCount === 0 ? t('sum.noSessions') : t('sum.headline', { done: doneCount, total: totalCount, time: hm(totalActualMinutes) })}
      </div>

      {completedIds.length > 0 && <Eyebrow text={t('sum.sessionsLabel')} />}
      {completedIds.map((id) => {
        const review = state.sessionReview[id] || {};
        const plan = planOf(id);
        const key = 'session-' + id;
        return (
          <div key={id} style={{ borderBottom: ROW_LINE }}>
            <div role="button" onClick={() => toggle(key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', cursor: 'pointer' }}>
              <Check on color="#35d07f" />
              <span style={{ fontSize: 17, width: 22, textAlign: 'center', flex: 'none' }}>{iconOf(id)}</span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700 }}>{titleOf(id)}</div>
              <span style={{ fontSize: 13.5, fontWeight: 650, color: '#c9baff', whiteSpace: 'nowrap' }}>
                {hm(review.minutes || 0)} <span style={{ display: 'inline-block', color: '#6b6b7a', transform: open === key ? 'rotate(90deg)' : 'none' }}>›</span>
              </span>
            </div>
            {open === key && (
              <div style={{ padding: '0 0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 13, color: '#9a9aab', flex: 1 }}>{t('sum.actualTimeLabel')} <span style={{ color: '#6b6b7a' }}>· {t('sum.plan', { min: plan })}</span></span>
                  <div role="button" onClick={() => adjustSessionMinutes(id, -5)} style={STEP}>−</div>
                  <div style={{ minWidth: 60, textAlign: 'center', fontSize: 15, fontWeight: 750 }}>{review.minutes || 0} min</div>
                  <div role="button" onClick={() => adjustSessionMinutes(id, 5)} style={STEP}>+</div>
                </div>
                <div style={SUBQ}>{t('sum.howHardSession')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {HARD_OPTIONS.map((x) => <Chip key={x} label={t(VALUE_KEY[x]) || x} active={review.hard === x} onClick={() => setSessionField(id, 'hard', x)} />)}
                </div>
                <div style={SUBQ}>{t('sum.howWellNow')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {KNOW_OPTIONS.map((x) => <Chip key={x} label={t(VALUE_KEY[x]) || x} active={review.know === x} onClick={() => setSessionField(id, 'know', x)} />)}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {leftover.length > 0 && (
        <>
          <Eyebrow text={t('sum.unfinishedTitle')} />
          {leftover.map((id) => {
            const drop = choices[id] === 'drop';
            return (
              <div key={id} style={{ padding: '12px 0', borderBottom: ROW_LINE }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 17, width: 22, textAlign: 'center', flex: 'none', opacity: drop ? 0.5 : 1 }}>{iconOf(id)}</span>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: drop ? '#8a8a99' : '#f4f4f7', textDecoration: drop ? 'line-through' : 'none' }}>{titleOf(id)}</div>
                </div>
                {repeats(id) ? (
                  <div style={{ fontSize: 12.5, color: '#8a8a99', margin: '6px 0 0 34px' }}>↻ {t('sum.missedToday')}</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, margin: '9px 0 0 34px' }}>
                    <Chip label={t('sum.keep')} active={!drop} onClick={() => setUnfinishedChoice(id, 'keep')} />
                    <Chip label={t('sum.drop')} active={drop} onClick={() => setUnfinishedChoice(id, 'drop')} />
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      <Eyebrow text={t('planner.yourDay')} />
      <SettingRow icon="🌡️" label={t('sum.day')} value={t(VALUE_KEY[state.dayHard]) || state.dayHard} open={open === 'day'} onClick={() => toggle('day')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {DAY_HARD_OPTIONS.map((x) => <Chip key={x} label={t(VALUE_KEY[x]) || x} active={state.dayHard === x} onClick={() => update({ dayHard: x })} />)}
        </div>
      </SettingRow>
      <SettingRow icon="⚡" label={t('sum.energy')} value={t(VALUE_KEY[state.dayEnergy]) || state.dayEnergy} open={open === 'energy'} onClick={() => toggle('energy')}>
        <EnergyPicker value={state.dayEnergy} onChange={(v) => update({ dayEnergy: v })} />
      </SettingRow>
      <SettingRow icon="📝" label={t('sum.noteRow')} value="" open={open === 'note'} onClick={() => toggle('note')}>
        <div style={{ fontSize: 13, color: '#9a9aab', marginBottom: 9 }}>{t('sum.whatBothered')}</div>
        <textarea
          placeholder={t('sum.bothersPlaceholder')}
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 84, borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: 13, fontSize: 13.5, lineHeight: 1.5, color: '#f4f4f7', fontFamily: 'inherit', resize: 'vertical' }}
        />
      </SettingRow>

      {hasObservation && (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{t('sum.mathTookLonger', { min: Math.abs(mathDelta), word: mathDelta > 0 ? t('sum.longer') : t('sum.shorter') })}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
            <Chip label={t('sum.applyFuture')} active={!!state.adaptive} onClick={() => update({ adaptive: true })} />
            <Chip label={t('sum.notNow')} active={!state.adaptive} onClick={() => update({ adaptive: false })} />
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, fontSize: 13.5, lineHeight: 1.5, color: '#8ff0de' }}>💡 {keptPick > 0 ? t('sum.tipUnfinished') : t('sum.tipHardest')}</div>

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
        <div role="button" onClick={saveLater} style={{ textAlign: 'center', fontSize: 13.5, fontWeight: 650, color: '#a58cff', marginTop: 12, cursor: 'pointer' }}>{t('sum.saveLater')}</div>
      </StickyFooter>
    </div>
    </>
  );
}

const STEP = { width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 650, cursor: 'pointer' };
const SUBQ = { fontSize: 13, fontWeight: 650, color: '#c9c9d6', margin: '14px 0 9px' };

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
  const { t } = useLang();
  const { state, goHomeSummarized, update } = planner;
  const planTomorrow = () => update({ daySaved: false, planToday: false, screen: 'planner' });
  const doneCount = summary.done || 0;
  const celebrate = justSaved && summary.total > 0 && doneCount === summary.total;
  const [planModalOpen, setPlanModalOpen] = useState(celebrate);
  const doneShort = t('sum.doneShort.' + pluralForm(doneCount), { done: doneCount, total: summary.total || 0 });
  return (
    <div className="sc" style={{ position: 'absolute', inset: 0, zIndex: 80, background: '#08080c', overflowY: 'auto', padding: '40px 20px 40px' }}>
      {celebrate && <Confetti />}
      <div style={{ width: 52, height: 52, borderRadius: 17, background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="15" viewBox="0 0 13 11" fill="none"><path d="M1 5.6L4.6 9.4 12 1.6" stroke="#a58cff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <div style={{ fontSize: 28, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>{t('sum.daySummarized')}</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>{weekdayDateLabel(NUM_TODAY)}</div>
      {justSaved && <div style={{ fontSize: 13.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{t('sum.savedDesc')}</div>}

      <div style={{ marginTop: 20, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#35d07f', fontSize: 12 }}>✓</span><span style={{ fontSize: 13.5, fontWeight: 650, color: '#5fdd9b' }}>{doneShort}</span></div>
        {summary.kept > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#8a8a99', fontSize: 12 }}>↺</span><span style={{ fontSize: 13.5, color: '#c9c9d6' }}>{t('sum.keptN', { n: summary.kept })}</span></div>}
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
