import { hm, fmt, timeline } from '../lib/plannerLogic';
import { iconForTask, iconForActivity } from '../lib/taskAuto';
import { TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';

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

function SessionCard({ it, planner, readOnly }) {
  const { t } = useLang();
  const { state, def, ts, openBlockEdit, removeBlock } = planner;
  const d = def(it.id);
  if (!d) return null;
  const done = ts(it.id).status === 'completed';
  return (
    <div
      role={readOnly ? undefined : 'button'}
      onClick={readOnly ? undefined : () => openBlockEdit(it.id)}
      style={{ padding: '11px 12px 11px 11px', borderRadius: 16, background: done ? 'rgba(53,208,127,.07)' : 'rgba(124,92,255,.08)', border: '1px solid ' + (done ? 'rgba(53,208,127,.35)' : 'rgba(124,92,255,.4)'), display: 'flex', alignItems: 'center', gap: 11, cursor: readOnly ? 'default' : 'pointer' }}
    >
      <div style={{ width: 36, height: 36, flex: 'none', borderRadius: 11, background: done ? 'rgba(53,208,127,.16)' : 'rgba(124,92,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{iconForTask(d)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 750, lineHeight: 1.25 }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
        <div style={{ fontSize: 12.5, color: done ? '#7fe3ad' : '#a3a3b3', marginTop: 2 }}>{done ? '✓ ' : ''}{hm(it.end - it.start)}</div>
      </div>
      {readOnly ? null : state.manualMode
        ? <span role="button" aria-label={t('plan.remove')} onClick={(e) => { e.stopPropagation(); removeBlock(it.id); }} style={{ width: 30, height: 30, flex: 'none', borderRadius: 10, background: 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#c9c9d6' }}>✕</span>
        : <span style={{ color: '#6b6b7a', fontSize: 16, flex: 'none' }}>›</span>}
    </div>
  );
}

// readOnly: sessions can't be tapped (e.g. Restart's proposed plan, which
// isn't the day's plan yet).
export default function PlanTimeline({ schedule, planner, readOnly = false }) {
  const { t } = useLang();
  const items = timeline(schedule, planner.constraints);
  return (
    <div>
      {items.map((it, i) => {
        const last = i === items.length - 1;
        const time = fmt(it.start);
        if (it.k === 'study') {
          const done = planner.ts(it.id).status === 'completed';
          return <RailRow key={i} time={time} dot={done ? '#35d07f' : '#8b6dff'} last={last}><SessionCard it={it} planner={planner} readOnly={readOnly} /></RailRow>;
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
