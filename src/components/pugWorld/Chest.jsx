import { useId } from 'react';

// The chests (treasure style): small (wood + iron), silver (steel + a blue
// jewel), gold (gold + a ruby), epic (purple + gold bands, a pink jewel and
// glowing runes). Wooden planks with grain, metal bands with rivets and
// corner caps, a shield lock; silver and better glow and sparkle.
// `locked` = grey and faded (none of that type yet); `open` lifts the lid
// (opening).
const PAL = {
  small: { lid: ['#e8a86a', '#c47a3a'], body: ['#b86d30', '#7e4218'], dark: '#4f280c', band: ['#c3ccd6', '#7a8491', '#3b424b'], gem: null, glow: '#ffb15c' },
  silver: { lid: ['#ffffff', '#c9d5e2'], body: ['#bccadb', '#7f92a8'], dark: '#435366', band: ['#ffffff', '#cfd8e2', '#7f8b99'], gem: ['#d6f3ff', '#1cb0f6', '#075f8f'], glow: '#9fdcff' },
  gold: { lid: ['#fff3a8', '#ffc800'], body: ['#f7bb00', '#c98600'], dark: '#7a4d00', band: ['#fff0b8', '#d4921a', '#7a4d05'], gem: ['#ffd0d0', '#ff4b4b', '#9a1414'], glow: '#ffd84d' },
  epic: { lid: ['#ecd6ff', '#a66cff'], body: ['#9457f2', '#5523b3'], dark: '#2f0f6e', band: ['#fff4c2', '#ffc84d', '#a8730f'], gem: ['#ffe3f5', '#ff4fb8', '#9a0f74'], glow: '#d6a8ff' },
};
const LID = 'M12 62 V46 C12 27 33 17 60 17 C87 17 108 27 108 46 V62 Z';

function Star({ x, y, r }) {
  return <path d={`M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r}Z`} fill="#fff" />;
}

