import { timeline, span, hm, fmt } from '../lib/plannerLogic';
import { STATUS_COLOR } from '../lib/plannerData';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { BackButton, StickyFooter, PrimaryButton, ConfirmCard, Pill } from '../components/ui';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';
import BlockEditSheet from '../components/BlockEditSheet';

function LockedCard({ it, t }) {
  return (
    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 12 }}>
      <div style={{ width: 32, height: 32, flex: 'none', borderRadius: 10, background: 'rgba(91,156,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🔒</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{it.k === 'sleep' ? fmt(it.start) : span(it.start, it.end)}</span>
          <span style={{ fontSize: 10.5, fontWeight: 650, color: '#5b9cff' }}>{t('plan.locked')}</span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{it.title}</div>
        <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{it.sub}</div>
      </div>
    </div>
  );
}

function GapCard({ it }) {
  return (
    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{span(it.start, it.end)}</span>
        <Pill text={(it.end - it.start) + ' min'} color="#c9c9d6" bg="rgba(255,255,255,.07)" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{it.title}</div>
      <div style={{ fontSize: 11.5, color: '#7a7a8a', marginTop: 3 }}>{it.sub}</div>
    </div>
  );
}

function StudyCard({ it, planner, t }) {
  const { state, def, ts, openBlockEdit, openTaskEdit, removeBlock } = planner;
  const d = def(it.id);
  const st = ts(it.id);
  const manual = state.manualMode;
  return (
    <div style={{ padding: 14, borderRadius: 18, background: 'rgba(124,92,255,.06)', border: '1.5px solid rgba(124,92,255,.42)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: '#8a8a99' }}>{span(it.start, it.end)}</span>
            <Pill text={(it.end - it.start) + ' min'} color="#c9baff" bg="rgba(124,92,255,.2)" />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: STATUS_COLOR[st.status] }}>{t('status.' + st.status)}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 750, letterSpacing: '.06em', color: d.color, marginTop: 8, textTransform: 'uppercase' }}>{t(VALUE_KEY[d.subject]) || d.subject}</div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.28, marginTop: 5 }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <EditBtn label={t('plan.change')} onClick={() => openBlockEdit(it.id)} />
          {manual && <EditBtn label={t('plan.remove')} onClick={() => removeBlock(it.id)} />}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 11 }}>
        <Pill text={t(VALUE_KEY[d.priority]) || d.priority} color="#c9baff" bg="rgba(124,92,255,.2)" />
        {d.deadline && <Pill text={t(TASK_TEXT_KEY[d.id]?.deadline) || d.deadline} color="#f5a524" bg="rgba(245,165,36,.13)" />}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{t(TASK_TEXT_KEY[d.id]?.why) || d.why}</div>
      <div onClick={() => openTaskEdit(it.id)} style={{ fontSize: 11.5, fontWeight: 650, color: '#a58cff', cursor: 'pointer', marginTop: 8 }}>{t('plan.editTaskDetails')}</div>
    </div>
  );
}

function EditBtn({ label, onClick }) {
  return (
    <span onClick={onClick} style={{ fontSize: 11.5, fontWeight: 650, color: '#c9c9d6', padding: '6px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', height: 'fit-content', cursor: 'pointer' }}>{label}</span>
  );
}

export default function Plan({ planner }) {
  const { t } = useLang();
  const { state, update, toggleManualMode, regenerateOrCancel, confirmPlan, goHomeSaved, go } = planner;
  const items = timeline(state.schedule);
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '22px 0 12px 2px' }}>
        <span style={{ fontSize: 10, fontWeight: 750, letterSpacing: '.1em', color: '#7a7a8a' }}>{t('plan.dayPlan')}</span>
        {state.manualMode && <span style={{ fontSize: 11, fontWeight: 650, color: '#c9baff' }}>{t('plan.manualMode')}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {items.map((it, i) => {
          if (it.k === 'study') return <StudyCard key={i} it={it} planner={planner} t={t} />;
          if (it.k === 'gap') return <GapCard key={i} it={it} />;
          return <LockedCard key={i} it={it} t={t} />;
        })}
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
