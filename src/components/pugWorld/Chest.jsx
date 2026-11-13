import { CHEST_COLORS } from './theme';


export default function ChestIcon({ type = 'small', size = 56, open = false, style }) {
  const c = CHEST_COLORS[type] || CHEST_COLORS.small;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block', overflow: 'visible', ...style }}>
      <ellipse cx="32" cy="58" rx="22" ry="3.5" fill="rgba(0,0,0,.35)" />
      <rect x="9" y="28" width="46" height="28" rx="6" fill={c.body} />
      <rect x="9" y="28" width="46" height="5" fill="rgba(0,0,0,.12)" />
      <g style={{ transformOrigin: '32px 28px', transform: open ? 'translateY(-10px) rotate(-14deg)' : 'none', transition: 'transform .35s ease' }}>
        <path d="M9 30 V22 C9 13 18 8 32 8 C46 8 55 13 55 22 V30 Z" fill={c.lid} />
        <path d="M9 30 V22 C9 13 18 8 32 8 C46 8 55 13 55 22 V30 Z" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
        <rect x="27" y="8.5" width="10" height="21.5" fill={c.band} opacity=".85" />
      </g>
      <rect x="27" y="28" width="10" height="28" fill={c.band} opacity=".85" />
      <rect x="25.5" y="26" width="13" height="12" rx="3" fill={c.band} />
      <circle cx="32" cy="32" r="2.2" fill={c.lid} />
      {type === 'epic' && <path d="M48 12 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="#fff" opacity=".9" />}
      {type === 'gold' && <path d="M14 14 l1.2 2.8 2.8 1.2 -2.8 1.2 -1.2 2.8 -1.2 -2.8 -2.8 -1.2 2.8 -1.2z" fill="#fff" opacity=".9" />}
    </svg>
  );
}
