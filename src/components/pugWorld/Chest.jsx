import { useId } from 'react';
import { CHEST_COLORS } from './theme';

// The chests: small (wood), silver, gold, epic (purple). A shiny lid with a
// highlight, a metal band, a lock with a keyhole, rivets, a soft glow in the
// chest's colour (bigger sizes) and a sparkle on gold and epic. `locked` =
// grey and faded (none of that type yet); `open` lifts the lid (opening).
const mix = (hex, to, k) => {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k);
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('');
};

export default function ChestIcon({ type = 'small', size = 56, open = false, locked = false, glow, style }) {
  const c = CHEST_COLORS[type] || CHEST_COLORS.small;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const hi = mix(c.lid, '#ffffff', 0.55);
  const bodyDark = mix(c.body, '#000000', 0.25);
  const bandLight = mix(c.band, '#ffffff', 0.45);
  const bandDark = mix(c.band, '#000000', 0.3);
  const showGlow = (glow ?? size >= 40) && !locked;
  const sparkle = (type === 'gold' || type === 'epic') && !locked;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block', overflow: 'visible', ...(locked ? { filter: 'grayscale(1)', opacity: 0.35 } : {}), ...style }}>
      <defs>
        <linearGradient id={id + 'l'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={hi} /><stop offset=".55" stopColor={c.lid} /><stop offset="1" stopColor={c.body} /></linearGradient>
        <linearGradient id={id + 'b'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.body} /><stop offset="1" stopColor={bodyDark} /></linearGradient>
        <linearGradient id={id + 'm'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={bandLight} /><stop offset=".5" stopColor={bandDark} /><stop offset="1" stopColor={bandLight} /></linearGradient>
        <filter id={id + 'g'} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      {showGlow && <ellipse cx="32" cy="34" rx="25" ry="21" fill={c.lid} opacity=".5" filter={`url(#${id}g)`} />}
      <ellipse cx="32" cy="58.5" rx="22" ry="3.2" fill="rgba(0,0,0,.35)" />
      <rect x="9" y="28" width="46" height="28" rx="6" fill={`url(#${id}b)`} stroke={c.band} strokeWidth="2" />
      <rect x="27" y="29" width="10" height="26" fill={`url(#${id}m)`} />
      <circle cx="14" cy="51" r="1.8" fill={bandLight} stroke={bandDark} strokeWidth=".8" />
      <circle cx="50" cy="51" r="1.8" fill={bandLight} stroke={bandDark} strokeWidth=".8" />
      <g style={{ transformOrigin: '32px 28px', transform: open ? 'translateY(-10px) rotate(-14deg)' : 'none', transition: 'transform .35s ease' }}>
        <path d="M9 30 V22 C9 13 18 8 32 8 C46 8 55 13 55 22 V30 Z" fill={`url(#${id}l)`} stroke={c.band} strokeWidth="2" strokeLinejoin="round" />
        <path d="M14.5 21 C15.5 15.5 21.5 12 29 11.4" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity=".75" />
        <rect x="27" y="9" width="10" height="20" fill={`url(#${id}m)`} />
      </g>
      <rect x="24.5" y="24" width="15" height="14" rx="3.2" fill={c.band} stroke={bandDark} strokeWidth="1.4" />
      <rect x="26.5" y="26" width="11" height="10" rx="2" fill={bandLight} />
      <circle cx="32" cy="29.6" r="1.9" fill={bandDark} />
      <path d="M31 30.5 L33 30.5 L33.6 34 L30.4 34 Z" fill={bandDark} />
      {sparkle && <path d="M50 6 Q51 11 56 12 Q51 13 50 18 Q49 13 44 12 Q49 11 50 6 Z" fill="#fff" />}
    </svg>
  );
}
