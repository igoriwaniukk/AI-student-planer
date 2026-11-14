import { useId, useMemo } from 'react';
import { outfitSVG } from './dogArt';

// Pug World's small icons, drawn (no emoji: the coin emoji is silver on iPhone).
export function CoinIcon({ size = 16, style }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ display: 'inline-block', verticalAlign: '-0.18em', flex: 'none', ...style }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe98f" /><stop offset="1" stopColor="#e9a520" /></linearGradient></defs>
      <circle cx="10" cy="10" r="9" fill={`url(#${id})`} stroke="#b9801c" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="6.2" fill="none" stroke="#c48a1e" strokeWidth="1" opacity=".7" />
      <path d="M10 6.2l1.1 2.4 2.6.3-1.9 1.8.5 2.6L10 12l-2.3 1.3.5-2.6-1.9-1.8 2.6-.3z" fill="#fff6c8" opacity=".9" />
    </svg>
  );
}

export function SparkleIcon({ size = 22, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'block' }}>
      <path d="M10 2.5l1.7 5.3 5.3 1.7-5.3 1.7L10 16.5l-1.7-5.3L3 9.5l5.3-1.7z" />
      <path d="M18 13.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" />
    </svg>
  );
}

export function HangerIcon({ size = 20, color = '#2ee6c5' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: 'none' }}>
      <path d="M12 9.5V8.6c0-.7.5-1.2 1.2-1.6A2.2 2.2 0 1 0 9.8 5" />
      <path d="M12 9.5L3 16.2c-.8.6-.4 1.8.6 1.8h16.8c1 0 1.4-1.2.6-1.8z" />
    </svg>
  );
}

// An outfit drawn on its own, in the dogs' sticker style.
export function OutfitPic({ id, size = 48, style }) {
  const svg = useMemo(() => outfitSVG(id, size), [id, size]);
  return <span style={{ display: 'inline-block', width: size, height: size, flex: 'none', ...style }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
