import { RARITY_COLOR } from '../../lib/pugWorld/catalog.js';
import { MAX_LEVEL } from '../../lib/pugWorld/logic.js';
import { useLang } from '../../lib/useLang';
import { CARD, PURPLE } from './theme';

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

export function RarityPill({ rarity, small }) {
  const { t } = useLang();
  const c = RARITY_COLOR[rarity];
  return (
    <span style={{ fontSize: small ? 9 : 10, fontWeight: 800, letterSpacing: '.08em', padding: small ? '2px 6px' : '3px 8px', borderRadius: 99, color: c, background: c + '22', border: `1px solid ${c}55`, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
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
  return <span style={{ fontSize: size, fontWeight: 750, whiteSpace: 'nowrap' }}>🪙 {n}</span>;
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

export function CoinPill({ n }) {
  return (
    <div style={{ height: 32, padding: '0 12px', borderRadius: 99, background: 'rgba(245,165,36,.12)', border: '1px solid rgba(245,165,36,.35)', display: 'flex', alignItems: 'center', fontSize: 13.5, fontWeight: 800, color: '#ffd27a', flex: 'none' }}>
      🪙 {n}
    </div>
  );
}

// The round glowing floor under a 3D dog.
export function Stage({ children, height = 290, color = '#8b6dff' }) {
  return (
    <div style={{ position: 'relative', height, margin: '0 -16px' }}>
      <div style={{ position: 'absolute', left: '50%', bottom: 18, width: 260, height: 70, transform: 'translateX(-50%)', borderRadius: '50%', background: `radial-gradient(ellipse at center, ${color}55, ${color}11 60%, transparent 72%)` }} />
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  );
}
