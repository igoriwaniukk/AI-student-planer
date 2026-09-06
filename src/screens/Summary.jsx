import { HARD_OPTIONS, KNOW_OPTIONS, DAY_HARD_OPTIONS } from '../lib/plannerData';
import { hm, toMinutes, fmt, zad } from '../lib/plannerLogic';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { BackButton, StickyFooter, PrimaryButton, EnergyPicker, OptionRow, ListRow, Chip, BottomSheet } from '../components/ui';
import { useLang } from '../lib/useLang';

export default function Summary({ planner, recordStudyDay = () => {} }) {
  const { t, lang } = useLang();
  const { state, def, ts, go, finishDay, saveLater, bioAdjust, mathAdjust, update } = planner;
  const sched = state.schedule || {};
  const dayIds = state.taskDefs.filter((_, i) => state.tasks[i]).map((tt) => tt.id);
  const doneCount = dayIds.filter((id) => ts(id).status === 'completed').length;
  const movedCount = dayIds.filter((id) => ts(id).status === 'moved').length;
  const totalCount = dayIds.filter((id) => ts(id).status !== 'skipped').length;
  const planOf = (id) => (sched[id] && sched[id].dur) || def(id).dur;
  const bioPlan = planOf('bio');
  const mathPlan = planOf('math');
  const plannedMins = dayIds.filter((id) => ts(id).status === 'completed').reduce((a, id) => a + planOf(id), 0);
  const mathDelta = state.mathMinutes - mathPlan;
  const bioDiffVal = state.bioMinutes - bioPlan;
  const mathDiffVal = state.mathMinutes - mathPlan;
  const totalDiffVal = state.bioMinutes + state.mathMinutes - plannedMins;
  const sign = (n) => (n >= 0 ? '+' : '') + n;
  const hasObservation = mathDelta !== 0;

  if (state.daySaved) {
    return <DaySaved planner={planner} doneCount={doneCount} movedCount={movedCount} celebrate={totalCount > 0 && doneCount === totalCount} />;
  }

  return (
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '56px 20px 116px' }}>
      <BackButton onClick={() => go('home')} />
      <div style={{ fontSize: 29, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>{t('sum.title')}</div>
      <div style={{ fontSize: 13.5, fontWeight: 650, color: '#c9c9d6', marginTop: 8 }}>{t('sum.date')}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#8a8a99', marginTop: 6 }}>{t('sum.subtitle')}</div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-.01em' }}>{t('sum.todayPlan')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#35d07f', fontSize: 12 }}>✓</span><span style={{ fontSize: 13, fontWeight: 650, color: '#5fdd9b' }}>{t('sum.doneOfTotal', { done: doneCount, total: totalCount })}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#8a8a99', fontSize: 12 }}>→</span><span style={{ fontSize: 13, color: '#c9c9d6' }}>{lang === 'en' ? t('sum.movedTasks', { n: movedCount, word: movedCount === 1 ? t('sum.movedOne') : t('sum.movedMany') }) : zad(movedCount) + ' ' + (movedCount === 1 ? t('sum.movedOne') : t('sum.movedMany'))}</span></div>
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '14px -16px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <Row label={t('sum.plannedTime')} value={hm(plannedMins)} />
          <Row label={t('sum.actualTime')} value={hm(state.bioMinutes + state.mathMinutes)} />
          <Row label={t('sum.diff')} value={sign(totalDiffVal) + ' min'} color="#8fbaff" />
        </div>
        {movedCount > 0 && <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#7a7a8a', marginTop: 13 }}>{t('sum.movedNote')}</div>}
      </div>

      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('sum.howSessions')}</div>

      <SessionReview
        subject={(t(VALUE_KEY.Biologia) || 'Biologia').toUpperCase()} subjectColor="#2ee6c5" title={t(TASK_TEXT_KEY.bio.title)}
        planned={t('sum.plan', { min: bioPlan })} actual={state.bioMinutes + ' min'} diff={sign(bioDiffVal) + ' min'}
        onMinus={() => bioAdjust(-5)} onPlus={() => bioAdjust(5)}
        hard={state.bioHard} onHard={(x) => update({ bioHard: x })}
        know={state.bioKnow} onKnow={(x) => update({ bioKnow: x })}
        t={t}
      />
      <div style={{ height: 12 }} />
      <SessionReview
        subject={(t(VALUE_KEY.Matematyka) || 'Matematyka').toUpperCase()} subjectColor="#a58cff" title={t(TASK_TEXT_KEY.math.title)} deadline={t(TASK_TEXT_KEY.math.deadline)}
        planned={t('sum.plan', { min: mathPlan })} actual={state.mathMinutes + ' min'} diff={sign(mathDiffVal) + ' min'}
        onMinus={() => mathAdjust(-5)} onPlus={() => mathAdjust(5)}
        hard={state.mathHard} onHard={(x) => update({ mathHard: x })}
        know={state.mathKnow} onKnow={(x) => update({ mathKnow: x })}
        t={t}
      />

      {movedCount > 0 && <MovedTask planner={planner} t={t} />}

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
            <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 9 }}>{t('sum.reserveNote', { actual: state.mathMinutes, planned: mathPlan })}</div>
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
          {movedCount > 0
            ? t('sum.tipMoved', { time: state.engStart })
            : t('sum.tipHardest')}
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: 9.5, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('sum.beforeSaving')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
          <Row label={t('sum.biology')} value={t('sum.doneIn', { min: state.bioMinutes })} />
          <Row label={t('sum.math')} value={t('sum.doneIn', { min: state.mathMinutes })} />
          {movedCount > 0 && <Row label={t('sum.english2')} value={t('sum.tomorrowAt', { time: state.engStart })} />}
          <Row label={t('sum.day')} value={t('sum.dayValue', { value: t(VALUE_KEY[state.dayHard]) || state.dayHard })} />
          <Row label={t('sum.energy')} value={t('sum.energyValue', { value: t(VALUE_KEY[state.dayEnergy]) || state.dayEnergy })} />
        </div>
        <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '15px -16px' }} />
        <div style={{ fontSize: 12.5, lineHeight: 1.45, color: state.adaptive ? '#c9baff' : '#a3a3b3' }}>
          {(state.adaptive && mathDelta !== 0) ? t('sum.futureMathBlocks', { min: state.mathMinutes }) : t('sum.noChangeEstimates')}
        </div>
      </div>

      <div onClick={saveLater} style={{ marginTop: 16, textAlign: 'center', fontSize: 13, fontWeight: 650, color: '#a58cff', cursor: 'pointer' }}>{t('sum.saveLater')}</div>

      <StickyFooter>
        <PrimaryButton
          onClick={() => {
            recordStudyDay({
              plannedMin: plannedMins,
              actualMin: state.bioMinutes + state.mathMinutes,
              completed: totalCount > 0 && doneCount === totalCount,
            });
            finishDay();
          }}
        >
          {t('sum.finishDay')}
        </PrimaryButton>
      </StickyFooter>

      <EngTimeSheet planner={planner} />
    </div>
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

