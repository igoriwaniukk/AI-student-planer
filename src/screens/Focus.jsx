import { useEffect, useState } from 'react';
import { sessionClock } from '../lib/plannerLogic';
import { iconForTask } from '../lib/taskAuto';
import { VALUE_KEY, TASK_TEXT_KEY } from '../lib/i18n';
import { useLang } from '../lib/useLang';
import { useNow } from '../hooks/useNow';
import { useOvertimeBuzz } from '../hooks/useOvertimeBuzz';

const RING = 250;
const STROKE = 27;
const R = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const clock = (ms) => {
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

// The time left as a light-purple arc that empties clockwise back to 12
// o'clock, with a glowing dot riding its end; full and orange once over time.
function FocusRing({ c, emoji }) {
  const frac = c.overtime ? 1 : c.remainingFrac;
  const angle = (frac * 360 - 90) * (Math.PI / 180);
  const dot = { x: RING / 2 + R * Math.cos(angle), y: RING / 2 + R * Math.sin(angle) };
  return (
    <div style={{ position: 'relative', width: RING, height: RING, marginTop: 26, opacity: c.paused ? 0.5 : 1, transition: 'opacity .3s ease' }}>
      <svg width={RING} height={RING} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={STROKE} />
        <circle
          cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke={c.overtime ? '#f5a524' : '#b39dff'} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - frac)} transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s ease' }}
        />
        {!c.overtime && frac > 0.01 && <circle cx={dot.x} cy={dot.y} r={9} fill="#fff" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,.8))' }} />}
      </svg>
      <div
        style={{
          position: 'absolute', inset: STROKE - 0.5, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: c.overtime ? 'radial-gradient(circle at 40% 35%,#ffd08a,#f5a524)' : 'radial-gradient(circle at 40% 35%,#b9a6ff,#8b6dff)',
          boxShadow: 'inset 0 -10px 30px rgba(60,30,160,.35)',
        }}
      >
        <span className="focus-breathe" style={{ fontSize: 84, lineHeight: 1, animation: c.paused ? 'none' : 'focusBreathe 4s ease-in-out infinite' }}>{emoji}</span>
      </div>
    </div>
  );
}

export default function Focus({ planner }) {
  const { t } = useLang();
  const { state, def, go, update, togglePause, openFinish, openBlockEdit, dismissBreakReminder, addSessionMinute } = planner;
  const [menuOpen, setMenuOpen] = useState(false);
  const id = state.activeTask;
  const d = id ? def(id) : null;
  const now = useNow(!!d);
  const c = d ? sessionClock(state, now) : null;
  useOvertimeBuzz(c?.overtime, id, state.sessionBeganAt);

  // Nothing running (finished from elsewhere, task deleted): back to Home.
  useEffect(() => {
    if (!d) go('home');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);
  if (!d) return null;

  const showBreak = !c.paused && !c.overtime && !state.breakDismissed && c.elapsedMs >= 25 * 60000 && c.totalMin >= 40;
  const roundBtn = { width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9c9d6', cursor: 'pointer', flex: 'none' };
  const note = c.overtime ? t('focus.timeUp') : c.paused ? t('focus.pausedNote') : t('focus.leftOf', { min: c.totalMin });

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 104px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div aria-label={t('focus.minimize')} onClick={() => go('home')} style={roundBtn}>
          <svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1.5 1.5L7 7l5.5-5.5" stroke="#f4f4f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '7px 12px', borderRadius: 999, background: 'rgba(124,92,255,.18)', border: '1px solid rgba(139,109,255,.4)', color: '#d9cfff' }}>🎧 {t('focus.mode')}</span>
        <div aria-label={t('plans.more')} onClick={() => setMenuOpen((o) => !o)} style={{ ...roundBtn, fontSize: 18, letterSpacing: 1 }}>⋯</div>
      </div>

      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 2 }} />
          <div style={{ position: 'absolute', top: 68, right: 20, zIndex: 3, minWidth: 180, borderRadius: 14, background: '#1c1830', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 10px 30px rgba(0,0,0,.5)', overflow: 'hidden' }}>
            <div
              onClick={() => { setMenuOpen(false); openBlockEdit(id); update({ screen: 'plan' }); }}
              style={{ padding: '13px 15px', fontSize: 13.5, fontWeight: 650, cursor: 'pointer' }}
            >
              📅 {t('home.reschedule')}
            </div>
          </div>
        </>
      )}

      {d.subject && <div style={{ fontSize: 12, fontWeight: 750, letterSpacing: '.08em', color: d.color || '#a58cff', marginTop: 26 }}>{(t(VALUE_KEY[d.subject]) || d.subject).toUpperCase()}</div>}
      <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.2, textAlign: 'center', marginTop: 6, maxWidth: 320 }}>{t(TASK_TEXT_KEY[d.id]?.title) || d.title}</div>
      <div style={{ fontSize: 13, color: '#8a8a99', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{clock(c.beganAt)} → {clock(c.endsAt)}</div>

      <FocusRing c={c} emoji={iconForTask(d)} />

      <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', marginTop: 24, color: c.overtime ? '#f5a524' : c.paused ? '#8a8a99' : '#f4f4f7' }}>{c.label}</div>
      <div style={{ fontSize: 12.5, color: c.overtime ? '#f7c46c' : '#8a8a99', marginTop: 2 }}>{note}</div>

      {showBreak && (
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 14, background: 'rgba(46,230,197,.08)', border: '1px solid rgba(46,230,197,.25)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340 }}>
          <span style={{ fontSize: 15 }}>🌿</span>
          <div style={{ flex: 1, fontSize: 12, lineHeight: 1.4, color: '#c9f5ec' }}>{t('home.breakReminder')}</div>
          <span onClick={() => { dismissBreakReminder(); togglePause(id); }} style={{ fontSize: 12, fontWeight: 700, color: '#8ff0de', cursor: 'pointer' }}>{t('focus.break')}</span>
          <span onClick={dismissBreakReminder} style={{ fontSize: 12, fontWeight: 650, color: '#8a8a99', cursor: 'pointer' }}>{t('focus.later')}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <div onClick={addSessionMinute} style={{ height: 44, padding: '0 16px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>{t('focus.plusMinute')}</div>
        <div
          aria-label={c.paused ? t('home.resume') : t('home.pause')}
          onClick={() => togglePause(id)}
          style={{ minWidth: 84, height: 44, padding: '0 16px', borderRadius: 999, background: '#ece8ff', color: '#2a2150', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
        >
          {c.paused
            ? <><svg width="11" height="12" viewBox="0 0 11 12"><path d="M1 1l9 5-9 5z" fill="#2a2150" /></svg>{t('home.resume')}</>
            : <svg width="12" height="13" viewBox="0 0 12 13"><rect x="1" y="1" width="3.4" height="11" rx="1" fill="#2a2150" /><rect x="7.6" y="1" width="3.4" height="11" rx="1" fill="#2a2150" /></svg>}
        </div>
      </div>

    </div>

    <div
        onClick={() => openFinish(id, c.totalMin)}
        style={{ position: 'absolute', zIndex: 2, left: 20, right: 20, bottom: 26, height: 52, borderRadius: 16, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 750, cursor: 'pointer', boxShadow: '0 10px 26px rgba(109,77,255,.35)' }}
      >
        {t('focus.finish')}
      </div>
    </>
  );
}
