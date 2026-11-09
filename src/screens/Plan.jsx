import { useState } from 'react';
import { hm, fmt, weekdayOn, taskDueOnDay, isTaskOn, workingPlan, draftFor, activeIds, timeline, pluralForm } from '../lib/plannerLogic';
import { iconForTask, iconForActivity } from '../lib/taskAuto';
import { BackButton, StickyFooter, PrimaryButton, ConfirmCard } from '../components/ui';
import { TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import TaskEditSheet from '../components/TaskEditSheet';
import BlockEditSheet from '../components/BlockEditSheet';

// One row of the day's timeline: the time on the left, a dot on the rail,
// then the content. Only study sessions are cards — breaks, fixed
// activities, free time and sleep are a single short line each.
function RailRow({ time, dot, last, children }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={{ width: 44, flex: 'none', textAlign: 'right', fontSize: 12.5, fontWeight: 700, color: '#a3a3b3', paddingTop: 15, fontVariantNumeric: 'tabular-nums' }}>{time}</div>
      <div style={{ position: 'relative', width: 14, flex: 'none', display: 'flex', justifyContent: 'center' }}>
        {!last && <div style={{ position: 'absolute', top: 22, bottom: -22, width: 2, background: 'rgba(255,255,255,.08)' }} />}
        <div style={{ position: 'relative', marginTop: 18, width: 10, height: 10, borderRadius: '50%', background: dot, boxShadow: '0 0 0 4px #08080c' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '5px 0' }}>{children}</div>
    </div>
  );
}

function RailLine({ text, color = '#8a8a99' }) {
  return <div style={{ padding: '11px 2px', fontSize: 13.5, fontWeight: 650, color }}>{text}</div>;
}

function SessionCard({ it, planner }) {
  const { t } = useLang();
  const { state, def, ts, openBlockEdit, removeBlock } = planner;
  const d = def(it.id);
  if (!d) return null;
  const done = ts(it.id).status === 'completed';
  return (
    <div
      role="button"
      onClick={() => openBlockEdit(it.id)}
      style={{ padding: '11px 12px 11px 11px', borderRadius: 16, background: done ? 'rgba(53,208,127,.07)' : 'rgba(124,92,255,.08)', border: '1px solid ' + (done ? 'rgba(53,208,127,.35)' : 'rgba(124,92,255,.4)'), display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}
    >
      <div style={{ width: 36, height: 36, flex: 'none', borderRadius: 11, background: done ? 'rgba(53,208,127,.16)' : 'rgba(124,92,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{iconForTask(d)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 750, lineHeight: 1.25 }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
        <div style={{ fontSize: 12.5, color: done ? '#7fe3ad' : '#a3a3b3', marginTop: 2 }}>{done ? '✓ ' : ''}{hm(it.end - it.start)}</div>
      </div>
      {state.manualMode
        ? <span role="button" aria-label={t('plan.remove')} onClick={(e) => { e.stopPropagation(); removeBlock(it.id); }} style={{ width: 30, height: 30, flex: 'none', borderRadius: 10, background: 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#c9c9d6' }}>✕</span>
        : <span style={{ color: '#6b6b7a', fontSize: 16, flex: 'none' }}>›</span>}
    </div>
  );
}

function PlanTimeline({ schedule, planner }) {
  const { t } = useLang();
  const items = timeline(schedule, planner.constraints);
  return (
    <div>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const time = fmt(it.start);
        if (it.k === 'study') {
          const done = planner.ts(it.id).status === 'completed';
          return <RailRow key={i} time={time} dot={done ? '#35d07f' : '#8b6dff'} last={last}><SessionCard it={it} planner={planner} /></RailRow>;
        }
        if (it.k === 'gap') {
          const mins = it.end - it.start;
          const next = items[i + 1];
          if (mins <= 20) return <RailRow key={i} time={time} dot="rgba(255,255,255,.25)" last={last}><RailLine text={'☕ ' + t('plan.breakLine', { n: mins })} /></RailRow>;
          const text = next && next.k === 'sleep' ? t('tl.eveningTitle') : t('plan.freeFor', { time: hm(mins) });
          return <RailRow key={i} time={time} dot="#35d07f" last={last}><RailLine text={'🎉 ' + text} color="#7fe3ad" /></RailRow>;
        }
        if (it.k === 'sleep') return <RailRow key={i} time={time} dot="rgba(255,255,255,.25)" last={last}><RailLine text={'🌙 ' + it.title} /></RailRow>;
        return (
          <RailRow key={i} time={time} dot="#2ee6c5" last={last}>
            <RailLine text={(iconForActivity(it.title) || '📌') + ' ' + it.title + ' · ' + t('plan.until', { time: fmt(it.end) })} color="#8ff0de" />
          </RailRow>
        );
      })}
    </div>
  );
}

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
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '16px 20px 150px', position: 'relative', zIndex: 1 }}>
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
