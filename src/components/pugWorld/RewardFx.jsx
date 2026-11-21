import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { isNativeApp, postToApp } from '../../lib/nativeBridge';
import { AppShellPortal } from '../ui';
import { CoinIcon } from './icons';
import { COIN_ARRIVE_MS } from './theme';

// Collecting coins ("charge & flash", right where they come from): coins
// you get outside a chest (daily reward, approving a plan…) burst from
// where you just tapped (else the middle) with sparks and confetti, and
// fly to your coin counter (or the top right corner), with "+N" floating
// up. Finished missions have their own screen (MissionProgress).
const KEYFRAMES = `
@keyframes pwFxSp{0%{opacity:0;transform:translate(var(--x),var(--y))}20%{opacity:1}100%{opacity:0;transform:translate(0,0) scale(.4)}}
@keyframes pwFxFlash{0%{opacity:0;transform:scale(.4)}25%{opacity:1}100%{opacity:0;transform:scale(1.5)}}
@keyframes pwFxCoin{0%{opacity:0;transform:translate(0,0) scale(.4)}8%{opacity:1}35%{transform:translate(var(--sx),var(--sy)) scale(1.05)}100%{opacity:.2;transform:translate(var(--tx),var(--ty)) scale(.5)}}
@keyframes pwFxUp{0%{opacity:0;transform:translateY(10px) scale(.6)}20%{opacity:1;transform:none}80%{opacity:1;transform:translateY(-30px)}100%{opacity:0;transform:translateY(-44px)}}
@keyframes pwFxConf{0%{opacity:0;transform:translate(0,0)}3%{opacity:1}70%{opacity:1;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 60px)) rotate(var(--r))}}
`;
const DURATION = 2700;
const BURST = 900; // ms: sparks and shaking before it, coins after
const SPARKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const r = 70 + (i % 3) * 22;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, delay: (i % 6) * 90 };
});
const COINS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.4;
  const r = 40 + (i % 3) * 18;
  return { sx: Math.cos(a) * r, sy: Math.sin(a) * r, delay: BURST + i * 40, size: 20 + (i % 3) * 3 };
});
const CONF_COLORS = ['#ff4b4b', '#ffc800', '#58cc02', '#1cb0f6', '#ce82ff', '#ffffff'];
const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  const r = 60 + ((i * 29) % 40);
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, r: (i * 61) % 400, w: 5 + (i % 3) * 2, color: CONF_COLORS[i % 6] };
});

// Where the last tap was (screen coordinates), for coins without a row.
let lastTap = { x: 0, y: 0, t: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => { lastTap = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
}

export default function RewardFx({ pw }) {
  const fx = pw?.enabled ? pw.fx : null;
  if (!fx) return null;
  return <Fx key={fx.at} fx={fx} onDone={pw.clearFx} />;
}

const center = (r, box) => ({ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 });

function Fx({ fx, onDone }) {
  const box = useRef(null);
  const [geo, setGeo] = useState(null); // { from, to }

  // From the last tap (or the middle) to the coin counter, if one is showing.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const B = el.getBoundingClientRect();
    const onScreen = (r) => r.width > 0 && r.top >= B.top + 40 && r.bottom <= B.bottom - 90;
    const target = [...document.querySelectorAll('[data-coin-target]')].map((n) => n.getBoundingClientRect()).find(onScreen);
    const to = target ? center(target, B) : { x: B.width - 56, y: 70 };
    const recent = Date.now() - lastTap.t < 1500;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGeo({ from: recent ? { x: lastTap.x - B.left, y: lastTap.y - B.top } : { x: B.width / 2, y: B.height / 2 }, to });
  }, []);

  // The counter bumps when the coins land.
  useEffect(() => {
    if (!geo) return undefined;
    const target = document.querySelector('[data-coin-target]');
    const a = target?.animate?.([{ transform: 'none' }, { transform: 'scale(1.22)' }, { transform: 'none' }], { duration: 380, delay: COIN_ARRIVE_MS - 100 });
    return () => a?.cancel();
  }, [geo]);

  useEffect(() => {
    if (isNativeApp()) postToApp('haptic', { kind: 'success' });
    const id = setTimeout(onDone, DURATION);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCoins = geo && fx.coins > 0;
  const charge = showCoins;
  return (
    <AppShellPortal>
      <div ref={box} style={{ position: 'absolute', inset: 0, zIndex: 130, pointerEvents: 'none', overflow: 'hidden' }}>
        <style>{KEYFRAMES}</style>
        {charge && (
          <>
            {SPARKS.map((s, i) => (
              <span key={'s' + i} style={{ position: 'absolute', left: geo.from.x - 4, top: geo.from.y - 4, width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px #ffd84d, 0 0 4px #fff', '--x': s.x + 'px', '--y': s.y + 'px', animation: `pwFxSp 600ms ${s.delay}ms ease-in both` }} />
            ))}
            <div style={{ position: 'absolute', left: geo.from.x - 60, top: geo.from.y - 60, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, #fff, rgba(255,216,77,.8) 40%, transparent 70%)', animation: `pwFxFlash 500ms ${BURST - 60}ms ease-out both` }} />
            {CONFETTI.map((c, i) => (
              <i key={'c' + i} style={{ position: 'absolute', left: geo.from.x, top: geo.from.y, width: c.w, height: c.w * 1.6, borderRadius: 2, background: c.color, '--dx': c.dx + 'px', '--dy': c.dy + 'px', '--r': c.r + 'deg', animation: `pwFxConf 1.1s ${BURST}ms cubic-bezier(.2,.8,.4,1) both` }} />
            ))}
          </>
        )}
        {showCoins && (
          <>
            {COINS.map((c, i) => (
              <span key={'k' + i} style={{ position: 'absolute', left: geo.from.x - c.size / 2, top: geo.from.y - c.size / 2, width: c.size, height: c.size, '--sx': c.sx + 'px', '--sy': c.sy + 'px', '--tx': geo.to.x - geo.from.x + 'px', '--ty': geo.to.y - geo.from.y + 'px', animation: `pwFxCoin 1050ms ${c.delay}ms cubic-bezier(.3,.7,.4,1) both`, filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.25))' }}>
                <CoinIcon size={c.size} />
              </span>
            ))}
            <div style={{ position: 'absolute', left: geo.from.x - 80, width: 160, top: geo.from.y - 52, display: 'flex', justifyContent: 'center', animation: `pwFxUp 1200ms ${BURST + 50}ms ease-out both` }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 26, fontWeight: 900, color: '#ffd84d', textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>
                <CoinIcon size={24} />+{fx.coins}
              </span>
            </div>
          </>
        )}
      </div>
    </AppShellPortal>
  );
}
