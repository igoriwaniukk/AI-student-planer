import { useEffect, useRef, useState } from 'react';
import { RARITY_COLOR } from '../../lib/pugWorld/catalog.js';
import { MAX_LEVEL } from '../../lib/pugWorld/logic.js';
import { useLang } from '../../lib/useLang';
import { CARD, PURPLE, RARITY_BRIGHT, GREEN, COIN_ARRIVE_MS } from './theme';
import { CoinIcon, SparkleIcon } from './icons';

// Small shared pieces of the Pug World screens.

export function Card({ title, right, children, style }) {
  return (
    <div style={{ ...CARD, marginTop: 12, ...style }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 750 }}>{title}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// `solid`: white on the rarity's bright colour (the big dog); solid="white":
// the rarity's colour on white (on a background already in that colour).
export function RarityPill({ rarity, small, solid }) {
  const { t } = useLang();
  const c = RARITY_COLOR[rarity];
  const [, base, shade] = RARITY_BRIGHT[rarity];
  const look = solid === 'white'
    ? { color: shade, background: '#fff', borderRadius: 8, boxShadow: '0 2px 0 rgba(0,0,0,.15)' }
    : solid
      ? { color: '#fff', background: base, borderRadius: 8, boxShadow: `0 2px 0 ${shade}` }
      : { color: c, background: c + '22', border: `1px solid ${c}55`, borderRadius: 99 };
  return (
    <span style={{ fontSize: small ? 9 : 10.5, fontWeight: 900, letterSpacing: '.08em', padding: small ? '2px 6px' : '3px 8px', textTransform: 'uppercase', whiteSpace: 'nowrap', ...look }}>
      {t('pw.rarity.' + rarity)}
    </span>
  );
}

export function Stars({ level, size = 13, dim = '#3a3a4a' }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1, whiteSpace: 'nowrap' }}>
      {Array.from({ length: MAX_LEVEL }, (_, i) => <span key={i} style={{ color: i < level ? '#f5c451' : dim }}>★</span>)}
    </span>
  );
}

export function Coins({ n, size = 13 }) {
  return <span style={{ fontSize: size, fontWeight: 750, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}><CoinIcon size={size + 2} />{n}</span>;
}

export function Button({ children, onClick, disabled, ghost, style }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        height: 46, borderRadius: 14, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontSize: 14.5, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', userSelect: 'none',
        ...(ghost ? { background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#ececf3' } : { background: PURPLE, color: '#fff' }),
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function TopBar({ title, onBack, right, back = '✕' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px 10px' }}>
      <div onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.07)', display: 'grid', placeItems: 'center', fontSize: back === '✕' ? 14 : 20, color: '#c9c9d6', cursor: 'pointer', flex: 'none' }}>{back}</div>
      <div style={{ flex: 1, fontSize: 18, fontWeight: 800, letterSpacing: '-.01em', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      {right}
    </div>
  );
}

// Your coins (where reward coins fly to: data-coin-target); when they go
// up, the number counts up as the flying coins land.
export function CoinPill({ n }) {
  const [shown, setShown] = useState(n);
  const from = useRef(n);
  useEffect(() => {
    const start = from.current;
    from.current = n;
    if (n <= start) { const id = requestAnimationFrame(() => setShown(n)); return () => cancelAnimationFrame(id); }
    const t0 = performance.now() + COIN_ARRIVE_MS;
    let raf;
    const step = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / 500));
      setShown(Math.round(start + (n - start) * k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return (
    <div data-coin-target="" style={{ height: 32, padding: '0 12px', borderRadius: 99, background: 'rgba(245,165,36,.12)', border: '1px solid rgba(245,165,36,.35)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 800, color: '#ffd27a', flex: 'none' }}>
      <CoinIcon size={17} />{shown}
    </div>
  );
}

// The round Trick button that sits on the stage, right of the big dog.
export function TrickButton({ onClick }) {
  const { t } = useLang();
  return (
    <div onClick={onClick} style={{ position: 'absolute', right: 26, bottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: PURPLE, display: 'grid', placeItems: 'center', boxShadow: '0 8px 20px rgba(109,77,255,.5)' }}><SparkleIcon size={24} /></div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#c9baff' }}>{t('pw.trick')}</div>
    </div>
  );
}

// The round glowing floor under the big dog.
export function Stage({ children, height = 290, color = '#8b6dff' }) {
  return (
    <div style={{ position: 'relative', height, margin: '0 -16px' }}>
      <div style={{ position: 'absolute', left: '50%', bottom: 18, width: 260, height: 70, transform: 'translateX(-50%)', borderRadius: '50%', background: `radial-gradient(ellipse at center, ${color}55, ${color}11 60%, transparent 72%)` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );
}

// A chunky button with a pressed-down edge (Duolingo style).
// `pal` = [light, base, shade]; `text` = label colour.
export function Chunky({ children, onClick, pal = GREEN, text = '#fff', disabled, style }) {
  return (
    <div
      onClick={disabled ? undefined : (e) => { e.stopPropagation(); onClick?.(e); }}
      style={{
        height: 50, borderRadius: 16, padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 15, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase', color: text, userSelect: 'none',
        background: pal[1], boxShadow: `0 4px 0 ${pal[2]}`, marginBottom: 4, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// The big dog's stage in its rarity's bright colour, with a yellow Trick
// button. `onTap`: tapping the stage (the dog jumps).
export function ColorStage({ rarity, onTap, onTrick, height = 300, children }) {
  const { t } = useLang();
  const [light, base, shade] = RARITY_BRIGHT[rarity] || RARITY_BRIGHT.common;
  return (
    <div onClick={onTap} style={{ position: 'relative', height, borderRadius: 28, overflow: 'hidden', cursor: onTap ? 'pointer' : 'default', background: `radial-gradient(circle at 50% 46%, ${light} 0, ${base} 48%, ${shade} 100%)`, boxShadow: `0 5px 0 ${shade}`, marginBottom: 5 }}>
      {[[8, 12], [86, 18], [14, 76], [84, 72], [48, 7]].map(([x, y], i) => (
        <span key={i} style={{ position: 'absolute', left: x + '%', top: y + '%', color: '#fff', fontSize: 14, opacity: 0.75 }}>✦</span>
      ))}
      <div style={{ position: 'absolute', left: '50%', bottom: 22, width: 190, height: 22, marginLeft: -95, borderRadius: '50%', background: 'rgba(0,0,0,.16)' }} />
      <div style={{ position: 'absolute', inset: '6px 40px 8px' }}>{children}</div>
      {onTrick && (
        <div onClick={(e) => { e.stopPropagation(); onTrick(); }} style={{ position: 'absolute', right: 14, bottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ffc800', boxShadow: '0 4px 0 #e5a900', display: 'grid', placeItems: 'center' }}><SparkleIcon size={24} /></div>
          <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>{t('pw.trick')}</span>
        </div>
      )}
    </div>
  );
}
