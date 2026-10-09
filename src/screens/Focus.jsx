import { useEffect, useState } from 'react';
import { sessionClock } from '../lib/plannerLogic';
import { iconForTask, SUBJECT_ART } from '../lib/taskAuto';
import SubjectArt from '../components/SubjectArt';
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

// Time studied as a glowing line that grows clockwise from 12 o'clock, plus
// a small spark that laps the ring once a minute and pulses gently, so the
// ring still feels alive in a long session. Full and orange once over time.
function FocusRing({ c, d, finishing }) {
  const progress = finishing || c.overtime ? 1 : 1 - c.remainingFrac;
  // The spark starts where this session's clock puts it; CSS keeps it going
  // (and the paused class freezes it) so it glides instead of ticking.
  const [sparkDelay] = useState(() => -((c.elapsedMs / 1000) % 60) + 's');
  const art = d.category !== 'personal' && SUBJECT_ART[d.subject];
  const mid = RING / 2;
  return (
    <div className={c.paused ? 'focus-paused' : ''} style={{ position: 'relative', width: RING, height: RING, marginTop: 26, opacity: c.paused ? 0.5 : 1, transition: 'opacity .3s ease' }}>
      <svg width={RING} height={RING} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <linearGradient id="focusArc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#c9baff" /><stop offset="1" stopColor="#8b6dff" /></linearGradient>
        </defs>
        <circle cx={mid} cy={mid} r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={STROKE} />
        <circle
          cx={mid} cy={mid} r={R} fill="none" stroke={c.overtime ? '#f5a524' : 'url(#focusArc)'} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progress)} transform={`rotate(-90 ${mid} ${mid})`}
          style={{ transition: finishing ? 'stroke-dashoffset .7s ease-out' : 'stroke-dashoffset 1s linear, stroke .3s ease', filter: 'drop-shadow(0 0 6px rgba(185,166,255,.55))' }}
        />
        {!finishing && (
          <g className="focus-spark" style={{ transformBox: 'view-box', transformOrigin: `${mid}px ${mid}px`, animation: 'focusOrbit 60s linear infinite', animationDelay: sparkDelay }}>
            <circle
              cx={mid} cy={mid} r={R} fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray={`22 ${CIRC}`}
              transform={`rotate(-90 ${mid} ${mid})`} style={{ animation: 'focusSparkPulse 2s ease-in-out infinite' }}
            />
          </g>
        )}
      </svg>
      <div
        style={{
          position: 'absolute', inset: STROKE - 0.5, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: c.overtime ? 'radial-gradient(circle at 40% 35%,#ffd08a,#f5a524)' : 'radial-gradient(circle at 40% 35%,#b9a6ff,#8b6dff)',
          boxShadow: 'inset 0 -10px 30px rgba(60,30,160,.35)',
        }}
      >
        {art
          ? <SubjectArt subject={d.subject} paused={c.paused} finishing={finishing} size={132} />
          : <span className="focus-breathe" style={{ fontSize: 84, lineHeight: 1, animation: c.paused ? 'none' : 'focusBreathe 4s ease-in-out infinite' }}>{iconForTask(d)}</span>}
      </div>
    </div>
  );
}

export default function Focus({ planner }) {
  const { t } = useLang();
  const { state, def, go, update, togglePause, openFinish, openBlockEdit, dismissBreakReminder, addSessionMinute } = planner;
  const [menuOpen, setMenuOpen] = useState(false);
  // Just finished here (see confirmFinish): hold the screen for the ring to
  // complete and the icon's finish animation, then head Home.
  const done = state.focusDone;
  const id = state.activeTask || done?.id;
  const d = id ? def(id) : null;
  const now = useNow(!!state.activeTask);
  const c = state.activeTask && d
    ? sessionClock(state, now)
    : done && { paused: false, overtime: false, remainingFrac: 0, elapsedMs: 0, totalMin: done.totalMin, label: '0:00', beganAt: done.beganAt, endsAt: done.endedAt };
  useOvertimeBuzz(c?.overtime, state.activeTask, state.sessionBeganAt);

  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => update({ screen: 'home', focusDone: null }), 1600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
  // Nothing running (finished from elsewhere, task deleted): back to Home.
  useEffect(() => {
    if (!d) go('home');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);
  if (!d || !c) return null;

  const showBreak = !done && !c.paused && !c.overtime && !state.breakDismissed && c.elapsedMs >= 25 * 60000 && c.totalMin >= 40;
  const roundBtn = { width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9c9d6', cursor: 'pointer', flex: 'none' };
  const note = done ? t('focus.sessionDone') : c.overtime ? t('focus.timeUp') : c.paused ? t('focus.pausedNote') : t('focus.leftOf', { min: c.totalMin });

  return (
    <>
    <div className="sc" style={{ height: '100%', overflowY: 'auto', padding: '20px 20px 104px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div aria-label={t('focus.minimize')} onClick={() => go('home')} style={roundBtn}>
          <svg width="14" height="9" viewBox="0 0 14 9" fill="none"><path d="M1.5 1.5L7 7l5.5-5.5" stroke="#f4f4f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '7px 12px', borderRadius: 999, background: 'rgba(124,92,255,.18)', border: '1px solid rgba(139,109,255,.4)', color: '#d9cfff' }}>🎧 {t('focus.mode')}</span>
        <div aria-label={t('plans.more')} onClick={() => setMenuOpen((o) => !o)} style={{ ...roundBtn, fontSize: 18, letterSpacing: 1, visibility: done ? 'hidden' : 'visible' }}>⋯</div>
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

      <FocusRing c={c} d={d} finishing={!!done} />

      <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums', marginTop: 24, color: done ? '#35d07f' : c.overtime ? '#f5a524' : c.paused ? '#8a8a99' : '#f4f4f7' }}>{c.label}</div>
      <div style={{ fontSize: 12.5, color: done ? '#8ff0c0' : c.overtime ? '#f7c46c' : '#8a8a99', marginTop: 2 }}>{note}</div>

      {showBreak && (
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 14, background: 'rgba(46,230,197,.08)', border: '1px solid rgba(46,230,197,.25)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 340 }}>
          <span style={{ fontSize: 15 }}>🌿</span>
          <div style={{ flex: 1, fontSize: 12, lineHeight: 1.4, color: '#c9f5ec' }}>{t('home.breakReminder')}</div>
          <span onClick={() => { dismissBreakReminder(); togglePause(id); }} style={{ fontSize: 12, fontWeight: 700, color: '#8ff0de', cursor: 'pointer' }}>{t('focus.break')}</span>
          <span onClick={dismissBreakReminder} style={{ fontSize: 12, fontWeight: 650, color: '#8a8a99', cursor: 'pointer' }}>{t('focus.later')}</span>
        </div>
      )}

      {!done && <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
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
      </div>}

    </div>

    {!done && <div
        onClick={() => openFinish(id, c.totalMin)}
        style={{ position: 'absolute', zIndex: 2, left: 20, right: 20, bottom: 'calc(26px + var(--safe-bottom))', height: 52, borderRadius: 16, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 750, cursor: 'pointer', boxShadow: '0 10px 26px rgba(109,77,255,.35)' }}
      >
        {t('focus.finish')}
      </div>}
    </>
  );
}
