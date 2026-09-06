import { timeline, span, fmt } from '../lib/plannerLogic';
import { STATUS_COLOR } from '../lib/plannerData';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { Pill } from './ui';

// Shared between Plan.jsx (the generated-plan review screen) and
// Calendar.jsx (so a generated day's blocks show up there too, not just
// as a flat session list) — one timeline rendering, two call sites.
export function LockedCard({ it, t }) {
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

export function GapCard({ it }) {
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

export function StudyCard({ it, planner, t, compact }) {
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
        {!compact && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <EditBtn label={t('plan.change')} onClick={() => openBlockEdit(it.id)} />
            {manual && <EditBtn label={t('plan.remove')} onClick={() => removeBlock(it.id)} />}
          </div>
        )}
      </div>
      {!compact && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 11 }}>
            <Pill text={t(VALUE_KEY[d.priority]) || d.priority} color="#c9baff" bg="rgba(124,92,255,.2)" />
            {d.deadline && <Pill text={t(TASK_TEXT_KEY[d.id]?.deadline) || d.deadline} color="#f5a524" bg="rgba(245,165,36,.13)" />}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: '#a3a3b3', marginTop: 10 }}>{t(TASK_TEXT_KEY[d.id]?.why) || d.why}</div>
          <div onClick={() => openTaskEdit(it.id)} style={{ fontSize: 11.5, fontWeight: 650, color: '#a58cff', cursor: 'pointer', marginTop: 8 }}>{t('plan.editTaskDetails')}</div>
        </>
      )}
    </div>
  );
}

function EditBtn({ label, onClick }) {
  return (
    <span onClick={onClick} style={{ fontSize: 11.5, fontWeight: 650, color: '#c9c9d6', padding: '6px 11px', borderRadius: 9, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', height: 'fit-content', cursor: 'pointer' }}>{label}</span>
  );
}

// compact=true (used by Calendar) skips the edit buttons and the
// priority/deadline/why detail block, showing just the essentials.
// only, if given, restricts which timeline item kinds render — Calendar
// uses this to show just study blocks + gaps, since school/tennis/sleep
// already have their own dedicated sections there.
export default function DayTimeline({ schedule, planner, t, compact, only }) {
  const items = only ? timeline(schedule).filter((it) => only.includes(it.k)) : timeline(schedule);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {items.map((it, i) => {
        if (it.k === 'study') return <StudyCard key={i} it={it} planner={planner} t={t} compact={compact} />;
        if (it.k === 'gap') return <GapCard key={i} it={it} />;
        return <LockedCard key={i} it={it} t={t} />;
      })}
    </div>
  );
}