function MovedTask({ planner, t }) {
  const { state, keepEngTomorrow, openEngTime } = planner;
  const keepOn = state.engChoice === 'keep';
  return (
    <>
      <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px' }}>{t('sum.movedTaskTitle')}</div>
      <div style={{ padding: 15, borderRadius: 18, background: 'rgba(124,92,255,.06)', border: '1.5px solid rgba(124,92,255,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 750, letterSpacing: '.06em', color: '#a58cff' }}>{t('sum.english')}</span>
          <span style={{ fontSize: 10.5, fontWeight: 750, color: '#c9baff', padding: '4px 9px', borderRadius: 8, background: 'rgba(124,92,255,.22)' }}>{t('sum.movedConsciously')}</span>
        </div>
        <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.3, marginTop: 7 }}>{t('sum.vocabPractice')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#7a7a8a', textDecoration: 'line-through' }}>{t('sum.todayOldTime')}</span>
          <span style={{ fontSize: 11, color: '#6b6b7a' }}>→</span>
          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{state.engDate}, {state.engStart}–{fmt(toMinutes(state.engStart) + 30)}</span>
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{t('sum.movedReason')}</div>
        <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
          <div onClick={keepEngTomorrow} style={{ flex: 1, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, cursor: 'pointer', background: keepOn ? 'rgba(124,92,255,.16)' : 'rgba(255,255,255,.05)', border: '1.5px solid ' + (keepOn ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.1)'), color: keepOn ? '#e6dfff' : '#c9c9d6' }}>{t('sum.keepTomorrow')}</div>
          <div onClick={openEngTime} style={{ flex: 1, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 650, cursor: 'pointer', background: 'rgba(255,255,255,.05)', border: '1.5px solid rgba(255,255,255,.1)', color: '#c9c9d6' }}>{t('sum.changeDeadline')}</div>
        </div>
      </div>
    </>
  );
}

function EngTimeSheet({ planner }) {
  const { t } = useLang();
  const { state, pickEngTime, cancelEngTime, saveEngTime, update } = planner;
  if (!state.engTimeOpen) return null;
  return (
    <BottomSheet>
      <div style={{ fontSize: 17, fontWeight: 750, letterSpacing: '-.01em' }}>{t('sum.changeEngTitle')}</div>
      <div style={{ fontSize: 12, color: '#7a7a8a', marginTop: 6 }}>{t('sum.changeEngDesc')}</div>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('sum.dateLabel')}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[t('sum.tueJuly21'), t('sum.wedJuly22')].map((d) => (
          <div key={d} onClick={() => update({ engDate: d, engMessage: '' })} style={{ height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: state.engDate === d ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.04)', border: '1.5px solid ' + (state.engDate === d ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)') }}>{d}</div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.08em', color: '#7a7a8a', margin: '18px 0 9px' }}>{t('sum.timeLabel')}</div>
      <div style={{ display: 'flex', gap: 9 }}>
        {['17:30', '19:30', '18:15', '22:45'].map((tm) => <OptionRow key={tm} label={tm} active={state.engStart === tm} onClick={() => pickEngTime(tm)} />)}
      </div>
      {state.engMessage && (
        <div style={{ marginTop: 14, padding: 13, borderRadius: 14, background: 'rgba(245,165,36,.08)', border: '1px solid rgba(245,165,36,.3)', fontSize: 12.5, lineHeight: 1.45, color: '#f7c46c' }}>{state.engMessage}</div>
      )}
      <div style={{ display: 'flex', gap: 11, marginTop: 18, paddingBottom: 8 }}>
        <div onClick={cancelEngTime} style={{ flex: 1, height: 50, borderRadius: 15, background: 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>{t('sum.cancel')}</div>
        <div onClick={saveEngTime} style={{ flex: 1.3, height: 50, borderRadius: 15, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('sum.saveChanges')}</div>
      </div>
    </BottomSheet>
  );
}

const CONFETTI_EMOJI = ['🎉', '⭐', '🔥', '✨', '🏆', '💜'];

function Confetti() {
  const particles = Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 80 + (i % 3) * 30;
    return {
      id: i,
      emoji: CONFETTI_EMOJI[i % CONFETTI_EMOJI.length],
      dx: Math.round(Math.cos(angle) * dist),
      dy: Math.round(Math.sin(angle) * dist - 40),
      delay: (i % 5) * 0.03,
    };
  });
  return (
    <div style={{ position: 'absolute', top: 96, left: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
      {particles.map((p) => (
        <span key={p.id} style={{ position: 'absolute', fontSize: 20, '--dx': p.dx + 'px', '--dy': p.dy + 'px', animation: `confettiBurst 1.1s ease-out ${p.delay}s both` }}>
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

function DaySaved({ planner, doneCount, movedCount, celebrate }) {
  const { t, lang } = useLang();
  const { state, goHomeSummarized } = planner;
  const doneShort = lang === 'en'
    ? doneCount + ' ' + (doneCount === 1 ? 'task' : 'tasks') + ' ' + t('sum.doneWord')
    : zad(doneCount) + (doneCount >= 2 && doneCount <= 4 ? ' wykonane' : doneCount === 1 ? ' wykonane' : ' wykonanych');
  const movedShort = lang === 'en'
    ? movedCount + ' ' + (movedCount === 1 ? t('sum.movedOne') : t('sum.movedMany'))
    : zad(movedCount) + (movedCount >= 2 && movedCount <= 4 ? ' przeniesione' : movedCount === 1 ? ' przeniesione' : ' przeniesionych');
  return (
    <div className="sc" style={{ position: 'absolute', inset: 0, zIndex: 80, background: '#08080c', overflowY: 'auto', padding: '80px 20px 40px' }}>
      {celebrate && <Confetti />}
      <div style={{ width: 52, height: 52, borderRadius: 17, background: 'rgba(53,208,127,.14)', border: '1px solid rgba(53,208,127,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="15" viewBox="0 0 13 11" fill="none"><path d="M1 5.6L4.6 9.4 12 1.6" stroke="#35d07f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
      <div style={{ fontSize: 28, fontWeight: 750, letterSpacing: '-.025em', marginTop: 20 }}>{t('sum.daySummarized')}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{t('sum.savedDesc')}</div>

      <div style={{ marginTop: 20, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#35d07f', fontSize: 12 }}>✓</span><span style={{ fontSize: 13.5, fontWeight: 650, color: '#5fdd9b' }}>{doneShort}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#8a8a99', fontSize: 12 }}>→</span><span style={{ fontSize: 13.5, color: '#c9c9d6' }}>{movedShort}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: '#8a8a99', fontSize: 12 }}>•</span><span style={{ fontSize: 13.5, color: '#c9c9d6' }}>{t('sum.realStudyTime', { time: hm(state.bioMinutes + state.mathMinutes) })}</span></div>
      </div>

      <div style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3' }}>{t('sum.mathReadinessUpdated')}</div>
      {(state.adaptive && (state.mathMinutes !== 70)) && (
        <div style={{ marginTop: 12, padding: 15, borderRadius: 18, background: 'rgba(124,92,255,.07)', border: '1px solid rgba(124,92,255,.3)', fontSize: 12.5, lineHeight: 1.5, fontWeight: 650, color: '#c9baff' }}>
          {t('sum.similarMathTasks', { min: state.mathMinutes })}
        </div>
      )}

      <div onClick={goHomeSummarized} style={{ marginTop: 22, height: 56, borderRadius: 17, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 12px 30px rgba(109,77,255,.35)' }}>{t('sum.backToStart')}</div>
    </div>
  );
}
