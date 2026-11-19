import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLang } from '../../lib/useLang';
import { OUTFIT_BY_ID, OUTFIT_SETS } from '../../lib/pugWorld/catalog.js';
import { toggleOutfit, wearSet } from '../../lib/pugWorld/logic.js';
import { isNativeApp, postToApp } from '../../lib/nativeBridge';
import { AppShellPortal } from '../ui';
import { CoinIcon, OutfitPic } from './icons';
import DogThumb from './DogThumb';
import { Chunky } from './bits';
import { KIND_BRIGHT } from './theme';

// Buying an outfit or a set in the Shop ("charge & flash" like the chests):
// your coins fly from the counter into the middle, a flash, then what you
// bought pops out on a bright sunburst with confetti — "Put it on" wears it
// on your favourite dog right away. `item` = { kind: 'outfit' | 'set', id }.
const KEYFRAMES = `
@keyframes pwSrIn{from{opacity:0}to{opacity:1}}
@keyframes pwSrCoin{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(.35)}}
@keyframes pwSrFlash{0%{opacity:0;transform:scale(.3)}30%{opacity:1}100%{opacity:0;transform:scale(2.6)}}
@keyframes pwSrPop{0%{opacity:0;transform:scale(.2)}60%{opacity:1;transform:scale(1.12)}100%{opacity:1;transform:none}}
@keyframes pwSrUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes pwSrSpin{to{transform:rotate(360deg)}}
@keyframes pwSrConf{0%{opacity:0;transform:translate(0,0)}3%{opacity:1}70%{opacity:1;transform:translate(var(--dx),var(--dy)) rotate(var(--r))}100%{opacity:0;transform:translate(var(--dx),calc(var(--dy) + 90px)) rotate(var(--r))}}
`;
const POP = 720; // ms: coins fly in before it, the item pops after
const COINS = Array.from({ length: 8 }, (_, i) => ({ delay: i * 45, dx: (i % 4 - 1.5) * 14, size: 22 + (i % 3) * 3 }));
const CONF_COLORS = ['#ff4b4b', '#ffc800', '#58cc02', '#1cb0f6', '#ce82ff', '#ffffff'];
const CONFETTI = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const r = 120 + ((i * 37) % 80);
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r, r: (i * 53) % 540, w: 6 + (i % 4) * 2, color: CONF_COLORS[i % 6], delay: POP + (i % 5) * 20 };
});

