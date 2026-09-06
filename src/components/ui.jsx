import { useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/useLang';
import { VALUE_KEY } from '../lib/i18n';
import { STATUS_COLOR } from '../lib/plannerData';

// Animates a numeric value counting up (or down) to its new value whenever
// it changes, instead of jumping instantly — used for streak/points badges.
export function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return undefined;
    const start = performance.now();
    const duration = 500;
    let raf;
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + (to - from) * t));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return display;
}

export function Chip({ label, active, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '11px 15px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 650,
        background: active ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.035)',
        border: '1.5px solid ' + (active ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.1)'),
        color: active ? '#e6dfff' : '#c9c9d6',
        animation: active ? 'chipPop .22s ease' : 'none',
        ...style,
      }}
    >
      {label}
    </div>
  );
}

const CONFETTI_EMOJI = ['🎉', '⭐', '🔥', '✨', '🏆', '💜'];

// A one-shot burst of emoji particles flying outward from the trigger point
// — used for celebratory moments (day summary, unlocking an achievement).
export function Confetti({ top = 96 }) {
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
    <div style={{ position: 'absolute', top, left: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
      {particles.map((p) => (
        <span key={p.id} style={{ position: 'absolute', fontSize: 20, '--dx': p.dx + 'px', '--dy': p.dy + 'px', animation: `confettiBurst 1.1s ease-out ${p.delay}s both` }}>
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

export function OptionRow({ label, active, onClick, flex = 1 }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 650, cursor: 'pointer',
        background: active ? 'rgba(124,92,255,.14)' : 'rgba(255,255,255,.04)',
        border: '1.5px solid ' + (active ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.09)'),
        color: active ? '#e6dfff' : '#c9c9d6',
      }}
    >
      {label}
    </div>
  );
}

export function ListRow({ label, active, onClick, last }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px 15px', fontSize: 14, fontWeight: active ? 700 : 550, cursor: 'pointer',
        color: active ? '#e6dfff' : '#c9c9d6',
        background: active ? 'rgba(124,92,255,.14)' : 'transparent',
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      {label}
      {active && <span style={{ fontSize: 12, color: '#a58cff' }}>✓</span>}
    </div>
  );
}

export function Pill({ text, color, bg }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 650, color, padding: '3px 7px', borderRadius: 7, background: bg }}>
      {text}
    </span>
  );
}