export default function ChestIcon({ type = 'small', size = 56, open = false, locked = false, glow, style }) {
  const c = PAL[type] || PAL.small;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [bl, bm, bd] = c.band;
  const showGlow = (glow ?? size >= 40) && !locked && type !== 'small';
  const sparkle = !locked && size >= 30 && (type === 'gold' || type === 'epic');
  const fine = size >= 36; // rivets, grain and runes only where they can be seen
  const rivet = (x, y) => (
    <g key={x + '-' + y}>
      <circle cx={x} cy={y} r="2.3" fill={bl} stroke={bd} strokeWidth="1" />
      <circle cx={x - 0.7} cy={y - 0.7} r=".8" fill="#fff" opacity=".9" />
    </g>
  );
  const runes = 'M38 72 l4 6 l4 -6 l4 6 M70 72 l4 6 l4 -6 l4 6 M38 94 h8 M74 94 h8';
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: 'block', overflow: 'visible', ...(locked ? { filter: 'grayscale(1)', opacity: 0.35 } : {}), ...style }}>
      <defs>
        <linearGradient id={id + 'l'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.lid[0]} /><stop offset="1" stopColor={c.lid[1]} /></linearGradient>
        <linearGradient id={id + 'b'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.body[0]} /><stop offset="1" stopColor={c.body[1]} /></linearGradient>
        <linearGradient id={id + 'm'} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={bm} /><stop offset=".35" stopColor={bl} /><stop offset=".7" stopColor={bm} /><stop offset="1" stopColor={bd} /></linearGradient>
        <linearGradient id={id + 'h'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={bl} /><stop offset=".5" stopColor={bm} /><stop offset="1" stopColor={bd} /></linearGradient>
        {c.gem && <radialGradient id={id + 'g'} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor={c.gem[0]} /><stop offset=".45" stopColor={c.gem[1]} /><stop offset="1" stopColor={c.gem[2]} /></radialGradient>}
        <filter id={id + 'f'} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id={id + 's'} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" /></filter>
        <clipPath id={id + 'c'}><rect x="14" y="60" width="92" height="45" rx="6" /></clipPath>
        <clipPath id={id + 'k'}><path d={LID} /></clipPath>
      </defs>
      {showGlow && <ellipse cx="60" cy="62" rx="52" ry="44" fill={c.glow} opacity=".55" filter={`url(#${id}f)`} />}
      <ellipse cx="60" cy="109" rx="46" ry="6.5" fill="rgba(0,0,0,.38)" />

      {/* body: planks, grain, metal bands, corners */}
      <rect x="14" y="60" width="92" height="45" rx="6" fill={`url(#${id}b)`} stroke={c.dark} strokeWidth="2.5" />
      <g clipPath={`url(#${id}c)`} stroke={c.dark} fill="none" strokeLinecap="round">
        <path d="M14 76 H106 M14 91 H106" strokeWidth="1.6" opacity=".55" />
        {fine && <path d="M40 66 q6 -2 12 0 M66 82 q7 -2 14 0 M44 97 q5 -1.6 10 0 M70 68 q4 -1.4 8 0" strokeWidth="1.1" opacity=".35" />}
      </g>
      <rect x="18" y="63" width="84" height="3" rx="1.5" fill="#fff" opacity=".18" />
      {open && !locked && <ellipse cx="60" cy="60" rx="40" ry="9" fill={c.glow} filter={`url(#${id}s)`} />}
      <path d="M21 60 H31 V105 H21 Z" fill={`url(#${id}m)`} stroke={bd} strokeWidth="1.4" />
      <path d="M89 60 H99 V105 H89 Z" fill={`url(#${id}m)`} stroke={bd} strokeWidth="1.4" />
      {fine && [72, 86, 98].map((y) => [rivet(26, y), rivet(94, y)])}
      <path d="M11 87 V106 H30 V99 H18 V87 Z" fill={`url(#${id}h)`} stroke={bd} strokeWidth="1.3" />
      <path d="M109 87 V106 H90 V99 H102 V87 Z" fill={`url(#${id}h)`} stroke={bd} strokeWidth="1.3" />
      {fine && rivet(14.5, 102)}{fine && rivet(105.5, 102)}
      {type === 'epic' && !locked && fine && (
        <>
          <path d={runes} stroke="#ffe3f5" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".9" filter={`url(#${id}s)`} />
          <path d={runes} stroke="#fff" strokeWidth=".9" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* lid: boards, shine, bands, rim (lifts when opening) */}
      <g style={{ transformOrigin: '60px 60px', transform: open ? 'translateY(-14px) rotate(-12deg)' : 'none', transition: 'transform .35s ease' }}>
        <path d={LID} fill={`url(#${id}l)`} stroke={c.dark} strokeWidth="2.5" strokeLinejoin="round" />
        <g clipPath={`url(#${id}k)`} stroke={c.dark} fill="none" strokeLinecap="round">
          <path d="M38 19 C35.5 32 35.5 48 36 62 M82 19 C84.5 32 84.5 48 84 62" strokeWidth="1.5" opacity=".42" />
          {fine && <path d="M46 28 q5 -1.5 10 0 M66 40 q6 -2 12 0 M44 50 q4 -1.4 8 0" strokeWidth="1.1" opacity=".3" />}
        </g>
        <path d="M20 46 C21 33 34 25 52 22.5" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity=".6" />
        <path d="M58 21.5 C62 21.4 65 21.6 67 22" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".5" />
        <path d="M21 34 C22.5 27 26 23.5 31 21.6 V60 H21 Z" fill={`url(#${id}m)`} stroke={bd} strokeWidth="1.4" />
        <path d="M99 34 C97.5 27 94 23.5 89 21.6 V60 H99 Z" fill={`url(#${id}m)`} stroke={bd} strokeWidth="1.4" />
        {fine && [42, 52].map((y) => [rivet(26, y), rivet(94, y)])}
        <rect x="9" y="56" width="102" height="9.5" rx="3.5" fill={`url(#${id}h)`} stroke={bd} strokeWidth="1.5" />
        {fine && [16, 40, 80, 104].map((x) => rivet(x, 60.8))}
      </g>
      {showGlow && !open && <rect x="33" y="64.5" width="54" height="2" rx="1" fill={c.glow} filter={`url(#${id}s)`} />}

      {/* the lock: a shield with a jewel (silver and better) and a keyhole */}
      <path d="M46 50 H74 V70 C74 80 67 86 60 89.5 C53 86 46 80 46 70 Z" fill={`url(#${id}m)`} stroke={bd} strokeWidth="2" />
      {fine && <path d="M49.5 53 H70.5 V69.5 C70.5 77.5 65 82.5 60 85.3 C55 82.5 49.5 77.5 49.5 69.5 Z" fill="none" stroke={bl} strokeWidth="1" opacity=".8" />}
      {c.gem ? (
        <>
          <circle cx="60" cy="64" r="8.5" fill={bd} />
          <path d="M60 56.5 L67 61 L67 67.5 L60 72 L53 67.5 L53 61 Z" fill={`url(#${id}g)`} stroke={c.gem[2]} strokeWidth="1" />
          <path d="M60 56.5 L67 61 L60 64 L53 61 Z" fill="#fff" opacity=".35" />
          <path d="M55.5 60.5 L58.5 58.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="60" cy="79" r="2.4" fill={bd} />
          <path d="M58.8 79.5 H61.2 L61.8 84 H58.2 Z" fill={bd} />
        </>
      ) : (
        <>
          <circle cx="60" cy="66" r="3.6" fill={bd} />
          <path d="M58.4 67 H61.6 L62.6 75 H57.4 Z" fill={bd} />
        </>
      )}
      {sparkle && <><Star x={102} y={18} r={7} /><Star x={14} y={32} r={4.5} /><Star x={110} y={52} r={3.5} /></>}
      {type === 'silver' && !locked && size >= 30 && <Star x={103} y={22} r={5} />}
    </svg>
  );
}