export default function ShopReveal({ pw, item, onClose }) {
  const { t } = useLang();
  const box = useRef(null);
  const { state, update } = pw;
  const fav = state.favorite && state.dogs[state.favorite] ? state.favorite : Object.keys(state.dogs)[0];
  const set = item.kind === 'set' ? OUTFIT_SETS.find((x) => x.id === item.id) : null;
  const worn = set ? Object.fromEntries(set.parts.map((p) => [OUTFIT_BY_ID[p].slot, p])) : null;
  const [light, base, shade] = KIND_BRIGHT.outfit;

  // Where the coins come from: the coin counter, measured from the middle.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const B = el.getBoundingClientRect();
    const target = document.querySelector('[data-coin-target]')?.getBoundingClientRect();
    const from = target ? { x: target.left - B.left + target.width / 2, y: target.top - B.top + target.height / 2 } : { x: B.width - 56, y: 70 };
    el.style.setProperty('--fx', from.x + 'px');
    el.style.setProperty('--fy', from.y + 'px');
    el.style.setProperty('--tx', B.width / 2 - from.x + 'px');
    el.style.setProperty('--ty', B.height * 0.4 - from.y + 'px');
  }, []);
  useEffect(() => {
    if (!isNativeApp()) return undefined;
    const id = setTimeout(() => postToApp('haptic', { kind: 'success' }), POP);
    return () => clearTimeout(id);
  }, []);

  const putOn = () => {
    update((s) => {
      if (set) return wearSet(s, fav, set.id);
      const o = OUTFIT_BY_ID[item.id];
      return (s.outfits.worn[fav] || {})[o?.slot] === item.id ? s : toggleOutfit(s, fav, item.id);
    });
    onClose();
  };
  const up = (i) => ({ animation: `pwSrUp .4s ${POP + 200 + i * 90}ms ease-out both` });
  return (
    <AppShellPortal>
      <div ref={box} style={{ position: 'absolute', inset: 0, zIndex: 125, overflow: 'hidden', background: `radial-gradient(circle at 50% 40%, ${light} 0, ${base} 45%, ${shade} 100%)`, animation: 'pwSrIn .25s ease both', display: 'flex', flexDirection: 'column', paddingTop: 'var(--top-pad)', paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}>
        <style>{KEYFRAMES}</style>
        <div style={{ position: 'absolute', left: '50%', top: '40%', width: 900, height: 900, marginLeft: -450, marginTop: -450, pointerEvents: 'none' }}>
          <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'repeating-conic-gradient(rgba(255,255,255,.2) 0deg 8deg, transparent 8deg 22.5deg)', WebkitMaskImage: 'radial-gradient(circle, #000 8%, transparent 65%)', maskImage: 'radial-gradient(circle, #000 8%, transparent 65%)', animation: 'pwSrSpin 30s linear infinite' }} />
        </div>
        {/* your coins fly from the counter into the middle */}
        {COINS.map((c, i) => (
          <span key={'c' + i} style={{ position: 'absolute', left: `calc(var(--fx, 80%) - ${c.size / 2}px + ${c.dx}px)`, top: `calc(var(--fy, 70px) - ${c.size / 2}px)`, animation: `pwSrCoin 600ms ${c.delay}ms cubic-bezier(.5,0,.8,.6) both`, pointerEvents: 'none' }}>
            <CoinIcon size={c.size} />
          </span>
        ))}
        <div style={{ position: 'absolute', left: '50%', top: '40%', width: 200, height: 200, marginLeft: -100, marginTop: -100, borderRadius: '50%', background: 'radial-gradient(circle, #fff, rgba(255,255,255,.7) 40%, transparent 70%)', animation: `pwSrFlash 600ms ${POP - 80}ms ease-out both`, pointerEvents: 'none' }} />
        {CONFETTI.map((c, i) => (
          <i key={'k' + i} style={{ position: 'absolute', left: '50%', top: '40%', width: c.w, height: c.w * 1.6, borderRadius: 2, background: c.color, '--dx': c.dx + 'px', '--dy': c.dy + 'px', '--r': c.r + 'deg', animation: `pwSrConf 1.3s ${c.delay}ms cubic-bezier(.2,.8,.4,1) both`, pointerEvents: 'none' }} />
        ))}

        <div style={{ position: 'relative', textAlign: 'center', marginTop: 28, fontSize: 13, fontWeight: 900, letterSpacing: '.16em', color: '#fff', textShadow: '0 2px 0 rgba(0,0,0,.18)', ...up(0) }}>{t('pw.res.outfit')}</div>
        <div style={{ position: 'relative', flex: 1, display: 'grid', placeItems: 'center' }}>
          <div style={{ animation: `pwSrPop .55s ${POP}ms cubic-bezier(.3,1.5,.5,1) both` }}>
            {set
              ? <div style={{ width: 230, height: 230, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 0 rgba(0,0,0,.12)' }}><DogThumb dogId={fav} worn={worn} size={210} /></div>
              : <div style={{ width: 210, height: 210, borderRadius: '50%', background: 'rgba(255,255,255,.92)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 0 rgba(0,0,0,.12)' }}><OutfitPic id={item.id} size={150} /></div>}
          </div>
        </div>
        <div style={{ position: 'relative', padding: '0 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', textShadow: '0 2px 0 rgba(0,0,0,.18)', ...up(1) }}>{set ? t('pw.set.' + set.id) : t('pw.outfit.' + item.id)}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, ...up(2) }}>
            <Chunky style={{ flex: 1 }} onClick={putOn}>{t('pw.wearSet')}</Chunky>
            <Chunky pal={['#fff', '#fff', 'rgba(0,0,0,.18)']} text={shade} style={{ flex: 1 }} onClick={onClose}>{t('pw.done')}</Chunky>
          </div>
        </div>
      </div>
    </AppShellPortal>
  );
}