// A progress track with a soft shimmer sweeping across the filled portion,
// so a bar that's just sitting there mid-value still reads as "alive"
// instead of static.
export function ProgressBar({ pct, fill = 'linear-gradient(90deg,#7c5cff,#2ee6c5)', height = 6, style }) {
  return (
    <div style={{ height, borderRadius: 99, background: 'rgba(255,255,255,.08)', overflow: 'hidden', ...style }}>
      <div style={{ width: pct + '%', height: '100%', borderRadius: 99, background: fill, transition: 'width .5s ease', position: 'relative', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', inset: 0, width: '40%', background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent)', animation: 'shimmerSweep 2.4s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

// The session-status pill used on the day's task lists — draws in a small
// checkmark the moment a task's status becomes 'completed', instead of the
// pill just silently switching color and label.
export function StatusPill({ status }) {
  const { t } = useLang();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 650, color: STATUS_COLOR[status], padding: '5px 9px', borderRadius: 8, background: 'rgba(255,255,255,.06)' }}>
      {status === 'completed' && (
        <svg width="9" height="7" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l2.8 2.8L9 1.4" stroke={STATUS_COLOR.completed} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16" style={{ animation: 'checkDraw .4s ease .05s both' }} />
        </svg>
      )}
      {t('status.' + status)}
    </span>
  );
}

export function PrimaryButton({ children, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{
        height: 56, borderRadius: 17, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16.5, fontWeight: 700,
        cursor: 'pointer', boxShadow: '0 12px 30px rgba(109,77,255,.35)', ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StickyFooter({ children }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 20px 24px', background: 'linear-gradient(to top,#08080c 66%,rgba(8,8,12,0))' }}>
      {children}
    </div>
  );
}

export function BackButton({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
    >
      <svg width="16" height="14" viewBox="0 0 16 14" fill="none"><path d="M14 7H2m0 0l5-5M2 7l5 5" stroke="#f4f4f7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
}

export function Toggle({ on, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 44, height: 26, flex: 'none', borderRadius: 99, padding: 3, display: 'flex', alignItems: 'center',
        background: on ? '#7c5cff' : 'rgba(255,255,255,.14)', justifyContent: on ? 'flex-end' : 'flex-start', cursor: 'pointer',
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff' }} />
    </div>
  );
}

export function EnergyPicker({ value, onChange, emoji = false }) {
  const { t } = useLang();
  const opts = emoji
    ? [['Niska', '🔋'], ['Normalna', '⚡'], ['Wysoka', '🔥']]
    : [['Niska', null], ['Normalna', null], ['Wysoka', null]];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {opts.map(([name, icon]) => {
        const on = value === name;
        return (
          <div
            key={name}
            onClick={() => onChange(name)}
            style={{
              position: 'relative', padding: '14px 10px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
              background: on ? 'rgba(124,92,255,.12)' : 'rgba(255,255,255,.035)',
              border: '1.5px solid ' + (on ? 'rgba(124,92,255,.6)' : 'rgba(255,255,255,.08)'),
            }}
          >
            {icon ? (
              <div style={{ fontSize: 20 }}>{icon}</div>
            ) : (
              <>
                <div style={{ position: 'absolute', top: 8, right: 8, width: 17, height: 17, borderRadius: '50%', background: '#7c5cff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0 }}>
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.8 2.8L9 1.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <BatteryIcon level={name} />
              </>
            )}
            <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: icon ? 6 : 8 }}>{t(VALUE_KEY[name]) || name}</div>
          </div>
        );
      })}
    </div>
  );
}

function BatteryIcon({ level }) {
  const w = level === 'Niska' ? 3.4 : level === 'Normalna' ? 8.4 : 13.4;
  return (
    <svg width="20" height="12" viewBox="0 0 22 12" fill="none" style={{ marginBottom: 8 }}>
      <rect x=".8" y=".8" width="17" height="10.4" rx="2.4" stroke="#c9c9d6" strokeWidth="1.2" />
      <rect x="2.6" y="2.6" width={w} height="6.8" rx="1" fill="#c9c9d6" />
      <path d="M19.6 4.2v3.6" stroke="#c9c9d6" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BottomSheet({ children, maxHeight = '86%' }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 76, background: 'rgba(6,6,10,.75)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end' }}>
      <div className="sc" style={{ width: '100%', maxHeight, overflowY: 'auto', padding: 20, borderRadius: '24px 24px 0 0', background: '#101018', borderTop: '1px solid rgba(255,255,255,.12)', animation: 'fadeUp .3s ease both' }}>
        {children}
      </div>
    </div>
  );
}

export function ConfirmCard({ title, sub, onDone, buttonLabel }) {
  const { t } = useLang();
  const label = buttonLabel || t('sum.backToStart');
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 78, background: 'rgba(6,6,10,.72)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', padding: 20 }}>
      <div style={{ width: '100%', padding: 20, borderRadius: 24, background: '#101018', border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 -20px 50px rgba(0,0,0,.5)', animation: 'fadeUp .3s ease both' }}>
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <div style={{ width: 30, height: 30, flex: 'none', borderRadius: 10, background: 'rgba(53,208,127,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="11" viewBox="0 0 13 11" fill="none"><path d="M1 5.6L4.6 9.4 12 1.6" stroke="#35d07f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{title}</div>
            {sub && <div style={{ fontSize: 12.5, color: '#a3a3b3', marginTop: 6 }}>{sub}</div>}
          </div>
        </div>
        <div onClick={onDone} style={{ marginTop: 16, height: 52, borderRadius: 16, background: 'linear-gradient(160deg,#8b6dff,#6d4dff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15.5, fontWeight: 700, cursor: 'pointer' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function GeneratingOverlay({ labels, step }) {
  const { t } = useLang();
  const last = labels.length - 1;
  const finished = step >= last;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(6,6,10,.88)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '0 36px' }}>
      <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!finished && (
          <div
            style={{
              position: 'absolute', inset: -9, borderRadius: '50%',
              border: '3px solid rgba(139,109,255,.18)', borderTopColor: '#c9baff',
              animation: 'spinRing 1s linear infinite',
            }}
          />
        )}
        <div
          key={finished ? 'done' : 'busy'}
          style={{
            width: 64, height: 64, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: finished ? 'linear-gradient(160deg,#35d07f,#2ee6c5)' : 'linear-gradient(160deg,#8b6dff,#6d4dff)',
            boxShadow: finished ? '0 0 40px rgba(53,208,127,.45)' : '0 0 40px rgba(124,92,255,.5)',
            animation: finished ? 'stepIconPop .4s cubic-bezier(.34,1.56,.64,1) both' : 'pulseGlow 1.4s ease-in-out infinite',
          }}
        >
          {finished && (
            <svg width="26" height="20" viewBox="0 0 13 11" fill="none">
              <path d="M1 5.6L4.6 9.4 12 1.6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <div key={step} style={{ fontSize: 17, fontWeight: 700, color: '#f4f4f7', textAlign: 'center', lineHeight: 1.4, animation: 'stepIn .4s ease both' }}>
        {t(labels[step])}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {labels.map((_, i) => (
          <span
            key={i}
            style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 99,
              background: i < step ? '#35d07f' : i === step ? '#8b6dff' : 'rgba(255,255,255,.15)',
              transition: 'width .3s ease, background .3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function SectionTitle({ children, style }) {
  return <div style={{ fontSize: 16.5, fontWeight: 750, letterSpacing: '-.01em', margin: '22px 0 12px', ...style }}>{children}</div>;
}

export function LabelRequired({ label, tag, tagColor = '#a58cff' }) {
  const { t } = useLang();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, margin: '22px 0 11px' }}>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 11.5, color: tagColor }}>{tag || t('ui.required')}</span>
    </div>
  );
}
