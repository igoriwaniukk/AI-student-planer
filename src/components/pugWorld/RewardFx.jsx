import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLang } from '../../lib/useLang';
import { MISSION_COINS } from '../../lib/pugWorld/logic.js';
import { isNativeApp, postToApp } from '../../lib/nativeBridge';
import { AppShellPortal } from '../ui';
import { CoinIcon } from './icons';

// The reward animation, over any screen: coins you just got pop out in the
// middle and fly up to the top right (where your coins are counted), with a
// big "+15"; a finished mission also slides a "Mission complete!" card down
// from the top. Once per reward, ~1.6 s, then it goes away by itself.
const KEYFRAMES = `
@keyframes pwCoinFly{0%{transform:translate(0,0) scale(.3);opacity:0}12%{opacity:1}35%{transform:translate(var(--sx),var(--sy)) scale(1.05)}100%{transform:translate(var(--tx),var(--ty)) scale(.45);opacity:.15}}
@keyframes pwPlus{0%{transform:translateY(16px) scale(.6);opacity:0}20%{transform:translateY(0) scale(1.08);opacity:1}70%{transform:translateY(-10px) scale(1);opacity:1}100%{transform:translateY(-34px) scale(.95);opacity:0}}
@keyframes pwBanner{0%{transform:translateY(-130%)}14%{transform:translateY(0)}84%{transform:translateY(0)}100%{transform:translateY(-130%)}}
`;
const COINS = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.3;
  const r = 46 + (i % 3) * 18;
  return { sx: Math.cos(a) * r, sy: Math.sin(a) * r, delay: i * 35, size: 22 + (i % 3) * 4 };
});
const DURATION = 1700;

export default function RewardFx({ pw }) {
  const fx = pw?.enabled ? pw.fx : null;
  if (!fx) return null;
  return <Fx key={fx.at} fx={fx} onDone={pw.clearFx} />;
}

function Fx({ fx, onDone }) {
  const { t } = useLang();
  const box = useRef(null);
  // Where the coins fly to: the top right corner, measured from the middle.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--tx', `${r.width / 2 - 56}px`);
    el.style.setProperty('--ty', `${-(r.height * 0.5 - 70)}px`);
  }, []);
  useEffect(() => {
    if (isNativeApp()) postToApp('haptic', { kind: 'success' });
    const id = setTimeout(onDone, DURATION);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <AppShellPortal>
      <div ref={box} style={{ position: 'absolute', inset: 0, zIndex: 130, pointerEvents: 'none', overflow: 'hidden' }}>
        <style>{KEYFRAMES}</style>
        {fx.coins > 0 && (
          <>
            {COINS.map((c, i) => (
              <span key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: c.size, height: c.size, marginLeft: -c.size / 2, marginTop: -c.size / 2, '--sx': c.sx + 'px', '--sy': c.sy + 'px', animation: `pwCoinFly 1.1s ${c.delay}ms cubic-bezier(.3,.7,.4,1) both`, filter: 'drop-shadow(0 3px 0 rgba(0,0,0,.25))' }}>
                <CoinIcon size={c.size} />
              </span>
            ))}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(50% + 70px)', display: 'flex', justifyContent: 'center', animation: `pwPlus ${DURATION}ms ease-out both` }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 30, fontWeight: 900, color: '#ffd84d', textShadow: '0 3px 0 rgba(0,0,0,.35)' }}>
                <CoinIcon size={30} />+{fx.coins}
              </span>
            </div>
          </>
        )}
        {fx.mission && (
          <div style={{ position: 'absolute', left: 16, right: 16, top: 'calc(var(--top-pad) + 8px)', animation: `pwBanner ${DURATION}ms ease-in-out both` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 20, background: '#58cc02', boxShadow: '0 5px 0 #46a302, 0 16px 40px rgba(0,0,0,.45)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', flex: 'none' }}>
                <svg width="20" height="16" viewBox="0 0 13 11"><path d="M1 5.6L4.6 9.4 12 1.6" stroke="#58cc02" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0, color: '#fff' }}>
                <div style={{ fontSize: 15, fontWeight: 900 }}>{t('pw.missionDone')}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.92, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('pw.mission.' + fx.mission)}</div>
              </div>
              <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 900, color: '#fff', padding: '5px 10px', borderRadius: 99, background: 'rgba(255,255,255,.22)' }}>
                <CoinIcon size={15} />+{MISSION_COINS}
              </span>
            </div>
          </div>
        )}
      </div>
    </AppShellPortal>
  );
}
