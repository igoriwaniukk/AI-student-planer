import { sessionClock } from '../lib/plannerLogic';
import { iconForTask } from '../lib/taskAuto';
import { TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { useNow } from '../hooks/useNow';
import { useOvertimeBuzz } from '../hooks/useOvertimeBuzz';

// A minimised focus session, floating just above the tab bar: tap to reopen
// the focus screen, or pause/resume right here.
export default function RunningSessionBar({ planner }) {
  const { t } = useLang();
  const { state, def, go, togglePause } = planner;
  const d = state.activeTask ? def(state.activeTask) : null;
  const now = useNow(!!d);
  const c = d ? sessionClock(state, now) : null;
  useOvertimeBuzz(c?.overtime, state.activeTask, state.sessionBeganAt);
  if (!d) return null;

  const status = c.paused ? '⏸ ' + t('home.paused') : c.overtime ? t('home.overtime') + ' ' + c.label : c.label;
  return (
    <div
      onClick={() => go('focus')}
      style={{
        position: 'absolute', left: 12, right: 12, bottom: 96, zIndex: 44, height: 58, padding: '0 8px 0 12px', borderRadius: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(28,22,52,.96)', border: '1px solid rgba(139,109,255,.45)',
        boxShadow: '0 10px 28px rgba(0,0,0,.45)', backdropFilter: 'blur(8px)', animation: 'fadeUp .25s ease both',
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, background: c.overtime ? 'rgba(245,165,36,.2)' : 'radial-gradient(circle at 40% 35%,#b9a6ff,#8b6dff)', opacity: c.paused ? 0.55 : 1 }}>{iconForTask(d)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 1, fontVariantNumeric: 'tabular-nums', color: c.overtime ? '#f5a524' : c.paused ? '#8a8a99' : '#c9baff' }}>{status}</div>
      </div>
      <div
        aria-label={c.paused ? t('home.resume') : t('home.pause')}
        onClick={(e) => { e.stopPropagation(); togglePause(state.activeTask); }}
        style={{ width: 40, height: 40, borderRadius: '50%', flex: 'none', background: '#ece8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {c.paused
          ? <svg width="11" height="12" viewBox="0 0 11 12"><path d="M1.5 1l8.5 5-8.5 5z" fill="#2a2150" /></svg>
          : <svg width="11" height="12" viewBox="0 0 12 13"><rect x="1" y="1" width="3.4" height="11" rx="1" fill="#2a2150" /><rect x="7.6" y="1" width="3.4" height="11" rx="1" fill="#2a2150" /></svg>}
      </div>
    </div>
  );
}
